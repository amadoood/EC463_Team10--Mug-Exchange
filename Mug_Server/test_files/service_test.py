#!/usr/bin/env python3
"""
Service test: 10 concurrent users place orders simultaneously, go through the
full lifecycle (IN_PROGRESS -> READY_PICKUP -> MUG_RETURNED), with assertions
at each transition.

"""

import sys
import uuid
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

LOCAL_URL  = "http://localhost:3000"
REMOTE_URL = "https://ec463-diallo-amado.onrender.com"
SERVER_URL = REMOTE_URL if len(sys.argv) > 1 and sys.argv[1] == "remote" else LOCAL_URL

NUM_USERS = 10
CAFE_ID   = "gsu-starbucks"
CAFE_NAME = "Starbucks @ GSU"
ITEM      = "Iced Cappuchino"
PRICE     = 5.75

TEST_USERS = [
    {
        "username":     f"svc_test_{i}",
        "password":     "svctest",
        "phone":        f"60000000{i:02d}",
        "display_name": f"Service Tester {i}",
    }
    for i in range(NUM_USERS)
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def register_or_login(user):
    """Login; auto-register if the account doesn't exist yet."""
    res = requests.post(f"{SERVER_URL}/login", json={
        "username": user["username"],
        "password": user["password"],
    })
    if res.status_code == 200:
        d = res.json()
        return d["token"], d["user_id"]

    signup = requests.post(f"{SERVER_URL}/signup", json={
        "user":         user["username"],
        "pass":         user["password"],
        "phone_number": user["phone"],
        "display_name": user["display_name"],
    })
    assert signup.status_code == 200, \
        f"Signup failed for {user['username']}: {signup.text}"

    res = requests.post(f"{SERVER_URL}/login", json={
        "username": user["username"],
        "password": user["password"],
    })
    assert res.status_code == 200, \
        f"Login failed for {user['username']}: {res.text}"
    d = res.json()
    return d["token"], d["user_id"]


def place_order(user_id, order_id):
    """POST /internal-order; return the server-assigned order_num."""
    body = {
        "uuid":        user_id,
        "id":          order_id,
        "merchant_id": CAFE_ID,
        "cafe_name":   CAFE_NAME,
        "item":        ITEM,
        "time":        datetime.now(timezone.utc).isoformat(),
        "price":       PRICE,
    }
    res = requests.post(f"{SERVER_URL}/internal-order", json=body)
    assert res.status_code == 200, \
        f"Order placement failed for user {user_id}: {res.text}"
    order_num = res.json().get("order_num")
    assert order_num is not None, \
        f"Server did not return order_num for user {user_id}"
    return order_num


def get_order_status(token, order_id):
    """Return the current DB status of a specific order via /verify."""
    res = requests.get(
        f"{SERVER_URL}/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200, f"/verify failed: {res.text}"
    for o in res.json().get("orders", []):
        if o.get("id") == order_id or o.get("orderId") == order_id:
            return o.get("status")
    return None


def simulate_pickup(order_num, rfid):
    """POST /pickup with a minimal single-annotation OCR payload."""
    payload = {
        "ocr": {
            "gcloud_result": {
                "responses": [{
                    "textAnnotations": [{"description": str(order_num)}]
                }]
            }
        },
        "rfid": rfid,
    }
    res = requests.post(f"{SERVER_URL}/pickup", json=payload)
    assert res.status_code == 200, \
        f"Pickup failed for order_num {order_num}: {res.text}"


def simulate_return(rfid):
    """POST /return with the mug's RFID tag."""
    res = requests.post(f"{SERVER_URL}/return", json={"mug_id": rfid})
    assert res.status_code == 200, \
        f"Return failed for mug {rfid}: {res.text}"


def do_logout(token):
    requests.post(
        f"{SERVER_URL}/logout",
        headers={"Authorization": f"Bearer {token}"},
    )


def run_parallel(fn, args_list):
    """Run fn(*args) for each args tuple concurrently; raise on first failure."""
    with ThreadPoolExecutor(max_workers=len(args_list)) as ex:
        futures = [ex.submit(fn, *args) for args in args_list]
        for fut in as_completed(futures):
            fut.result()


# ── Test ──────────────────────────────────────────────────────────────────────

def run():
    sep = "=" * 62
    print(f"\n{sep}")
    print(f"  Mug Exchange Service Test  —  {NUM_USERS} concurrent users")
    print(f"  Server: {SERVER_URL}")
    print(sep + "\n")

    # Step 1 — authenticate ───────────────────────────────────────────────────
    print("Step 1: Authenticating users...")
    sessions = {}
    with ThreadPoolExecutor(max_workers=NUM_USERS) as ex:
        futures = {ex.submit(register_or_login, u): i
                   for i, u in enumerate(TEST_USERS)}
        for fut in as_completed(futures):
            i = futures[fut]
            token, user_id = fut.result()
            sessions[i] = {"token": token, "user_id": user_id}
    print(f"  ✓ {NUM_USERS} users authenticated\n")

    # Step 2 — place orders simultaneously ───────────────────────────────────
    print("Step 2: Placing orders simultaneously...")
    order_ids  = {i: str(uuid.uuid4()) for i in range(NUM_USERS)}
    order_nums = {}
    rfids      = {i: f"SVC_MUG_{i:03d}" for i in range(NUM_USERS)}

    with ThreadPoolExecutor(max_workers=NUM_USERS) as ex:
        futures = {
            ex.submit(place_order, sessions[i]["user_id"], order_ids[i]): i
            for i in range(NUM_USERS)
        }
        for fut in as_completed(futures):
            i = futures[fut]
            order_nums[i] = fut.result()

    nums_str = ", ".join(str(order_nums[i]) for i in range(NUM_USERS))
    print(f"  ✓ {NUM_USERS} orders placed  —  order_nums: [{nums_str}]\n")

    # Step 3 — assert IN_PROGRESS ─────────────────────────────────────────────
    print("Step 3: Asserting all orders are IN_PROGRESS...")
    for i in range(NUM_USERS):
        status = get_order_status(sessions[i]["token"], order_ids[i])
        assert status == "IN_PROGRESS", (
            f"User {i} (order_num={order_nums[i]}): "
            f"expected IN_PROGRESS, got {status!r}"
        )
    print(f"  ✓ All {NUM_USERS} orders are IN_PROGRESS\n")

    # Step 4 — simulate pickup simultaneously ─────────────────────────────────
    print("Step 4: Simulating pickup for all orders simultaneously...")
    run_parallel(simulate_pickup, [(order_nums[i], rfids[i]) for i in range(NUM_USERS)])
    # /pickup sends HTTP 200 before completing the DB write; wait for it
    time.sleep(2)
    print(f"  ✓ {NUM_USERS} pickups simulated\n")

    # Step 5 — assert READY_PICKUP ────────────────────────────────────────────
    print("Step 5: Asserting all orders are READY_PICKUP...")
    for i in range(NUM_USERS):
        status = get_order_status(sessions[i]["token"], order_ids[i])
        assert status == "READY_PICKUP", (
            f"User {i} (order_num={order_nums[i]}): "
            f"expected READY_PICKUP, got {status!r}"
        )
    print(f"  ✓ All {NUM_USERS} orders are READY_PICKUP\n")

    # Step 6 — simulate return simultaneously ─────────────────────────────────
    print("Step 6: Simulating mug return for all orders simultaneously...")
    run_parallel(simulate_return, [(rfids[i],) for i in range(NUM_USERS)])
    # Same as pickup — response before DB write
    time.sleep(2)
    print(f"  ✓ {NUM_USERS} mugs returned\n")

    # Step 7 — assert MUG_RETURNED ────────────────────────────────────────────
    print("Step 7: Asserting all orders are MUG_RETURNED...")
    for i in range(NUM_USERS):
        status = get_order_status(sessions[i]["token"], order_ids[i])
        assert status == "MUG_RETURNED", (
            f"User {i} (order_num={order_nums[i]}): "
            f"expected MUG_RETURNED, got {status!r}"
        )
    print(f"  ✓ All {NUM_USERS} orders are MUG_RETURNED\n")

    # Cleanup ─────────────────────────────────────────────────────────────────
    print("Cleanup: Logging out all users...")
    run_parallel(do_logout, [(sessions[i]["token"],) for i in range(NUM_USERS)])
    print(f"  ✓ All users logged out\n")

    print(sep)
    print("  ALL ASSERTIONS PASSED")
    print(sep + "\n")


if __name__ == "__main__":
    run()
