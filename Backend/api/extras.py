# extras.py
import jwt
import datetime
import json
from bson import ObjectId
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pymongo import MongoClient
from uuid import uuid4

# MongoDB connection
client = MongoClient("mongodb+srv://ihub:akash@ihub.fel24ru.mongodb.net/")
db = client['LoveConnect']
users_collection = db['users']
extras_collection = db['extras']

# JWT Config
JWT_SECRET = 'loveconnect'
JWT_ALGORITHM = 'HS256'


def get_user_from_token(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return JsonResponse({'error': 'Missing Authorization header'}, status=401)
    
    # Extract token from "Bearer <token>" format
    if not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Invalid Authorization header format'}, status=401)
            
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get('email')
        user = users_collection.find_one({'email': email})
        return user, None
    except jwt.ExpiredSignatureError:
        return None, JsonResponse({'error': 'Token expired'}, status=401)
    except jwt.InvalidTokenError:
        return None, JsonResponse({'error': 'Invalid token'}, status=401)


def ensure_extras_document(pair_code):
    doc = extras_collection.find_one({'pairCode': pair_code})
    if not doc:
        extras_collection.insert_one({
            'pairCode': pair_code,
            'loveJar': [],
            'todoList': []
        })


@csrf_exempt
def add_love_note(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    user, error = get_user_from_token(request)
    if error: return error

    data = json.loads(request.body)
    message = data.get('message')
    if not message:
        return JsonResponse({'error': 'Message required'}, status=400)

    pair_code = user.get('partnerCode')
    ensure_extras_document(pair_code)

    note = {
        "id": str(uuid4()),
        "message": message.strip(),
        "addedBy": user.get('name'),
        "isRevealed": False,
        "addedAt": datetime.datetime.utcnow()
    }

    extras_collection.update_one(
        {'pairCode': pair_code},
        {'$push': {'loveJar': note}}
    )

    return JsonResponse({'message': 'Note added'}, status=201)


@csrf_exempt
def reveal_love_note(request, note_id):
    if request.method != 'PATCH':
        return JsonResponse({'error': 'Only PATCH allowed'}, status=405)

    user, error = get_user_from_token(request)
    if error: return error

    pair_code = user.get('partnerCode')
    extras_collection.update_one(
        {'pairCode': pair_code, 'loveJar.id': note_id},
        {'$set': {'loveJar.$.isRevealed': True}}
    )

    return JsonResponse({'message': 'Note revealed'}, status=200)


@csrf_exempt
def add_todo(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    user, error = get_user_from_token(request)
    if error: return error

    data = json.loads(request.body)
    title = data.get('title')
    if not title:
        return JsonResponse({'error': 'Title required'}, status=400)

    pair_code = user.get('partnerCode')
    ensure_extras_document(pair_code)

    todo = {
        "id": str(uuid4()),
        "title": title.strip(),
        "isCompleted": False,
        "addedBy": user.get('name'),
        "createdAt": datetime.datetime.utcnow()
    }

    extras_collection.update_one(
        {'pairCode': pair_code},
        {'$push': {'todoList': todo}}
    )

    return JsonResponse({'message': 'Todo added'}, status=201)


@csrf_exempt
def toggle_todo(request, todo_id):
    if request.method != 'PATCH':
        return JsonResponse({'error': 'Only PATCH allowed'}, status=405)

    user, error = get_user_from_token(request)
    if error: return error

    pair_code = user.get('partnerCode')

    # Fetch current status
    doc = extras_collection.find_one({'pairCode': pair_code})
    if not doc:
        return JsonResponse({'error': 'No extras found'}, status=404)

    todo_item = next((t for t in doc.get('todoList', []) if t['id'] == todo_id), None)
    if not todo_item:
        return JsonResponse({'error': 'Todo not found'}, status=404)

    new_status = not todo_item['isCompleted']

    extras_collection.update_one(
        {'pairCode': pair_code, 'todoList.id': todo_id},
        {'$set': {'todoList.$.isCompleted': new_status}}
    )

    return JsonResponse({'message': 'Todo status updated'}, status=200)


@csrf_exempt
def get_extras(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET allowed'}, status=405)

    user, error = get_user_from_token(request)
    if error: return error

    pair_code = user.get('partnerCode')
    doc = extras_collection.find_one({'pairCode': pair_code})

    if not doc:
        return JsonResponse({'loveJar': [], 'todoList': []}, status=200)

    # Convert datetime fields to string
    for note in doc.get('loveJar', []):
        note['addedAt'] = note['addedAt'].isoformat()

    for task in doc.get('todoList', []):
        task['createdAt'] = task['createdAt'].isoformat()

    return JsonResponse({
        'loveJar': doc.get('loveJar', []),
        'todoList': doc.get('todoList', [])
    }, status=200)

@csrf_exempt
def delete_love_note(request, note_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE allowed'}, status=405)

    user, error = get_user_from_token(request)
    if error: return error

    pair_code = user.get('partnerCode')

    extras_collection.update_one(
        {'pairCode': pair_code},
        {'$pull': {'loveJar': {'id': note_id}}}
    )

    return JsonResponse({'message': 'Note deleted'}, status=200)

@csrf_exempt
def delete_todo(request, todo_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE allowed'}, status=405)

    user, error = get_user_from_token(request)
    if error: return error

    pair_code = user.get('partnerCode')

    extras_collection.update_one(
        {'pairCode': pair_code},
        {'$pull': {'todoList': {'id': todo_id}}}
    )

    return JsonResponse({'message': 'Todo deleted'}, status=200)
