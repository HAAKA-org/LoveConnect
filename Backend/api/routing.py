# api/routing.py

from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<pair_code>\w+)/$', ChatConsumer.as_asgi()),
]
