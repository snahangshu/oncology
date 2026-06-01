import asyncio
import json
import logging
from redis import Redis
from app.realtime.connection_manager import ConnectionManager
from app.config import settings

logger = logging.getLogger(__name__)

class ConflictDetector:
    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.pubsub = self.redis_client.pubsub()

    async def start_listening(self):
        """
        Subscribes to Redis 'conflicts' channel and broadcasts conflict alerts to all connected WS clients.
        """
        self.pubsub.subscribe("conflicts")
        logger.info("Realtime conflict detector subscribed to Redis 'conflicts' channel.")

        while True:
            try:
                # Use pubsub.get_message in a non-blocking way
                message = self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    data = message.get("data")
                    if data:
                        logger.info(f"Conflict event received: {data}")
                        await self.manager.broadcast(json.dumps({
                            "event": "conflict_alert",
                            "payload": json.loads(data)
                        }))
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"Error in conflict detector loop: {e}")
                await asyncio.sleep(2.0)
