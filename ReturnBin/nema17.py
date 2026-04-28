import rp2
from machine import Pin
import time
# ==========================================
# Pico + NEMA17 Driver Test
# ~90 degree sweep + return
# Works with DRV8825 
# ==========================================

# -----------------------------
# GPIO Pins
# -----------------------------
STEP_PIN = 2
DIR_PIN = 3
EN_PIN = 4

# -----------------------------
# Motor Config
# -----------------------------

# Standard NEMA17:
# 200 full steps = 360°
# 50 steps ≈ 90°
SWEEP_STEPS = 90

# Increase if movement too fast
STEP_DELAY_US = 3000

# Track plate state
plate_open = False


# -----------------------------
# Pin Setup
# -----------------------------
en_pin = Pin(EN_PIN, Pin.OUT)
step_pin = Pin(STEP_PIN, Pin.OUT)
dir_pin = Pin(DIR_PIN, Pin.OUT)


# -----------------------------
# Enable/Disable Driver
# Most stepper drivers use active LOW enable
# -----------------------------
def enable_motor():
    en_pin.value(0)


def disable_motor():
    en_pin.value(1)


# -----------------------------
# Move Motor
# reverse=True = opposite direction
# -----------------------------
def move_motor(steps, reverse=False):
    enable_motor()

    direction = 0 if reverse else 1
    dir_pin.value(direction)

    for _ in range(steps):
        step_pin.value(1)
        time.sleep_us(STEP_DELAY_US)
        step_pin.value(0)
        time.sleep_us(STEP_DELAY_US)

    disable_motor()


# -----------------------------
# Rotate plate open (drop position)
# -----------------------------
def rotate_plate_open():
    global plate_open

    if not plate_open:
        print("Opening plate...")
        move_motor(SWEEP_STEPS, reverse=True)
        plate_open = True
        print("Plate open.\n")


# -----------------------------
# Return plate home
# -----------------------------
def rotate_plate_home():
    global plate_open

    if plate_open:
        print("Returning plate home...")
        move_motor(SWEEP_STEPS)
        plate_open = False
        print("Plate home.\n")


# -----------------------------
# Main Test Loop
# -----------------------------
while True:
    print("Mug resting on plate...")
    time.sleep(2)

    rotate_plate_open()

    print("Mug drops...")
    time.sleep(2)

    rotate_plate_home()

    print("Cycle complete.\n")
    time.sleep(3)
