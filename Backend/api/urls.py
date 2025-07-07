from django.urls import path
from .views import *

urlpatterns = [
    path('signup/', signup),
    path('login/', login),
    path('pair/', pair_partner),
    path('send-message/', send_message),
    path('get-messages/', get_messages),
]
