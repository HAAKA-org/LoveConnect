from django.urls import path
from .views import *
from .gallery import *
from .notes import *
from .reminders import *

urlpatterns = [
    path('signup/', signup, name="signup"),
    path('login/', login, name="login"),
    path('logout/', logout, name="logout"),
    path('get-user/', get_user, name="get_user"),
    path('update-profile/', update_profile, name="update_profile"),
    path('change-pin/', change_pin, name="change_pin"),
    path('pair-partner/', pair_partner, name="pair_partner"),
    path('relationship-status/', update_relationship_status, name="update_relationship_status"),
    path('breakup/', breakup, name="breakup"),
    path('breakup-status/', breakup_status, name="breakup_status"),
    path('request-patchup/', request_patchup, name="request_patchup"),
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

    # Reminders URLs
    path('reminders/', get_reminders, name="get_reminders"),
    path('reminders/create/', create_reminder, name="create_reminder"),
    path('reminders/update/<str:id>/', update_reminder, name="update_reminder"),
    path('reminders/complete/<str:id>/', toggle_complete_reminder, name="toggle_complete_reminder"),
    path('reminders/delete/<str:id>/', delete_reminder, name="delete_reminder"),
]
