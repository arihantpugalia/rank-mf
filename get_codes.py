import requests
resp = requests.get("https://www.amfiindia.com/spages/NAVAll.txt").text.split('\n')
for line in resp:
    name = line.split(';')[3] if ';' in line else ''
    if 'SBI Liquid' in name and 'Direct' not in name and 'IDCW' not in name and 'Dividend' not in name:
        if 'Growth' in name or 'Regular' in name:
            print("LIQUID:", line.split(';')[0], name)
