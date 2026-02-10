import network
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect("wifi_name","wifi_pass")
print(wlan.isconnected())
