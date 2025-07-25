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

        # Send previous messages when user connects
        await self.send_previous_messages()

    async def mark_messages_as_seen(self):
        """Mark all messages not sent by this user as seen"""
        try:
            # Update messages where senderEmail is not the current user
            result = await sync_to_async(db['conversations'].update_one)(
                {
                    'pairCode': self.pair_code
                },
                {
                    '$set': {
                        'messages.$[msg].seen': True,
                        'lastMessageAt': datetime.utcnow().isoformat()
                    }
                },
                array_filters=[{
                    'msg.senderEmail': {'$ne': self.user_email},
                    'msg.seen': False
                }]
            )


            # If messages were updated, broadcast the updated messages
            if result.modified_count > 0:
                conversation = await sync_to_async(db['conversations'].find_one)(
                    {'pairCode': self.pair_code}
                )
                if conversation and 'messages' in conversation:
                    for message in conversation['messages']:
                        if message.get('seen', False):
                            await self.channel_layer.group_send(
                                self.room_group_name,
                                {
                                    'type': 'seen_update',
                                    'message_id': str(message.get('_id', '')),
                                    'seen': True
                                }
                            )
        except Exception as e:
            print(f"Error marking messages as seen: {e}")

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
                        'seen': message.get('seen', False),
                        'isHistorical': True
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
        msg_type = data.get('type', 'text')

        if msg_type == 'mark_seen':
            await self.mark_messages_as_seen()
            return

        content = data['content']

        # Create message object
        message = {
            'senderEmail': self.user_email,
            'type': msg_type,
            'content': content,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'seen': False
        }

        # Update or create conversation document for this pair
        result = await sync_to_async(db['conversations'].update_one)(
            {'pairCode': self.pair_code},
            {
                '$push': {'messages': message},
                '$setOnInsert': {
                    'pairCode': self.pair_code,
                    'createdAt': datetime.utcnow().isoformat()
                },
                '$set': {
                    'lastMessageAt': datetime.utcnow().isoformat()
                }
            },
            upsert=True
        )

        # Create message for WebSocket
        websocket_message = {
            'pairCode': self.pair_code,
            'senderEmail': self.user_email,
            'type': msg_type,
            'content': content,
            'timestamp': message['timestamp'],
            'seen': False
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

    async def reminder_alert(self, event):
        await self.send(text_data=json.dumps({
            "type": "reminder_alert",
            "reminder": event["reminder"]
        }))

    async def seen_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "seen_update",
            "message_id": event["message_id"],
            "seen": event["seen"]
        }))