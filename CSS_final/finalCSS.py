#!/usr/bin/env python3

import sys
import json
import time
import threading
import subprocess
from datetime import datetime

import requests
import RPi.GPIO as GPIO
from mfrc522 import MFRC522


# =========================================================
# CONFIG
# =========================================================

# ---------- Backend ----------
BACKEND_URL = "https://ec463-diallo-amado.onrender.com/pickup"
PING_URL = "https://ec463-diallo-amado.onrender.com/"

PING_INTERVAL_S = 2.0
PING_TIMEOUT_S = 5.0

# ---------- Camera / OCR ----------
IMAGE_PATH = "/home/flodude2/ocr_test.jpg"

CAMERA_WIDTH = 3280
CAMERA_HEIGHT = 2464
CAMERA_TIMEOUT_MS = 500

# ---------- RFID ----------
# 0 means wait forever for a tag
RFID_SCAN_TIMEOUT_S = 0.0

# ---------- LED PINS ----------
# These are physical BOARD pin numbers, not BCM GPIO numbers.
# MFRC522 uses BOARD mode internally.
GREEN_LED_PIN = 11
RED_LED_PIN = 13
WHITE_LED_PIN = 15

# If LEDs work backwards, change this to True
LED_ACTIVE_LOW = False

# ---------- Scan behavior ----------
POST_SUCCESS_DELAY_S = 1.0


# =========================================================
# LED HELPERS
# =========================================================

def gpio_on_value() -> bool:
    return GPIO.LOW if LED_ACTIVE_LOW else GPIO.HIGH


def gpio_off_value() -> bool:
    return GPIO.HIGH if LED_ACTIVE_LOW else GPIO.LOW


def setup_leds() -> None:
    GPIO.setup(GREEN_LED_PIN, GPIO.OUT, initial=gpio_off_value())
    GPIO.setup(RED_LED_PIN, GPIO.OUT, initial=gpio_off_value())
    GPIO.setup(WHITE_LED_PIN, GPIO.OUT, initial=gpio_off_value())


def white_on() -> None:
    GPIO.output(WHITE_LED_PIN, gpio_on_value())


def white_off() -> None:
    GPIO.output(WHITE_LED_PIN, gpio_off_value())


def feedback_off() -> None:
    """
    Turn off only red and green feedback LEDs.
    White LED is not changed.
    """
    GPIO.output(GREEN_LED_PIN, gpio_off_value())
    GPIO.output(RED_LED_PIN, gpio_off_value())


def all_leds_off() -> None:
    """
    Turn off all LEDs. Use this only on shutdown.
    """
    GPIO.output(GREEN_LED_PIN, gpio_off_value())
    GPIO.output(RED_LED_PIN, gpio_off_value())
    GPIO.output(WHITE_LED_PIN, gpio_off_value())


def led_green() -> None:
    """
    Green success feedback while white stays on.
    """
    GPIO.output(GREEN_LED_PIN, gpio_on_value())
    GPIO.output(RED_LED_PIN, gpio_off_value())
    white_on()


def led_red() -> None:
    """
    Red error feedback while white stays on.
    """
    GPIO.output(GREEN_LED_PIN, gpio_off_value())
    GPIO.output(RED_LED_PIN, gpio_on_value())
    white_on()


def flash_green(times: int = 3, on_s: float = 0.35, off_s: float = 0.25) -> None:
    """
    Flash green exactly 3 times while white stays on.
    """
    white_on()

    for i in range(times):
        print(f"Green flash {i + 1}/{times}")
        led_green()
        time.sleep(on_s)

        GPIO.output(GREEN_LED_PIN, gpio_off_value())
        white_on()
        time.sleep(off_s)

    feedback_off()
    white_on()


def show_red(duration_s: float = 1.0) -> None:
    """
    Show red briefly while white stays on.
    """
    white_on()
    led_red()
    time.sleep(duration_s)
    feedback_off()
    white_on()


# =========================================================
# SERVER STATUS / WHITE LIGHT
# =========================================================

def server_status_loop(stop_event: threading.Event) -> None:
    """
    White LED stays on whenever the server is reachable.
    White can remain on during scan processing.
    """
    while not stop_event.is_set():
        try:
            r = requests.get(PING_URL, timeout=PING_TIMEOUT_S)
            print(f"Server ping: {r.status_code}")

            if r.status_code < 400:
                white_on()
            else:
                white_off()

        except Exception as e:
            print(f"Server ping failed: {e}")
            white_off()

        time.sleep(PING_INTERVAL_S)


# =========================================================
# RFID HELPERS
# =========================================================

def uid_to_pico_hex_last4(uid) -> str:
    """
    Convert MFRC522 UID bytes to Pico-style hex string using LAST 4 bytes.

    Example:
      Raw UID list: [0x41, 0x07, 0x36, 0xF2, 0x82]
      Returned:     "07 36 F2 82"

    This matches the working other Pi version.
    """
    uid_last4 = uid[-4:]
    return " ".join(f"{x:02X}" for x in uid_last4)


def scan_rfid_uid_hex4(reader: MFRC522, timeout_s: float = 0.0) -> str:
    """
    Scan UID only, no auth, and return Pico-style hex string using LAST 4 bytes.
    timeout_s = 0 means wait forever.
    """
    print("Ready. Tap an RFID tag to start OCR...")
    start = time.time()

    while True:
        if timeout_s and (time.time() - start) > timeout_s:
            raise TimeoutError("No RFID tag detected within timeout window.")

        status, _tag_type = reader.MFRC522_Request(reader.PICC_REQIDL)
        if status != reader.MI_OK:
            time.sleep(0.05)
            continue

        status, uid = reader.MFRC522_Anticoll()
        if status != reader.MI_OK or not uid:
            time.sleep(0.05)
            continue

        uid_hex4 = uid_to_pico_hex_last4(uid)

        print(f"RFID UID (raw bytes): {' '.join(f'{x:02X}' for x in uid)}")
        print(f"RFID UID (pico hex, LAST 4 bytes): {uid_hex4}")

        return uid_hex4


def wait_for_tag_removal(reader: MFRC522) -> None:
    """
    Wait until the tag is removed so the same mug does not instantly scan again.
    """
    print("Waiting for tag removal...")

    clear_count = 0

    while clear_count < 5:
        status, _ = reader.MFRC522_Request(reader.PICC_REQIDL)

        if status != reader.MI_OK:
            clear_count += 1
        else:
            clear_count = 0

        time.sleep(0.1)

    print("Tag removed.")


# =========================================================
# CAMERA / OCR HELPERS
# =========================================================

def capture_image(image_path: str) -> None:
    print("Capturing image...")

    cmd = [
        "rpicam-still",
        "-o", image_path,
        "--width", str(CAMERA_WIDTH),
        "--height", str(CAMERA_HEIGHT),
        "--timeout", str(CAMERA_TIMEOUT_MS),
        "--nopreview",
    ]

    subprocess.run(cmd, check=True)
    print(f"Image saved to {image_path}")


def gcloud_vision_ocr(image_path: str) -> dict:
    """
    Run Google Vision OCR and wrap the result the same way as the working Pi:

      {"gcloud_result": json.loads(out)}

    The backend expects to parse through ocr["gcloud_result"].
    """
    print("Running OCR...")

    cmd = [
        "gcloud",
        "ml",
        "vision",
        "detect-text",
        image_path,
        "--format=json",
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=True,
    )

    raw = result.stdout.strip()

    if not raw:
        return {"gcloud_result": []}

    try:
        return {"gcloud_result": json.loads(raw)}
    except json.JSONDecodeError:
        return {"gcloud_result": raw}


# =========================================================
# BACKEND HELPERS
# =========================================================

def post_json(url: str, payload: dict) -> tuple[int, dict]:
    """
    Post JSON to backend.

    This does not call resp.raise_for_status().
    That way, HTTP 500 becomes a red light instead of crashing immediately.
    """
    print(f"Posting to {url} ...")

    print("Payload being sent:")
    print(json.dumps(payload, indent=2))

    try:
        resp = requests.post(url, json=payload, timeout=20)
    except requests.RequestException as e:
        print("Backend request failed:", str(e))
        return 0, {"error": str(e)}

    print("Backend status:", resp.status_code)

    try:
        body = resp.json()
        print(body)
    except Exception:
        body = {"raw": resp.text}
        print(resp.text)

    return resp.status_code, body


def backend_says_success(status_code: int, resp_body: dict) -> bool:
    """
    Successful backend examples:
      HTTP 200 + {"message": "Pickup RFID received"}
      HTTP 200 + {"success": true}
      HTTP 200 + {"status": "success"}
      HTTP 200 + {"status": "ok"}

    Anything HTTP 400+ is treated as unsuccessful.
    """
    if status_code >= 400 or status_code == 0:
        return False

    if not isinstance(resp_body, dict):
        return False

    message = str(resp_body.get("message", "")).strip().lower()
    status = str(resp_body.get("status", "")).strip().lower()

    if resp_body.get("success") is True:
        return True

    if message == "pickup rfid received":
        return True

    if status in {"success", "ok"}:
        return True

    return False


# =========================================================
# MAIN
# =========================================================

def main() -> int:
    GPIO.setwarnings(False)

    # MFRC522 sets GPIO mode internally.
    # Do not call GPIO.setmode(GPIO.BCM) here.
    reader = MFRC522()

    setup_leds()
    all_leds_off()

    white_on()

    stop_event = threading.Event()
    status_thread = threading.Thread(
        target=server_status_loop,
        args=(stop_event,),
        daemon=True,
    )
    status_thread.start()

    print("Counter Scanning Station started.")
    print("White LED = server connected/running.")
    print("Green LED x3 = successful scan.")
    print("Red LED = unsuccessful scan/server error.")
    print("RFID format = Pico-style LAST 4 bytes, e.g. 07 36 F2 82")
    print('OCR format = {"gcloud_result": [...]}')

    try:
        while True:
            t0 = time.perf_counter()

            try:
                feedback_off()
                white_on()

                mug_rfid = scan_rfid_uid_hex4(
                    reader,
                    timeout_s=RFID_SCAN_TIMEOUT_S,
                )

                capture_image(IMAGE_PATH)
                ocr_json = gcloud_vision_ocr(IMAGE_PATH)

                payload = {
                    "rfid": mug_rfid,
                    "ocr": ocr_json,
                    "image": IMAGE_PATH,
                    "timestamp": datetime.now().isoformat(timespec="seconds"),
                }

                status_code, resp_body = post_json(BACKEND_URL, payload)

                if backend_says_success(status_code, resp_body):
                    print("Scan successful.")
                    feedback_off()
                    white_on()

                    flash_green(times=3, on_s=0.35, off_s=0.25)

                    print(f"Waiting {POST_SUCCESS_DELAY_S} second before next scan...")
                    time.sleep(POST_SUCCESS_DELAY_S)

                else:
                    print("Backend responded with an error or unsuccessful message.")
                    feedback_off()
                    white_on()

                    show_red(duration_s=1.0)

                t1 = time.perf_counter()
                print(f"End-to-end latency: {(t1 - t0):.3f} s")

                if isinstance(resp_body, dict) and "message" in resp_body:
                    print(f"Backend message: {resp_body['message']}")

                wait_for_tag_removal(reader)

                feedback_off()
                white_on()

            except Exception as e:
                print("\nSCAN ERROR:", str(e))
                feedback_off()
                white_on()
                show_red(duration_s=1.0)

    except KeyboardInterrupt:
        print("\nExiting.")
        return 0

    finally:
        stop_event.set()
        time.sleep(0.2)
        all_leds_off()
        GPIO.cleanup()


if __name__ == "__main__":
    sys.exit(main())
