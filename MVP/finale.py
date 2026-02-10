# =======================================================

from machine import Pin, SPI
from mfrc522 import SimpleMFRC522
import time, urequests


# -------------------------------------------------------
# BACKEND ENDPOINT  (EDIT THIS ONLY)
# -------------------------------------------------------
BACKEND_URL = "http://172.20.10.13:3000/return"


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
# Hardware Setup
# -------------------------------
sensor = Pin(SENSOR_PIN, Pin.IN)
buzzer = Pin(BUZZER_PIN, Pin.OUT)
green  = Pin(GREEN_LED_PIN, Pin.OUT, value=0)
red    = Pin(RED_LED_PIN, Pin.OUT, value=0)

reader = SimpleMFRC522(spi_id=SPI_ID, sck=SCK, mosi=MOSI, miso=MISO, cs=CS, rst=RST)


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

def send_to_backend(packet):
    """Send mug+RFID data to backend server."""
    try:
        print("→ Sending to backend:", packet)
        response = urequests.post(BACKEND_URL, json=packet)
        print("→ Server response:", response.text)
        response.close()
    except Exception as e:
        print("❌ Backend send failed:", e)
        flash(red)
        time.sleep(0.2)
        flash(red)


# =======================================================
# NEW MUG DETECTION LOGIC
# Mug must stay ≥3 seconds. Only detect again after removal.
# =======================================================

MUG_THRESHOLD_MS = 3000  # must stay 3 sec to count

processing = False
waiting_for_removal = False

print("\n===============================================")
print("        Mug Detection + RFID + Backend")
print("===============================================")
print("System ready — waiting for mugs...\n")

count = 0
limit = 2


# =======================================================
# MAIN LOOP
# =======================================================
while count < limit:

    # ----------------------------------------------------
    # CASE 1 — Mug enters and system is available
    # ----------------------------------------------------
    if sensor.value() == 0 and not processing and not waiting_for_removal:
        print("Beam broken — mug entering...")
        start = time.ticks_ms()
        processing = True

        # Stay inside while mug remains present
        while sensor.value() == 0:

            elapsed = time.ticks_diff(time.ticks_ms(), start)

            if elapsed >= MUG_THRESHOLD_MS:
                beep(0.3)
                count += 1
                print(f"\n[Mug {count}] Confirmed mug ({elapsed} ms)")

                # -----------------------------
                # RFID SCAN (2-second window)
                # -----------------------------
                print("→ Scanning RFID tag...")
                tag_detected = False
                tag_id = None
                tag_text = ""
                scan_start = time.time()

                while time.time() - scan_start < 2.0:
                    try:
                        id, text = reader.read_no_block()
                        if id:
                            tag_detected = True
                            tag_id = id
                            tag_text = text.strip()
                            break
                    except:
                        pass

                timestamp = "{:04}-{:02}-{:02} {:02}:{:02}:{:02}".format(*time.localtime()[:6])

                # -----------------------------
                # Successful scan
                # -----------------------------
                if tag_detected:
                    print(f"  [{timestamp}] ✅ RFID SUCCESS | {tag_id} | '{tag_text}'")
                    flash(green)
                    beep(0.15)

                    # Build packet + SEND
                    packet = {
                        "mug_id": tag_id,
                        "rfid_data": tag_text,
                    }
                    send_to_backend(packet)

                # -----------------------------
                # Failed scan
                # -----------------------------
                else:
                    print(f"  [{timestamp}] ❌ RFID FAIL | No tag detected")
                    flash(red)
                    beep(0.1)

                # Must wait until mug is removed
                waiting_for_removal = True
                break

        processing = False


    # ----------------------------------------------------
    # CASE 2 — Mug must be removed before next cycle
    # ----------------------------------------------------
    if waiting_for_removal:
        if sensor.value() == 1:
            print("Mug removed — ready for next mug.")
            waiting_for_removal = False

    time.sleep(0.05)



# =======================================================
# END
# =======================================================
print("\n===============================================")
print(f"Process complete — {count} mugs processed.")
print("===============================================")

green.off()
red.off()
