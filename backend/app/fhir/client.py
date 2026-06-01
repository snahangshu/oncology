import httpx
import logging
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class FHIRClient:
    def __init__(self):
        self.base_url = settings.FHIR_BASE_URL
        self.client_id = settings.FHIR_CLIENT_ID
        self.client_secret = settings.FHIR_CLIENT_SECRET
        self.token = None

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Simulates OAuth2 token generation/retrieval for FHIR server."""
        if not self.token:
            # Simulated token fetch
            self.token = "simulated-oauth2-token-xyz"
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/fhir+json",
            "Content-Type": "application/fhir+json"
        }

    async def get_resource(self, resource_type: str, resource_id: str) -> Dict[str, Any]:
        """Fetch resource by type and ID."""
        headers = await self._get_auth_headers()
        url = f"{self.base_url}/{resource_type}/{resource_id}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"HTTP error fetching FHIR resource {resource_type}/{resource_id}: {e}")
                raise e

    async def post_resource(self, resource_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Post a new FHIR resource."""
        headers = await self._get_auth_headers()
        url = f"{self.base_url}/{resource_type}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"HTTP error posting FHIR resource {resource_type}: {e}")
                raise e
        
    async def put_resource(self, resource_type: str, resource_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing FHIR resource."""
        headers = await self._get_auth_headers()
        url = f"{self.base_url}/{resource_type}/{resource_id}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.put(url, headers=headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"HTTP error updating FHIR resource {resource_type}/{resource_id}: {e}")
                raise e
