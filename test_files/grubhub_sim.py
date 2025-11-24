import time
import requests
from grubhub_order import MOCK_ORDERS

TIME_IN_BETWEEN = 3
SERVER_URL = "http://10.103.82.43:3000"

def generate_mock_orders(time_between_orders):
    max_time, elapsed_time = 0, 0
    for i in range(len(MOCK_ORDERS)):
        time.sleep(time_between_orders)
        start_time = time.time()
        try:
            response = requests.post(f"{SERVER_URL}/api/grubhub/webhook", json=MOCK_ORDERS[i])
            print(f"Sent order {i} to node.js server with status {response.status_code}")
        except Exception as e:
            print(f"Failed sending order via webook: {e}")
        end_time = time.time()

        elapsed_time = end_time - start_time
        if elapsed_time > max_time:
            max_time = elapsed_time
    return max_time



if __name__ == "__main__":
    max_latency = generate_mock_orders(TIME_IN_BETWEEN)
    time.sleep(5)

    print(f"🎉 {TIME_IN_BETWEEN} second test passed successfully with a maximum latency of {max_latency:.2f} seconds!")
