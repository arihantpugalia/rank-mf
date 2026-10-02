import requests
AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt"
response = requests.get(AMFI_URL)
lines = response.text.split('\r\n')
print(lines[:30])
