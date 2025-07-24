import jwt
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pymongo import MongoClient
import json
from bson import ObjectId

# MongoDB connection
client = MongoClient("mongodb+srv://ihub:akash@ihub.fel24ru.mongodb.net/")
db = client['LoveConnect']
users_collection = db['users']
reminders_collection = db['reminders']

# Secret Key for JWT
JWT_SECRET = 'loveconnect'
JWT_ALGORITHM = 'HS256'

@csrf_exempt
def create_reminder(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)
    try:
        token = request.COOKIES.get('loveconnect')
        if not token:
            return JsonResponse({'error': 'Missing token'}, status=401)
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = users_collection.find_one({'email': payload['email']})
        if not user or not user.get('isPaired') or not user.get('partnerCode'):
            return JsonResponse({'error': 'User not paired'}, status=403)

        data = json.loads(request.body)
        required_fields = ['title', 'description', 'date', 'time', 'priority']
        if not all(field in data for field in required_fields):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        reminder = {
            'title': data['title'],
            'description': data['description'],
            'date': data['date'].split('T')[0],  # ensures "YYYY-MM-DD"
            'time': data['time'],  # "HH:MM"
            'priority': data['priority'],
            'isCompleted': False,
            'isRecurring': data.get('isRecurring', False),
            'recurringType': data.get('recurringType'),
            'createdBy': user['name'],
            'email': user['email'],
            'pairCode': user['partnerCode'],
            'createdAt': datetime.utcnow()
        }

        reminders_collection.insert_one(reminder)
        return JsonResponse({'message': 'Reminder created'}, status=201)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def get_reminders(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET allowed'}, status=405)
    try:
        token = request.COOKIES.get('loveconnect')
        if not token:
            return JsonResponse({'error': 'Missing token'}, status=401)
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = users_collection.find_one({'email': payload['email']})
        if not user or not user.get('partnerCode'):
            return JsonResponse({'error': 'User not paired'}, status=403)

        reminders = list(reminders_collection.find({'pairCode': user['partnerCode']}))
        for r in reminders:
            r['_id'] = str(r['_id'])
        return JsonResponse({'reminders': reminders}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def update_reminder(request, id):
    if request.method != 'PATCH':
        return JsonResponse({'error': 'Only PATCH allowed'}, status=405)
    try:
        data = json.loads(request.body)
        update_fields = {
            key: data[key] for key in [
                'title', 'description', 'date', 'time',
                'priority', 'isRecurring', 'recurringType'
            ] if key in data
        }

        reminders_collection.update_one(
            {'_id': ObjectId(id)},
            {'$set': update_fields}
        )
        return JsonResponse({'message': 'Reminder updated'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def toggle_complete_reminder(request, id):
    if request.method != 'PATCH':
        return JsonResponse({'error': 'Only PATCH allowed'}, status=405)
    try:
        reminder = reminders_collection.find_one({'_id': ObjectId(id)})
        if not reminder:
            return JsonResponse({'error': 'Reminder not found'}, status=404)

        new_status = not reminder.get('isCompleted', False)
        reminders_collection.update_one(
            {'_id': ObjectId(id)},
            {'$set': {'isCompleted': new_status}}
        )
        return JsonResponse({'message': 'Reminder status toggled'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def delete_reminder(request, id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE allowed'}, status=405)
    try:
        result = reminders_collection.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return JsonResponse({'error': 'Reminder not found'}, status=404)

        return JsonResponse({'message': 'Reminder deleted'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

