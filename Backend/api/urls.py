from django.urls import path
from .views import *
from .gallery import *

urlpatterns = [
    path('signup/', signup, name="signup"),
    path('login/', login, name="login"),
    path('logout/', logout, name="logout"),
    path('get-user/', get_user, name="get_user"),
    path('pair-partner/', pair_partner, name="pair_partner"),
    path('send-message/', send_message, name="send_message"),
    path('get-messages/', get_messages, name="get_messages"),
    path('upload-photo/', upload_photo, name="upload_photo"),
    path('gallery/', get_gallery, name="get_gallery"),
]
