import requests
res = requests.get("http://127.0.0.1:8000/api/v1/dashboards/doctor", headers={"Authorization": "Bearer fake_token"})
print(res.status_code, res.text)
