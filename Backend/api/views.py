import jwt
import bcrypt
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pymongo import MongoClient
import json
import random
import string

# MongoDB Connection
client = MongoClient("mongodb+srv://ihub:akash@ihub.fel24ru.mongodb.net/")
db = client['LoveConnect']
users_collection = db['users']

# Secret Key for JWT
JWT_SECRET = 'loveconnect'
JWT_ALGORITHM = 'HS256'

def generate_partner_code():
    letters = ''.join(random.choices(string.ascii_uppercase, k=3))
    digits = ''.join(random.choices(string.digits, k=3))
    return letters + digits

@csrf_exempt
def signup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            email = data.get('email')
            pin = data.get('pin')

            if not (name and email and pin):
                return JsonResponse({'error': 'Missing required fields'}, status=400)

            if users_collection.find_one({'email': email}):
                return JsonResponse({'error': 'Email already registered'}, status=400)

            hashed_pin = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            user = {
                'name': name,
                'email': email,
                'pin': hashed_pin,
                'createdAt': datetime.datetime.utcnow()
            }

            users_collection.insert_one(user)

            return JsonResponse({'message': 'Signup successful'}, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            pin = data.get('pin')

            if not (email and pin):
                return JsonResponse({'error': 'Missing email or PIN'}, status=400)

            user = users_collection.find_one({'email': email})
            if not user:
                return JsonResponse({'error': 'User not found'}, status=404)

            stored_hashed_pin = user['pin'].encode('utf-8')
            if not bcrypt.checkpw(pin.encode('utf-8'), stored_hashed_pin):
                return JsonResponse({'error': 'Invalid PIN'}, status=401)

            payload = {
                'email': email,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            response = JsonResponse({'message': 'Login successful'})
            response.set_cookie(
                key='loveconnect',
                value=token,
                httponly=True,
                samesite='Lax',
                max_age=86400
            )
            return response

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

@csrf_exempt
def pair_partner(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            code = data.get('partnerCode')  # code user enters

            if not email:
                return JsonResponse({'error': 'Missing email'}, status=400)

            user = users_collection.find_one({'email': email})
            if not user:
                return JsonResponse({'error': 'User not found'}, status=404)

            if user.get('isPaired'):
                return JsonResponse({'message': 'Already paired'}, status=200)

            if code:
                # User is trying to pair using a partner's code
                partner = users_collection.find_one({'partnerCode': code, 'isPaired': False})
                if partner:
                    # Pair both
                    users_collection.update_one(
                        {'email': email},
                        {'$set': {
                            'pairedWith': partner['email'],
                            'partnerCode': code,
                            'isPaired': True
                        }}
                    )
                    users_collection.update_one(
                        {'email': partner['email']},
                        {'$set': {
                            'pairedWith': email,
                            'isPaired': True
                        }}
                    )
                    return JsonResponse({'message': 'Paired successfully'}, status=200)
                else:
                    return JsonResponse({'error': 'Invalid or already-used partner code'}, status=400)
            else:
                # Generate new code for user
                new_code = generate_partner_code()
                users_collection.update_one(
                    {'email': email},
                    {'$set': {'partnerCode': new_code, 'isPaired': False}}
                )
                return JsonResponse({'partnerCode': new_code, 'message': 'Code generated'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)