from django.urls import path
from .views import *
from .gallery import *
from .notes import *

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

    #Notes URLs
    path('notes/', get_notes, name="get_notes"),
    path('notes/create/', create_note, name="create_note"),
    path('notes/<str:note_id>/', update_note, name="update_note"),
    path('notes/<str:note_id>/delete/', delete_note, name="delete_note"),
    path('notes/<str:note_id>/favorite/', toggle_favorite, name="toggle_favorite"),
]
