import json
import logging
from redis import Redis
from app.realtime.connection_manager import ConnectionManager
from app.config import settings

logger = logging.getLogger(__name__)

class HeatmapPublisher:
    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def publish_chair_utilisation(self, chair_id: int, utilisation_data: dict):
        """
        Publishes updated chair utilisation percentages to all WS clients.
        Also caches state in Redis.
        """
        payload = {
            "chair_id": chair_id,
            "data": utilisation_data
        }
        
        # Cache in Redis
        self.redis_client.set(f"heatmap:chair:{chair_id}", json.dumps(utilisation_data))
        
        # Broadcast to WebSocket clients
        await self.manager.broadcast(json.dumps({
            "event": "chair_heatmap_update",
            "payload": payload
        }))
        logger.info(f"Published chair {chair_id} heatmap update to clients.")
        
        # Also notify via Redis pubsub channel if other microservices need it
        self.redis_client.publish("heatmap_updates", json.dumps(payload))
