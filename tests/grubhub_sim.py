from flask import Flask, request, jsonify
from datetime import datetime
import threading
import time

app = Flask(__name__)

# Mock data to simulate "orders" from Grubhub
MOCK_ORDERS = [
    {
        "orderId": "1000",
        "merchantId": "1",
        "status": "IN_PROGRESS",
        "orderDate": "2025-10-30T00:00:00Z",
        "items": [
            {"name": "Burger", "quantity": 2, "price": 9.99},
            {"name": "Fries", "quantity": 1, "price": 3.49}
        ],
        "total": 23.47
    }
]

def generate_mock_orders():
    order_counter = 1001
    time_counter = "2025-10-30T00:00:05Z"

    while True:
        time.sleep(5)

        new_order = {
            "orderId": str(order_counter),
            "merchantID": "1",
            "status": "IN_PROGRESS",
            "orderDate": time_counter,
            "items": [
            {"name": "Burger", "quantity": 2, "price": 9.99},
            {"name": "Fries", "quantity": 1, "price": 3.49}
            ],
        "total": 23.47
        }

        MOCK_ORDERS.append(new_order)
        print(f"[+] Added mock order: {new_order}")
        order_counter += 1
        #time_counter =

@app.route("/pos/orders", methods=["GET"])
def get_orders():
    merchant_id = request.args.get("merchant_long_id")
    status = request.args.get("status")
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")

    filtered_orders = []

    for order in MOCK_ORDERS:
        order_date = datetime.strptime(order["orderDate"], "%Y-%m-%dT%H:%M:%SZ")
        start = datetime.strptime(start_date, "%Y-%m-%dT%H:%M:%SZ")
        end = datetime.strptime(end_date, "%Y-%m-%dT%H:%M:%SZ")

        if (start <= order_date <= end):
            filtered_orders.append(order)
    
    return jsonify({
        "orders": filtered_orders
    })
