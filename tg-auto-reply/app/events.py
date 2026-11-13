"""In-process Server-Sent Events (SSE) broadcaster for real-time dashboard updates."""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, AsyncIterator


class EventBus:
    """Lightweight asyncio fan-out queue for SSE subscribers."""

    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[str]] = set()
        self._lock = asyncio.Lock()

    async def publish(self, event_type: str, payload: dict[str, Any] | None = None) -> None:
        message = json.dumps(
            {
                "type": event_type,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": payload or {},
            },
            separators=(",", ":"),
        )
        async with self._lock:
            dead: list[asyncio.Queue[str]] = []
            for queue in self._subscribers:
                try:
                    queue.put_nowait(message)
                except asyncio.QueueFull:
                    dead.append(queue)
            for q in dead:
                self._subscribers.discard(q)

    async def subscribe(self) -> AsyncIterator[str]:
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers.add(queue)
        try:
            yield f"event: connected\ndata: {json.dumps({'ok': True})}\n\n"
            while True:
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"event: update\ndata: {msg}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            async with self._lock:
                self._subscribers.discard(queue)
