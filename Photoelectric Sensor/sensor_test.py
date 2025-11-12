# Mug Detection System – Beam Break Counter
# Hardware: Raspberry Pi Pico 2 W + E3F-5DN1 photoelectric pair + buzzer
# Power: Sensors @ 9V (separate battery), Pico via USB

from machine import Pin
import time	

# ----- Pin setup -----
# Receiver signal (black wire) → GP15 with 10kΩ pull-up to 3.3V
# Buzzer + → GP16
sensor = Pin(15, Pin.IN)
buzzer = Pin(16, Pin.OUT)

# ----- Counting variables -----
count = 0
limit = 10  # how many mugs to process before stopping

print("System ready – waiting for mugs...")

while count < limit:
    # When the beam is broken, sensor goes LOW (0)
    if sensor.value() == 0:
        start = time.ticks_ms()  # record time when beam first broke

        # Stay here until beam is restored (object moved away)
        while sensor.value() == 0:
            time.sleep(0.01)

        duration = time.ticks_diff(time.ticks_ms(), start)

        # Filter for mug vs. hand:
        if duration >= 400:   # threshold in milliseconds (~0.4 seconds)
            count += 1
            print("DETECTED — Mug", count)

            # Feedback beep
            buzzer.value(1)
            time.sleep(0.3)
            buzzer.value(0)
        else:
            print("Ignored short break (", duration, "ms )")

    time.sleep(0.05)

print("Process complete –", count, "mugs detected.")

