# =======================================================
# Mug Detection + Stepper Lock + RFID Scan + Backend Sender
# Raspberry Pi Pico 2 W
# =======================================================

from machine import Pin, SPI
from mfrc522 import SimpleMFRC522
import time, urequests

# -------------------------------------------------------
# BACKEND ENDPOINT  (EDIT EACH TIME)
# -------------------------------------------------------
BACKEND_URL = "https://ec463-diallo-amado.onrender.com/return"

# -------------------------------
# Pin Configuration
# -------------------------------
SENSOR_PIN = 12
BUZZER_PIN = 20
GREEN_LED_PIN = 14
RED_LED_PIN = 13

SPI_ID = 0
SCK  = 18
MOSI = 19
MISO = 16
CS   = 17
RST  = 9

# -------------------------------
# Stepper Pins
# -------------------------------
IN1 = Pin(21, Pin.OUT)
IN2 = Pin(22, Pin.OUT)
IN3 = Pin(26, Pin.OUT)
IN4 = Pin(27, Pin.OUT)
PINS = [IN1, IN2, IN3, IN4]

# -------------------------------
# Timing / Thresholds
# -------------------------------
HOLD_TO_LOCK_MS   = 4000   # mug must be present for >= 4 seconds before locking
SCAN_WINDOW_SEC   = 7.0    # longer read time since pre-hall sensor / manual door
FAILSAFE_TOTAL_MS = 15000  # never trap in a "transaction" too long

LOCK_STEPS   = 550
STEP_DELAY_S = 0.01        # 10ms per step 

# -------------------------------
# Hardware Setup
# -------------------------------
sensor = Pin(SENSOR_PIN, Pin.IN)
buzzer = Pin(BUZZER_PIN, Pin.OUT)
green  = Pin(GREEN_LED_PIN, Pin.OUT, value=0)
red    = Pin(RED_LED_PIN, Pin.OUT, value=0)

reader = SimpleMFRC522(spi_id=SPI_ID, sck=SCK, mosi=MOSI, miso=MISO, cs=CS, rst=RST)

# -------------------------------
# Stepper Sequence
# -------------------------------
SEQUENCE = [
    [1,1,0,0],
    [0,1,1,0],
    [0,0,1,1],
    [1,0,0,1]
]

locked = False

# -------------------------------
# Helper Functions
# -------------------------------
def beep(duration=0.25):
    buzzer.value(1)
    time.sleep(duration)
    buzzer.value(0)

def flash(pin, duration=0.25):
    pin.on()
    time.sleep(duration)
    pin.off()

def is_mug_present():
    """
    sensor.value()==0 means beam broken (mug present).
    """
    return sensor.value() == 0

def send_to_backend(packet):
    """Send mug + RFID data to backend server."""
    t0 = time.ticks_ms()
    try:
        print("→ Sending to backend:", packet)
        response = urequests.post(BACKEND_URL, json=packet)
        backend_latency_ms = time.ticks_diff(time.ticks_ms(), t0)
        print("→ Server response:", response.text, f"| latency= {backend_latency_ms} ms")
        response.close()
    except Exception as e:
        backend_latency_ms = time.ticks_diff(time.ticks_ms(), t0)
        print(f"❌ Backend send failed | latency= {backend_latency_ms} ms | {e}")
        flash(red); time.sleep(0.2); flash(red)

# -------------------------------
# Stepper Lock Functions
# -------------------------------
def move_stepper(steps, reverse=False):
    sequence = SEQUENCE[::-1] if reverse else SEQUENCE

    for step_count in range(steps):
        step = sequence[step_count % 4]

        for i in range(4):
            PINS[i].value(step[i])

        time.sleep(STEP_DELAY_S)

    # de-energize coils
    for pin in PINS:
        pin.value(0)

def lock_door():
    global locked
    if not locked:
        print("🔒 Locking door...")
        move_stepper(LOCK_STEPS)
        locked = True
        print("Door locked.\n")

def unlock_door():
    global locked
    if locked:
        print("🔓 Unlocking door...")
        move_stepper(LOCK_STEPS, reverse=True)
        locked = False
        print("Door unlocked.\n")

# =======================================================
# MAIN LOOP
# =======================================================

processing = False
waiting_for_removal = False
printed_waiting_msg = False  # prints "Waiting for mug to be removed..." once per cycle

print("\n===============================================")
print("   Mug Detect (4s) + Lock + RFID + Backend")
print("===============================================")
print("System ready — waiting for mugs...\n")

count = 0
limit = 5

while count < limit:

    # ----------------------------------------------------
    # CASE 1 — Mug enters and system is available
    # ----------------------------------------------------
    if is_mug_present() and not processing and not waiting_for_removal:
        print("Beam broken — mug entering...")
        t_transaction_start = time.ticks_ms()
        t_hold_start = time.ticks_ms()
        processing = True

        # Stay inside while mug remains present
        while is_mug_present():

            # failsafe cap for this "transaction"
            if time.ticks_diff(time.ticks_ms(), t_transaction_start) > FAILSAFE_TOTAL_MS:
                print("❌ FAILSAFE: transaction timeout — unlocking + resetting.")
                unlock_door()
                flash(red)
                waiting_for_removal = True
                printed_waiting_msg = False
                break

            elapsed_hold = time.ticks_diff(time.ticks_ms(), t_hold_start)

            # -Gate: must remain present >= 4 seconds -
            if elapsed_hold >= HOLD_TO_LOCK_MS:
                # Lock BEFORE counting (so aborted cycles don't count)
                lock_door()

                count += 1
                print(f"\n[Mug {count}/{limit}] Confirmed mug present for {elapsed_hold} ms")

                # -----------------------------
                # RFID SCAN (longer window)
                # Abort if removed during scan
                # -----------------------------
                print("→ Scanning RFID tag...")
                tag_detected = False
                tag_id = None
                tag_text = ""

                scan_start = time.time()
                while (time.time() - scan_start) < SCAN_WINDOW_SEC:

                    # If removed during scan, abort and do NOT count as processed beyond lock
                    if not is_mug_present():
                        print("❌ Mug removed during scan — aborting.")
                        unlock_door()
                        flash(red)
                        waiting_for_removal = True
                        printed_waiting_msg = False
                        tag_detected = False
                        tag_id = None
                        tag_text = ""
                        break

                    try:
                        rid, text = reader.read_no_block()
                        if rid:
                            tag_detected = True
                            tag_id = rid
                            tag_text = (text or "").strip()
                            break
                    except:
                        pass

                timestamp = "{:04}-{:02}-{:02} {:02}:{:02}:{:02}".format(*time.localtime()[:6])

                # If we aborted due to removal, exit this mug cycle
                if not is_mug_present() and waiting_for_removal:
                    break

                # -----------------------------
                # Successful scan
                # -----------------------------
                if tag_detected:
                    scan_latency_ms = time.ticks_diff(time.ticks_ms(), t_hold_start)
                    print(f"  [{timestamp}] ✅ RFID SUCCESS | {tag_id} | '{tag_text}' | latency= {scan_latency_ms} ms")
                    flash(green)

                    packet = {
                        "mug_id": tag_id,
                        "rfid_data": tag_text,
                    }
                    send_to_backend(packet)

                    flash(green)
                    beep(0.15)

                # -----------------------------
                # Failed scan
                # -----------------------------
                else:
                    print(f"  [{timestamp}] ❌ RFID FAIL | No tag detected in {SCAN_WINDOW_SEC}s")
                    flash(red)

                # Unlock after scan completes (success or fail)
                unlock_door()

                # Must wait until mug is removed before next cycle
                waiting_for_removal = True
                printed_waiting_msg = False
                break

            # Small delay so this inner loop isn't a CPU furnace
            time.sleep(0.02)

        processing = False

    # ----------------------------------------------------
    # CASE 2 — Mug must be removed before next cycle
    # ----------------------------------------------------
    if waiting_for_removal:
        if not printed_waiting_msg:
            print("Waiting for mug to be removed...")
            printed_waiting_msg = True

        if not is_mug_present():  # beam unbroken
            print("Mug removed — ready for next mug.")
            waiting_for_removal = False
            printed_waiting_msg = False

    time.sleep(0.05)

# =======================================================
# END
# =======================================================
print("\n===============================================")
print(f"Process complete — {count} mugs processed.")
print("===============================================")

green.off()
red.off()
unlock_door()