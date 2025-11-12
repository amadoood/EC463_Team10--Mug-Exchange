# RFID Reader Timed Accuracy Test
# Hardware: Raspberry Pi Pico + MFRC522
# Purpose: Measure read accuracy and print tag data

from mfrc522 import SimpleMFRC522
from machine import Pin, SPI
import time

# Configuration
NUM_TRIALS   =0       # number of scan attempts
SCAN_WINDOW  = 2.0      # seconds allowed per attempt
GREEN_LED_PIN = 14      # success indicator LED
RED_LED_PIN   = 13      # failure indicator LED


# Hardware Setup
reader = SimpleMFRC522(spi_id=0, sck=18, mosi=19, miso=16, cs=17, rst=9)

green = Pin(GREEN_LED_PIN, Pin.OUT, value=0)
red   = Pin(RED_LED_PIN, Pin.OUT, value=0)

def flash(pin: Pin, duration: float = 0.25) -> None:
    """Flash an LED for visual feedback."""
    pin.on()
    time.sleep(duration)
    pin.off()

# Test Header
print("\n===============================================")
print("       TIMED RFID SCAN ACCURACY TEST")
print("===============================================")
print(f"Scan window: {SCAN_WINDOW:.1f} s | Total scans: {NUM_TRIALS}")
print("Place tag near reader when prompted.")
print("===============================================\n")

# Test Loop
success_count = 0

for trial in range(1, NUM_TRIALS + 1):
    print(f"[Trial {trial:02}/{NUM_TRIALS}] Place tag near reader...")
    start_time = time.time()
    tag_detected = False
    tag_id = None
    tag_text = ""

    # Timed scan window
    while time.time() - start_time < SCAN_WINDOW:
        try:
            id, text = reader.read_no_block()
            if id:
                tag_detected = True
                tag_id = id
                tag_text = text.strip()
                break
        except Exception:
            pass  # ignore transient read errors

    # ----- Feedback -----
    timestamp = "{:04}-{:02}-{:02} {:02}:{:02}:{:02}".format(*time.localtime()[:6])
    if tag_detected:
        print(f"  [{timestamp}] ✅ SUCCESS | ID: {tag_id} | Data: '{tag_text}'")
        flash(green)
        success_count += 1
    else:
        print(f"  [{timestamp}] ❌ MISS | No tag detected in {SCAN_WINDOW:.1f}s")
        flash(red)

    time.sleep(1.0)

# Summary
accuracy = (success_count / NUM_TRIALS) * 100
print("\n===============================================")
print("                TEST COMPLETE")
print("===============================================")
print(f" Successful scans : {success_count}/{NUM_TRIALS}")
print(f" Accuracy          : {accuracy:.1f}%")
print(f" Scan window       : {SCAN_WINDOW:.1f} seconds")
print("===============================================")

green.off()
red.off()

