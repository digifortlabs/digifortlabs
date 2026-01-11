import os
import requests
import time
from typing import List, Dict, Optional

class WHOICDService:
    def __init__(self):
        self.client_id = os.getenv("ICD11_CLIENT_ID")
        self.client_secret = os.getenv("ICD11_CLIENT_SECRET")
        self.token_url = "https://icdaccessmanagement.who.int/connect/token"
        self.api_base_url = "https://id.who.int/icd/release/11/2024-01/mms"
        self.token = None
        self.token_expiry = 0

    def _get_token(self):
        if self.token and time.time() < self.token_expiry:
            return self.token

        print("🔑 Fetching new WHO ICD-11 Access Token...")
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "icdapi_access"
        }
        try:
            response = requests.post(self.token_url, data=data)
            response.raise_for_status()
            res_data = response.json()
            self.token = res_data["access_token"]
            # Set expiry with a 60s buffer
            self.token_expiry = time.time() + res_data["expires_in"] - 60
            return self.token
        except Exception as e:
            print(f"❌ WHO Token Error: {e}")
            return None

    def search_codes(self, query: str) -> List[Dict]:
        token = self._get_token()
        if not token:
            return []

        print(f"🔍 Searching WHO ICD-11 for: {query}")
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Accept-Language": "en",
            "API-Version": "v2"
        }
        params = {
            "q": query,
            "useFlexisearch": "true"
        }
        try:
            # Note: The search endpoint might vary by release, using standard MMS search
            search_url = f"{self.api_base_url}/search"
            response = requests.get(search_url, headers=headers, params=params)
            response.raise_for_status()
            results = response.json()
            
            formatted_results = []
            # WHO API returns a list of 'destinationEntities'
            for item in results.get("destinationEntities", []):
                # Extracting code from the ID URL (e.g., .../mms/GB07.2)
                code_url = item.get("theCode", "")
                # If code is not provided directly, extract from URL
                code = code_url if code_url else item.get("id", "").split("/")[-1]
                
                # Removing HTML tags from title
                title = item.get("title", "").replace("<b>", "").replace("</b>", "")
                
                formatted_results.append({
                    "code": code,
                    "description": title,
                    "chapter": "WHO-LIVE"
                })
            
            return formatted_results[:20] # Return top 20
        except Exception as e:
            print(f"❌ WHO Search Error: {e}")
            return []

# Singleton instance
icd_service = WHOICDService()
