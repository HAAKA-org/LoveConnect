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

            # Block login if not paired
            if not user.get('isPaired') or not user.get('pairedWith'):
                return JsonResponse({'error': 'You must pair with your partner before using chat.'}, status=403)

            # ✅ New logic: Check relationship status
            if user.get('relationshipStatus') == 'break':
                reason = user.get('breakupReason', 'No reason provided.')
                return JsonResponse({
                    'error': f"Your partner has taken a break 💔: {reason}"
                }, status=403)

            # Generate token
            payload = {
                '_id': str(user['_id']),
                'email': user['email'],
                'name': user['name'],
                'partnerCode': user.get('partnerCode'),
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
def request_patchup(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        # Step 1: Try to get email from JWT token
        token = request.COOKIES.get('loveconnect')
        user_email = None

        if token:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_email = payload.get('email')
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)
        else:
            # Step 2: Fallback to email from POST body
            data = json.loads(request.body)
            user_email = data.get('email')
            if not user_email:
                return JsonResponse({'error': 'Missing token or email'}, status=401)

        # Step 3: Lookup user and verify breakup status
        user = users_collection.find_one({'email': user_email})
        if not user or user.get('relationshipStatus') != 'break':
            return JsonResponse({'error': 'Not in breakup state'}, status=400)

        partner_email = user.get('pairedWith')
        if not partner_email:
            return JsonResponse({'error': 'No partner found'}, status=400)

        partner = users_collection.find_one({'email': partner_email})
        if not partner:
            return JsonResponse({'error': 'Partner not found'}, status=404)

        # Step 4: Mark patch request from this user
        users_collection.update_one(
            {'email': user_email},
            {'$set': {'patchRequested': True}}
        )

        # Step 5: If partner also requested → complete patch-up
        if partner.get('patchRequested'):
            users_collection.update_many(
                {'email': {'$in': [user_email, partner_email]}},
                {'$set': {
                    'relationshipStatus': 'active',
                    'patchRequested': False,
                    'breakupReason': None
                }}
            )
            return JsonResponse({'message': 'Patch-up complete! 💖'}, status=200)

        # Step 6: Else just wait
        return JsonResponse({'message': 'Patch-up request sent. Waiting for your partner 🤝'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def breakup_status(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET allowed'}, status=405)

    try:
        token = request.COOKIES.get('loveconnect')
        user_email = None

        if token:
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_email = payload.get('email')
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)
        else:
            # fallback: get email from GET query string (unauthenticated breakup view only)
            user_email = request.GET.get('email')
            if not user_email:
                return JsonResponse({'error': 'Missing token or email'}, status=401)

        user = users_collection.find_one({'email': user_email})
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)

        if user.get('relationshipStatus') != 'break':
            return JsonResponse({'error': 'Not in breakup state'}, status=400)

        partner_email = user.get('pairedWith')
        partner = users_collection.find_one({'email': partner_email}) if partner_email else None

        return JsonResponse({
            'breakupReason': user.get('breakupReason'),
            'youRequested': user.get('patchRequested', False),
            'partnerRequested': partner.get('patchRequested', False) if partner else False
        }, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

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

@csrf_exempt
def send_message(request):
    if request.method == 'POST':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)

            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                sender_email = payload.get('email')
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)

            data = json.loads(request.body)
            msg_type = data.get('type')
            content = data.get('content')

            if not all([msg_type, content]):
                return JsonResponse({'error': 'Missing required fields'}, status=400)

            # Look up user to get partner info
            sender = users_collection.find_one({'email': sender_email})
            if not sender:
                return JsonResponse({'error': 'User not found'}, status=404)
            if not sender.get('isPaired') or not sender.get('pairedWith'):
                return JsonResponse({'error': 'User not paired'}, status=403)

            message = {
                'pairCode': sender['partnerCode'],
                'senderEmail': sender_email,
                'receiverEmail': sender['pairedWith'],
                'type': msg_type,
                'content': content,
                'timestamp': datetime.datetime.utcnow().isoformat()
            }

            db['messages'].insert_one(message)
            return JsonResponse({'message': 'Message sent'}, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

@csrf_exempt
def get_messages(request):
    if request.method == 'GET':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)

            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                sender_email = payload.get('email')
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)

            user = users_collection.find_one({'email': sender_email})
            if not user or not user.get('partnerCode'):
                return JsonResponse({'error': 'User not paired'}, status=403)

            pair_code = user['partnerCode']

            messages = list(db['messages'].find({'pairCode': pair_code}).sort('timestamp', 1))
            for msg in messages:
                msg['_id'] = str(msg['_id'])  # convert ObjectId to string

            return JsonResponse({'messages': messages}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only GET allowed'}, status=405)

@csrf_exempt
def get_user(request):
    if request.method == 'GET':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)

            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_email = payload.get('email')
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)

            user = users_collection.find_one({'email': user_email})
            if not user:
                return JsonResponse({'error': 'User not found'}, status=404)

            # Get partner details if paired
            partner_name = None
            if user.get('pairedWith'):
                partner = users_collection.find_one({'email': user.get('pairedWith')})
                if partner:
                    partner_name = partner.get('name')

            user_data = {
                '_id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'isPaired': user.get('isPaired', False),
                'partnerCode': user.get('partnerCode'),
                'pairedWith': user.get('pairedWith'),
                'partnerName': partner_name,
                'relationshipStatus': user.get('relationshipStatus', 'active')
            }

            return JsonResponse(user_data, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only GET method allowed'}, status=405)

@csrf_exempt
def update_profile(request):
    if request.method == 'POST':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)

            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_email = payload.get('email')
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)

            data = json.loads(request.body)
            new_name = data.get('name')

            if not new_name or len(new_name.strip()) < 2:
                return JsonResponse({'error': 'Name must be at least 2 characters'}, status=400)

            result = users_collection.update_one(
                {'email': user_email},
                {'$set': {'name': new_name.strip()}}
            )

            if result.modified_count == 1:
                return JsonResponse({'message': 'Profile updated successfully'}, status=200)
            else:
                return JsonResponse({'message': 'No changes made'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

@csrf_exempt
def change_pin(request):
    if request.method == 'POST':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)

            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                user_email = payload.get('email')
            except jwt.ExpiredSignatureError:
                return JsonResponse({'error': 'Token expired'}, status=401)
            except jwt.InvalidTokenError:
                return JsonResponse({'error': 'Invalid token'}, status=401)

            data = json.loads(request.body)
            old_pin = data.get('oldPin')
            new_pin = data.get('newPin')

            if not old_pin or not new_pin:
                return JsonResponse({'error': 'Both old and new PIN are required'}, status=400)

            user = users_collection.find_one({'email': user_email})
            if not user:
                return JsonResponse({'error': 'User not found'}, status=404)

            # Verify old PIN
            if not bcrypt.checkpw(old_pin.encode('utf-8'), user['pin'].encode('utf-8')):
                return JsonResponse({'error': 'Old PIN is incorrect'}, status=403)

            # Hash and store new PIN
            hashed_new_pin = bcrypt.hashpw(new_pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            users_collection.update_one({'email': user_email}, {'$set': {'pin': hashed_new_pin}})

            return JsonResponse({'message': 'PIN changed successfully'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

@csrf_exempt
def update_relationship_status(request):
    if request.method != 'PATCH':
        return JsonResponse({'error': 'Only PATCH method allowed'}, status=405)

    try:
        token = request.COOKIES.get('loveconnect')
        if not token:
            return JsonResponse({'error': 'Missing token'}, status=401)

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_email = payload.get('email')
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        data = json.loads(request.body)
        new_status = data.get('status')

        if new_status not in ['active', 'break', 'pending_patchup']:
            return JsonResponse({'error': 'Invalid status value'}, status=400)

        user = users_collection.find_one({'email': user_email})
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)

        partner_email = user.get('pairedWith')
        if not partner_email:
            return JsonResponse({'error': 'No partner linked'}, status=400)

        # Update both user and partner
        users_collection.update_one(
            {'email': user_email},
            {'$set': {'relationshipStatus': new_status}}
        )

        users_collection.update_one(
            {'email': partner_email},
            {'$set': {'relationshipStatus': new_status}}
        )

        return JsonResponse({'message': f'Relationship status updated to "{new_status}"'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def breakup(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)
    
    try:
        token = request.COOKIES.get('loveconnect')
        if not token:
            return JsonResponse({'error': 'Missing token'}, status=401)
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_email = payload.get('email')
        data = json.loads(request.body)
        reason = data.get('reason', '').strip()

        if not reason:
            return JsonResponse({'error': 'Reason is required'}, status=400)

        user = users_collection.find_one({'email': user_email})
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)

        partner_email = user.get('pairedWith')
        if not partner_email:
            return JsonResponse({'error': 'No partner paired'}, status=400)

        # Save breakup reason and status for both
        users_collection.update_one(
            {'email': user_email},
            {'$set': {
                'relationshipStatus': 'break',
                'breakupReason': reason
            }}
        )

        users_collection.update_one(
            {'email': partner_email},
            {'$set': {
                'relationshipStatus': 'break',
                'breakupReason': reason
            }}
        )

        return JsonResponse({'message': 'Breakup reason saved'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def logout(request):
    if request.method == 'POST':
        response = JsonResponse({'message': 'Logged out successfully'})
        response.delete_cookie('loveconnect')
        return response
    
    return JsonResponse({'error': 'Only POST method allowed'}, status=405)