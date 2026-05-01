import requests

SERVER_IP_ADDRESS = "https://ec463-diallo-amado.onrender.com"
#SERVER_IP_ADDRESS = "http://localhost:3000"

ocr_json = {
  "gcloud_result": {
    "responses": [
      {
        "textAnnotations": [
          {
            "description": "85"
          }
        ]
      }
    ]
  }
}

def send_mock_order():
    response = requests.post(f'{SERVER_IP_ADDRESS}/api/grubhub/webhook', json={
        "phone_number": "123456789", 
        "merchant_id": 1234, 
        "id": 5678, 
        "username": "test1", 
        "MugExchange": "Yes",
        "item": "Frappe",
        "price": 5.75,
        "time": "2026-03-18T03:05:23Z"})

    print("Status Code:", response.status_code)
    print("Response Body:", response.json())

def send_pickup():
    response = requests.post(f'{SERVER_IP_ADDRESS}/pickup', json={
        "rfid": "31 AE 36 F2",
        "ocr": ocr_json
    })

    print("Status Code:", response.status_code)
    print("Response Body:", response.json())

def send_return():
    response = requests.post(f'{SERVER_IP_ADDRESS}/return', json={
        "mug_id": "31 AE 36 F2"
    })

    print("Status Code:", response.status_code)
    print("Response Body:", response.json())

#send_mock_order()
#send_pickup()
send_return()

