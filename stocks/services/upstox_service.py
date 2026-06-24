import os
import requests
from django.utils import timezone
from stocks.models import UpstoxToken

def get_valid_access_token():
    try:
        token_obj = UpstoxToken.objects.latest('created_at')
    except UpstoxToken.DoesNotExist:
        raise Exception("No Upstox token found. Please authenticate first.")

    if token_obj.expires_at < timezone.now():
        # Refresh token using environment variables
        refresh_url = "https://api.upstox.com/v2/login/authorization/token"
        payload = {
            "grant_type": "refresh_token",
            "refresh_token": token_obj.refresh_token,
            "client_id": os.getenv('UPSTOX_CLIENT_ID'),
            "client_secret": os.getenv('UPSTOX_CLIENT_SECRET'),
        }
        resp = requests.post(refresh_url, data=payload)
        if resp.status_code != 200:
            raise Exception(f"Failed to refresh token: {resp.text}")
        data = resp.json()
        token_obj.access_token = data["access_token"]
        token_obj.expires_at = timezone.now() + timezone.timedelta(seconds=data["expires_in"])
        token_obj.save()
        return token_obj.access_token
    return token_obj.access_token

def search_instrument(symbol, access_token):
    url = f"https://api.upstox.com/v3/instrument/search?q={symbol}"
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        return None
    data = resp.json()
    if data.get("status") != "success":
        return None
    results = data.get("data", [])
    if results:
        return results[0].get("key")
    return None