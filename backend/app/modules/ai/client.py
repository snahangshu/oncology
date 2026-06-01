import time
import logging
from typing import List, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class AnthropicClientManager:
    """Manages Anthropic (Claude) API calls with retry logic."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            from anthropic import Anthropic
            cls._instance.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return cls._instance

    def invoke(
        self,
        model: str = "claude-3-5-sonnet-20241022",
        system: str = "",
        messages: list = None,
        max_tokens: int = 1000,
        temperature: float = 0.0,
    ) -> str:
        from anthropic import APIError, RateLimitError
        if messages is None:
            messages = []
        response = self.client.messages.create(
            model=model,
            system=system,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.content[0].text


class OpenAIClientManager:
    """Manages OpenAI API calls as a fallback provider."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            from openai import OpenAI
            cls._instance.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        return cls._instance

    def invoke(
        self,
        model: str = "gpt-4o-mini",
        system: str = "",
        messages: list = None,
        max_tokens: int = 1000,
        temperature: float = 0.0,
    ) -> str:
        if messages is None:
            messages = []

        # Convert from Anthropic message format to OpenAI format
        openai_messages = []
        if system:
            openai_messages.append({"role": "system", "content": system})
        for msg in messages:
            openai_messages.append({"role": msg["role"], "content": msg["content"]})

        response = self.client.chat.completions.create(
            model=model,
            messages=openai_messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content


class AIClientManager:
    """
    Unified AI Client with automatic failover.
    
    Strategy:
      1. Try Claude (Anthropic) first — primary provider.
      2. If Claude fails after retries (auth error, rate limit, quota exhausted,
         or any transient error), automatically fall back to OpenAI.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._anthropic = AnthropicClientManager()
            cls._instance._openai = OpenAIClientManager()
        return cls._instance

    def invoke_with_retry(
        self,
        system: str = "",
        messages: list = None,
        max_tokens: int = 1000,
        temperature: float = 0.0,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
    ) -> str:
        """
        Attempts Claude first with exponential backoff retries.
        On exhaustion of retries, falls back to OpenAI.
        """
        if messages is None:
            messages = []

        last_error: Optional[Exception] = None

        # ── Phase 1: Try Claude ──────────────────────────────────
        for attempt in range(max_retries):
            try:
                result = self._anthropic.invoke(
                    system=system,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                logger.info("[AI] Claude responded successfully.")
                return result
            except Exception as e:
                last_error = e
                sleep_time = backoff_factor * (2 ** attempt)
                logger.warning(
                    f"[AI] Claude attempt {attempt + 1}/{max_retries} failed: {e}. "
                    f"Retrying in {sleep_time}s..."
                )
                time.sleep(sleep_time)

        # ── Phase 2: Fallback to OpenAI ──────────────────────────
        logger.warning(
            f"[AI] Claude exhausted all {max_retries} retries "
            f"(last error: {last_error}). Falling back to OpenAI..."
        )

        try:
            result = self._openai.invoke(
                system=system,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            logger.info("[AI] OpenAI fallback responded successfully.")
            return result
        except Exception as openai_err:
            logger.error(f"[AI] OpenAI fallback ALSO failed: {openai_err}")
            # Raise the original Claude error with context about the fallback failure
            raise RuntimeError(
                f"Both AI providers failed. "
                f"Claude error: {last_error} | OpenAI error: {openai_err}"
            ) from openai_err
