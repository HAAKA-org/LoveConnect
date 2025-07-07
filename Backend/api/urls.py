from django.urls import path
from .views import *

urlpatterns = [
    path('signup/', signup),
    path('login/', login),
    path('logout/', logout),
    path('get-user/', get_user),
    path('pair-partner/', pair_partner),
    path('send-message/', send_message),
    path('get-messages/', get_messages),
]
