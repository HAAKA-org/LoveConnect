# api/reminder_scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from pymongo import MongoClient
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

client = MongoClient(os.getenv('MONGODB_URI'))
db = client['LoveConnect']
reminders_collection = db['reminders']

def check_due_reminders():
    now = datetime.utcnow()
    current_date = now.strftime('%Y-%m-%d')
    current_time = now.strftime('%H:%M')

    due_reminders = reminders_collection.find({
        'isCompleted': False,
        'date': current_date,
        'time': current_time
    })
    print(f"⏰ Checking reminders at {current_date} {current_time}")

    channel_layer = get_channel_layer()

    for reminder in due_reminders:
        pair_code = reminder.get('pairCode')
        if not pair_code:
            continue
        async_to_sync(channel_layer.group_send)(
            f"chat_{pair_code}",
            {
                "type": "reminder.alert",
                "reminder": {
                    "title": reminder['title'],
                    "description": reminder['description'],
                    "time": reminder['time'],
                    "priority": reminder['priority']
                }
            }
        )

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_due_reminders, 'interval', minutes=1)
    scheduler.start()
