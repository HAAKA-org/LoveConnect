"""
ASGI config for Backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from api.routing import websocket_urlpatterns
from channels.middleware import BaseMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')


class SafeHeaderMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Sanitize headers before continuing
        safe_headers = []
        for header in scope.get("headers", []):
            if (
                isinstance(header, tuple) and
                len(header) == 2 and
                isinstance(header[0], bytes) and
                isinstance(header[1], bytes)
            ):
                safe_headers.append(header)
            else:
                print(f"⚠️ Skipping bad header: {header}")
        scope["headers"] = safe_headers
        return await self.inner(scope, receive, send)

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
