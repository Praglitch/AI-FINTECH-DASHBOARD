import os
import requests
from django.core.management.base import BaseCommand
from django.utils import timezone
from stocks.models import UpstoxToken
import datetime

class Command(BaseCommand):
    help = "Obtain Upstox access token via OAuth flow"

    def handle(self, *args, **options):
        client_id = os.getenv('UPSTOX_CLIENT_ID')
        client_secret = os.getenv('UPSTOX_CLIENT_SECRET')
        redirect_uri = os.getenv('UPSTOX_REDIRECT_URI')

        if not client_id or not client_secret or not redirect_uri:
            self.stderr.write("❌ Missing credentials in .env")
            return

        auth_url = (
            f"https://api.upstox.com/v2/login/authorization/dialog"
            f"?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}"
        )

        self.stdout.write("\n" + "="*60)
        self.stdout.write("🔗 Open this URL in your browser and log in:")
        self.stdout.write(auth_url)
        self.stdout.write("="*60)

        code = input("\n📥 Paste ONLY the 'code' value (not the full URL): ").strip()
        if not code:
            self.stderr.write("❌ No code provided.")
            return

        token_url = "https://api.upstox.com/v2/login/authorization/token"
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        resp = requests.post(token_url, data=payload, headers=headers)
        if resp.status_code != 200:
            self.stderr.write(f"❌ Error: {resp.status_code}")
            self.stderr.write(resp.text)
            return

        data = resp.json()
        access_token = data.get("access_token")
        # Refresh token may be missing for some app types
        refresh_token = data.get("refresh_token")
        expires_in = data.get("expires_in", 3600)

        if not access_token:
            self.stderr.write("❌ No access_token in response:")
            self.stderr.write(str(data))
            return

        # Save token – refresh_token can be None
        UpstoxToken.objects.create(
            access_token=access_token,
            refresh_token=refresh_token,  # will be None if missing
            expires_at=timezone.now() + datetime.timedelta(seconds=expires_in)
        )

        self.stdout.write("✅ Tokens saved successfully to `stocks_upstoxToken`.")
        self.stdout.write(f"   Access token: {access_token[:20]}...")
        if refresh_token:
            self.stdout.write(f"   Refresh token: {refresh_token[:20]}...")
        else:
            self.stdout.write("   Refresh token: None (refresh not supported)")