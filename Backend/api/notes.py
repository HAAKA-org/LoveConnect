import jwt
import bcrypt
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pymongo import MongoClient
import json
import random
import string
from bson import ObjectId

# MongoDB Connection
client = MongoClient("mongodb+srv://ihub:akash@ihub.fel24ru.mongodb.net/")
db = client['LoveConnect']
users_collection = db['users']
notes_collection = db['notes']

# Secret Key for JWT
JWT_SECRET = 'loveconnect'
JWT_ALGORITHM = 'HS256'

@csrf_exempt
def create_note(request):
    if request.method == 'POST':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user = users_collection.find_one({'email': payload['email']})

            data = json.loads(request.body)
            note = {
                'partnerCode': user['partnerCode'],
                'title': data.get('title', 'Untitled'),
                'content': data.get('content', ''),
                'color': data.get('color', 'bg-pink-100'),
                'isFavorite': data.get('isFavorite', False),
                'createdBy': payload['name'],
                'createdAt': datetime.datetime.utcnow(),
                'updatedAt': datetime.datetime.utcnow()
            }
            result = notes_collection.insert_one(note)
            note['_id'] = str(result.inserted_id)
            return JsonResponse(note, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

@csrf_exempt
def get_notes(request):
    if request.method == 'GET':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user = users_collection.find_one({'email': payload['email']})
            partner_code = user.get('partnerCode')
            notes = list(notes_collection.find({'partnerCode': partner_code}).sort('updatedAt', -1))
            for note in notes:
                note['_id'] = str(note['_id'])
            return JsonResponse({'notes': notes}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only GET allowed'}, status=405)

@csrf_exempt
def update_note(request, note_id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            updated = notes_collection.update_one(
                {'_id': ObjectId(note_id)},
                {'$set': {
                    'title': data.get('title'),
                    'content': data.get('content'),
                    'color': data.get('color'),  # <-- Added color here
                    'updatedAt': datetime.datetime.utcnow()
                }}
            )
            return JsonResponse({'message': 'Note updated'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only PUT allowed'}, status=405)

@csrf_exempt
def toggle_favorite(request, note_id):
    if request.method == 'PATCH':
        try:
            note = notes_collection.find_one({'_id': ObjectId(note_id)})
            if not note:
                return JsonResponse({'error': 'Note not found'}, status=404)
            new_fav = not note.get('isFavorite', False)
            notes_collection.update_one(
                {'_id': ObjectId(note_id)},
                {'$set': {'isFavorite': new_fav, 'updatedAt': datetime.datetime.utcnow()}}
            )
            return JsonResponse({'isFavorite': new_fav}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only PATCH allowed'}, status=405)

@csrf_exempt
def delete_note(request, note_id):
    if request.method == 'DELETE':
        try:
            notes_collection.delete_one({'_id': ObjectId(note_id)})
            return JsonResponse({'message': 'Note deleted'}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only DELETE allowed'}, status=405)
