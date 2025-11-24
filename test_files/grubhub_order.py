MOCK_ORDERS3 = [
    {
  "uuid": "JylzkoC0Ee2zk-PUFdlLqg",
  "merchant_uuid": "0OfxgNelEey87BGSJG9AHg",
  "order_number": "604721063804098",
  "is_test": False,
  "status": "REJECTED",
  "statusHistory": [
    {
      "status": "REJECTED",
      "timestamp": "2022-12-20T22:46:01.582Z",
      "update_source": "CONFIRMATION_AUTOMATION"
    },
    {
      "status": "STALE",
      "timestamp": "2022-12-20T22:36:00.864Z",
      "update_source": "GRUBHUB_ORDERS_REAPER",
      "reason": "Stuck status RESTAURANT_CONFIRMABLE at 2022-12-20T22:36:00.864Z"
    },
    {
      "status": "RESTAURANT_CONFIRMABLE",
      "timestamp": "2022-12-20T22:18:07.810Z",
      "update_source": "TXS"
    },
    {
      "status": "ANTICIPATED",
      "timestamp": "2022-12-20T22:18:07.430Z",
      "update_source": "DINER",
      "reason": "non-GHD"
    }
  ],
  "updated_at": "2022-12-20T22:46:01.582Z",
  "merchant_id": "10004116752",
  "fulfillment_info": {
    "pickup_info": {
      "name": "John Doe",
      "contact_info": {
        "phone": "(222) 222-2222",
        "name": "John Doe"
      },
      "instructions": "",
      "is_green_indicated": True
    }
  },
  "brand": "GRUBHUB",
  "time_placed": "2022-12-20T22:18:06.214Z",
  "confirmation_code": "6335",
  "when_for": "2022-12-20T22:28:06.221Z",
  "restaurant_timezone_id": "America/New_York",
  "payments": {
    "payments": [
      {
        "payment_type": "CREDIT_CARD",
        "amount": 472,
        "tax_application": "POST_TAX"
      }
    ],
    "total": 472,
    "adjusted_total": 472
  },
  "charges": {
    "fees": {
      "total": 0,
      "delivery": 0
    },
    "taxes": {
      "total": 32,
      "sales": 32,
      "delivery": 0,
      "restaurant": 32,
      "merchant_sales_total": 32,
      "merchant_total": 32
    },
    "tip": {
      "amount": 0,
      "type": "CASH"
    },
    "diner_grand_total": 472,
    "grand_total": 472,
    "adjusted_grand_total": 472,
    "line_groups": [
      {
        "lines": [
          {
            "name": "Avocado Cherry Tomato",
            "line_options": [],
            "price": 440,
            "merchant_price": 440,
            "quantity": 1,
            "menu_item_id": "2426676565",
            "menu_item_uuid": "AAAAAAAAAAasdAkadss",
            "diner_total": 440,
            "total": 440,
            "tags": [],
            "external_id": "Salad|Avocado Salad",
            "metadata": {
              "internal_id": 1123234
            },
            "routing_tags": [],
            "line_uuid": "J5AkoIC0Ee2koy&8hjj",
            "packaging_options": []
          }
        ]
      }
    ],
    "coupons": [],
    "merchant_total": 472,
    "merchant_subtotal": 440,
    "restaurant_subtotal": 440,
    "merchant_subtotal_before_coupons": 440
  },
  "tax_withheld": True,
  "jit_enabled": True,
  "just_in_time_fired": False,
  "diners": [
    {
      "status": "ACTIVE",
      "diner_info": {
        "phone": "(222) 222-2222",
        "name": "John Doe"
      },
      "charges": {
        "fees": {
          "total": 0,
          "delivery": 0
        },
        "taxes": {
          "total": 32,
          "sales": 32,
          "delivery": 0,
          "restaurant": 32,
          "merchant_sales_total": 32,
          "merchant_total": 32
        },
        "tip": {
          "amount": 0,
          "type": "CASH"
        },
        "diner_grand_total": 472,
        "grand_total": 472,
        "adjusted_grand_total": 472,
        "line_groups": [
          {
            "lines": [
              {
                "name": "Avocado Salad",
                "line_options": [],
                "price": 440,
                "merchant_price": 440,
                "quantity": 1,
                "menu_item_id": "2426676565",
                "diner_total": 440,
                "total": 440,
                "tags": [],
                "routing_tags": [],
                "line_uuid": "J5AkoIC0Ee2koy&8hjj",
                "packaging_options": []
              }
            ]
          }
        ],
        "coupons": [],
        "merchant_total": 472,
        "merchant_subtotal": 440,
        "restaurant_subtotal": 440,
        "merchant_subtotal_before_coupons": 440
      },
      "payments": {
        "payments": [
          {
            "payment_type": "CREDIT_CARD",
            "amount": 472,
            "payment_source": "UNKNOWN",
            "tax_application": "POST_TAX"
          }
        ],
        "total": 472,
        "adjusted_total": 472
      },
      "order_diner_number": "1232132343",
      "cart_uuid": "JylzkIC0Ee2zkePUaHjs",
      "participation": "HOST"
    }
  ],
  "order_type": "STANDARD",
  "order_taking_system": "CARTING",
  "handoff_options": [],
  "restaurant_version_id": {
    "catalog_version": {
      "version_id": "v1:VoNHjJPBjGrXXThkLnOrrgVAmwBG3yR2"
    }
  },
  "fulfillment_scheduling": "ASAP",
  "transmission_id": "IwsfGSpHM461UOWnLXHf6g",
  "order_merchant_id": "9CvhTfZvNvqR8_WRGSjL9Q"
}
]

MOCK_ORDERS = [
    {"mugId": "2001", "merchantName": "Cafe1", "Item": "Coffee1", "status": "ORDER_SUBMITTED", "orderTime": "2025-10-30T00:00:00Z", "MugExchange": "Yes"},
    {"mugId": "2002", "merchantName": "Cafe2", "Item": "Coffee2", "status": "ORDER_SUBMITTED", "orderTime": "2025-10-30T00:00:05Z", "MugExchange": "Yes"},
    {"mugId": "2003", "merchantName": "Cafe3", "Item": "Coffee3", "status": "ORDER_SUBMITTED", "orderTime": "2025-10-30T00:00:10Z", "MugExchange": "Yes"},
    {"mugId": "2001", "merchantName": "Cafe1", "Item": "Coffee1", "status": "READY_PICKUP", "orderTime": "2025-10-30T00:00:15Z", "MugExchange": "Yes"},
    {"mugId": "2002", "merchantName": "Cafe2", "Item": "Coffee2", "status": "READY_PICKUP", "orderTime": "2025-10-30T00:00:20Z", "MugExchange": "Yes"},
    {"mugId": "2003", "merchantName": "Cafe3", "Item": "Coffee3", "status": "READY_PICKUP", "orderTime": "2025-10-30T00:00:25Z", "MugExchange": "Yes"},
    {"mugId": "2001", "merchantName": "Cafe1", "Item": "Coffee1", "status": "RETURNED", "orderTime": "2025-10-30T00:00:05Z", "MugExchange": "Yes"},
    {"mugId": "2002", "merchantName": "Cafe2", "Item": "Coffee2", "status": "RETURNED", "orderTime": "2025-10-30T00:00:05Z", "MugExchange": "Yes"},
    {"mugId": "2003", "merchantName": "Cafe3", "Item": "Coffee3", "status": "RETURNED", "orderTime": "2025-10-30T00:00:05Z", "MugExchange": "Yes"}
]

MOCK_ORDERS2 = [
    {"UUID": "1001", "merchant_id": 1234, "order_number": 5678, "username": "Amado", "MugExchange": "Yes"}
]
