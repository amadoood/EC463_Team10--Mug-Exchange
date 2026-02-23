from machine import Pin
from time import sleep

# Stepper Pins
# -----------------
IN1 = Pin(15, Pin.OUT)
IN2 = Pin(14, Pin.OUT)
IN3 = Pin(16, Pin.OUT)
IN4 = Pin(17, Pin.OUT)

PINS = [IN1, IN3, IN2, IN4]

SEQUENCE = [
    [1,1,0,0],
    [0,1,1,0],
    [0,0,1,1],
    [1,0,0,1]
]

STEP_DELAY = 0.01
LOCK_STEPS = 400

locked = False


def move_stepper(steps, reverse=False):
    sequence = SEQUENCE[::-1] if reverse else SEQUENCE

    for step_count in range(steps):
        step = sequence[step_count % 4]

        for i in range(4):
            PINS[i].value(step[i])

        sleep(STEP_DELAY)

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


# Console Simulation Loop
# -----------------
while True:

    print("Waiting for mug...")
    sleep(2)

    print("☕ Mug detected!")
    sleep(1)

    print("🚪 Door closed!")
    sleep(1)

    lock_door()

    print("🔍 Scanning in progress...")
    sleep(3)

    print("✅ Scan complete!")
    sleep(1)

    unlock_door()

    print("Cycle complete.\n")
    sleep(3)
