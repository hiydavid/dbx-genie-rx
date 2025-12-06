import json

import requests

token = ""  # your pat token
base_url = ""  # your workspace url
genie_space_id = ""  # your genie space id

endpoint = f"/api/2.0/genie/spaces/{genie_space_id}"
headers = {
    "Authorization": f"Bearer {token}",  # enter pat token
    "Content-Type": "application/json",
}

params = {
    "include_serialized_space": "true",
}

response = requests.get(base_url + endpoint, headers=headers, params=params)

serialized_space = response.json()


json.loads(serialized_space["serialized_space"])
