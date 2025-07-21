import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
import re
from jwt import decode, InvalidTokenError
from bson import ObjectId
from datetime import datetime
from asgiref.sync import sync_to_async
from django.conf import settings
from pymongo import MongoClient

# MongoDB Connection
client = MongoClient("mongodb+srv://ihub:akash@ihub.fel24ru.mongodb.net/")
db = client['LoveConnect']
users_collection = db['users']

# Secret Key for JWT
JWT_SECRET = 'loveconnect'
JWT_ALGORITHM = 'HS256'


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.pair_code = self.scope['url_route']['kwargs']['pair_code']
        self.user_email = None

        # Step 1: Extract the 'cookie' header
        headers = dict((k.decode(), v.decode()) for k, v in self.scope["headers"])
        cookie_header = headers.get("cookie", "")

        # Step 2: Use regex or split to extract 'loveconnect' token
        token_match = re.search(r"loveconnect[:=]([^\s;]+)", cookie_header)
        if not token_match:
            await self.close()
            return

        token = token_match.group(1)

        # Step 3: Decode JWT
        try:
            payload = decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            self.user_email = payload.get('email')
        except InvalidTokenError:
            await self.close()
            return

        # Step 4: Connect to group
        self.room_group_name = f"chat_{self.pair_code}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # **NEW: Send previous messages when user connects**
        await self.send_previous_messages()

    async def send_previous_messages(self):
        """Send all previous messages from this conversation to the newly connected user"""
        try:
            # Fetch conversation from database
            conversation = await sync_to_async(db['conversations'].find_one)(
                {'pairCode': self.pair_code}
            )
            
            if conversation and 'messages' in conversation:
                # Send each message to the connected user
                for message in conversation['messages']:
                    await self.send(text_data=json.dumps({
                        'pairCode': self.pair_code,
                        'senderEmail': message['senderEmail'],
                        'type': message['type'],
                        'content': message['content'],
                        'timestamp': message['timestamp'],
                        'isHistorical': True  # Flag to indicate this is a previous message
                    }))
        except Exception as e:
            print(f"Error sending previous messages: {e}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data['content']
        msg_type = data.get('type', 'text')

        # Create message object
        message = {
            'senderEmail': self.user_email,
            'type': msg_type,
            'content': content,
            'timestamp': datetime.utcnow().isoformat()
        }

        # Update or create conversation document for this pair
        await sync_to_async(db['conversations'].update_one)(
            {'pairCode': self.pair_code},  # Filter by pair code
            {
                '$push': {'messages': message},  # Add message to messages array
                '$setOnInsert': {  # Only set these fields if creating new document
                    'pairCode': self.pair_code,
                    'createdAt': datetime.utcnow().isoformat()
                },
                '$set': {
                    'lastMessageAt': datetime.utcnow().isoformat()  # Update last message time
                }
            },
            upsert=True  # Create document if it doesn't exist
        )

        # Create message for WebSocket
        websocket_message = {
            'pairCode': self.pair_code,
            'senderEmail': self.user_email,
            'type': msg_type,
            'content': content,
            'timestamp': message['timestamp']
        }

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': websocket_message
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))