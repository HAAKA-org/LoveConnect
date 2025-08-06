import jwt
import bcrypt
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pymongo import MongoClient
import json
import random
import string
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

def send_reset_email(to_email, reset_code):
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    sender_email = 'ajay.chakravarthi.s.ad.2022@snsce.ac.in'
    sender_password = 'jxnulfknujfmvlbj'

    subject = 'LoveConnect PIN Reset Code'
    body = f"""
    <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #d72660; background: #fff0f6; padding: 0; margin: 0;">
            <div style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px #e11d4822; padding: 36px 28px;">
            <div style="text-align: center;">
                <div style="font-size: 2.5em; margin-bottom: 8px;">💖</div>
                <h2 style="margin: 0; color: #d72660; font-weight: 700; letter-spacing: 1px;">LoveConnect</h2>
                <p style="color: #b91c4b; margin-top: 8px; font-size: 1.1em;">A little love, a little magic ✨</p>
            </div>
            <hr style="border: none; border-top: 2px dashed #f9a8d4; margin: 24px 0;">
            <p style="font-size: 1.1em;">Hi there <span style="font-size: 1.2em;">💌</span>,</p>
            <p>We received a request to reset your <b>LoveConnect</b> PIN.</p>
            <p style="margin-bottom: 0.5em;">Your one-time PIN reset code is:</p>
            <div style="margin: 24px 0; text-align: center;">
                <span style="display: inline-block; font-size: 2.8em; font-weight: bold; letter-spacing: 12px; color: #fff; background: linear-gradient(90deg,#e11d48 60%,#f472b6 100%); padding: 20px 40px; border-radius: 16px; border: 3px solid #e11d48; box-shadow: 0 2px 12px #f472b655;">
                {reset_code}
                </span>
            </div>
            <p style="font-size: 1.05em;">Please enter this code in the app to set a new PIN.<br>
            <span style="color: #d72660; font-weight: 500;">This code is valid for <b>15 minutes</b>.</span></p>
            <p style="color: #888; font-size: 0.98em;">If you did not request a PIN reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 2px dashed #f9a8d4; margin: 24px 0;">
            <p style="margin-top: 32px; color: #b91c4b; font-size: 1.1em;">With love,<br>
                <b>The LoveConnect Team</b> <span style="font-size: 1.2em;">💕</span>
            </p>
            </div>
        </body>
    </html>
    """

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print('Email send failed:', e)
        return False

@csrf_exempt
def signup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            email = data.get('email')
            gender = data.get('gender')
            pin = data.get('pin')
            if not (name and email and gender and pin):
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            if gender not in ['male', 'female']:
                return JsonResponse({'error': 'Invalid gender selection'}, status=400)
            if not pin.isdigit() or len(pin) != 4:
                return JsonResponse({'error': 'PIN must be exactly 4 digits'}, status=400)
            if users_collection.find_one({'email': email}):
                return JsonResponse({'error': 'Email already registered'}, status=400)
            hashed_pin = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user = {
                'name': name,
                'email': email,
                'pin': hashed_pin,
                'gender': gender,
                'createdAt': datetime.datetime.utcnow()
            }
            users_collection.insert_one(user)
            return JsonResponse({'message': 'Signup successful'}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
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

            # Generate token (30 days expiry for persistent login)
            payload = {
                '_id': str(user['_id']),
                'email': user['email'],
                'name': user['name'],
                'partnerCode': user.get('partnerCode'),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            response = JsonResponse({'message': 'Login successful'})
            response.set_cookie(
                key='loveconnect',
                value=token,
                httponly=True,
                samesite='Lax',
                max_age=30*24*60*60,  # 30 days in seconds
                secure=False  # Set to True in production with HTTPS
            )
            return response

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

@csrf_exempt
def google_signin(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            token = data.get('token')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=400)

            # Verify Google token
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(),
                "1037758248458-o372odjqq94ctstj66pcrt601058hn1k.apps.googleusercontent.com"
            )
            email = idinfo.get('email')
            name = idinfo.get('name', email.split('@')[0])

            if not email:
                return JsonResponse({'error': 'Google token invalid'}, status=400)

            user = users_collection.find_one({'email': email})

            if not user:
                # Auto-signup for first-time Google user (without gender initially)
                user_doc = {
                    'name': name,
                    'email': email,
                    'createdAt': datetime.datetime.utcnow(),
                    'isPaired': False,
                    'gender': None  # Will be set later via profile completion
                }
                users_collection.insert_one(user_doc)
                # Fetch the user again to get the _id
                user = users_collection.find_one({'email': email})

            # Create JWT token first (needed for profile completion)
            payload = {
                '_id': str(user['_id']),
                'email': user['email'],
                'name': user['name'],
                'partnerCode': user.get('partnerCode'),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            }
            jwt_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            # ✅ Check if user needs to complete profile (gender selection)
            if not user.get('gender'):
                response = JsonResponse({
                    'message': 'Profile completion required',
                    'profile_incomplete': True,
                    'missing_fields': ['gender']
                }, status=200)
                response.set_cookie(
                    key='loveconnect',
                    value=jwt_token,
                    httponly=True,
                    samesite='Lax',
                    max_age=30*24*60*60,  # 30 days in seconds
                    secure=False  # Set to True in production with HTTPS
                )
                return response

            # ✅ Check if paired and not in breakup
            is_paired = user.get('isPaired', False)
            relationship_status = user.get('relationshipStatus', 'active')

            # ❗️Block login if breakup is active
            if relationship_status == 'break':
                reason = user.get('breakupReason', 'No reason provided.')
                return JsonResponse({
                    'error': f"Your partner has taken a break 💔: {reason}"
                }, status=403)

            # Create JWT token (30 days expiry for persistent login)
            payload = {
                '_id': str(user['_id']),
                'email': user['email'],
                'name': user['name'],
                'partnerCode': user.get('partnerCode'),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            }
            jwt_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            response = JsonResponse({
                'message': 'Google login successful',
                'login_success': is_paired  # ✅ return this flag
            })
            response.set_cookie(
                key='loveconnect',
                value=jwt_token,
                httponly=True,
                samesite='Lax',
                max_age=30*24*60*60,  # 30 days in seconds
                secure=False  # Set to True in production with HTTPS
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

            # Get current user's gender
            user_gender = user.get('gender')
            if not user_gender:
                return JsonResponse({'error': 'User gender not found. Please update your profile.'}, status=400)

            if code:
                # User is trying to pair using a partner's code
                partner = users_collection.find_one({'partnerCode': code, 'isPaired': False})
                if partner:
                    # Check partner's gender
                    partner_gender = partner.get('gender')
                    if not partner_gender:
                        return JsonResponse({'error': 'Partner gender information not available.'}, status=400)
                    
                    # Validate gender compatibility (no same-gender pairing)
                    if user_gender == partner_gender:
                        return JsonResponse({
                            'error': 'Same gender pairing is not allowed. Only male-female pairs are supported.'
                        }, status=400)
                    
                    # Pair both users (only if genders are different)
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
                'gender': user.get('gender'),  # Add gender field
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
def refresh_token(request):
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

            user = users_collection.find_one({'email': user_email})
            if not user:
                return JsonResponse({'error': 'User not found'}, status=404)

            # Generate new token with extended expiry
            new_payload = {
                '_id': str(user['_id']),
                'email': user['email'],
                'name': user['name'],
                'partnerCode': user.get('partnerCode'),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
            }
            new_token = jwt.encode(new_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            response = JsonResponse({'message': 'Token refreshed'})
            response.set_cookie(
                key='loveconnect',
                value=new_token,
                httponly=True,
                samesite='Lax',
                max_age=30*24*60*60,
                secure=False
            )
            return response

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

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
def complete_google_profile(request):
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
            gender = data.get('gender')

            if not gender or gender not in ['male', 'female']:
                return JsonResponse({'error': 'Valid gender selection required'}, status=400)

            user = users_collection.find_one({'email': user_email})
            if not user:
                return JsonResponse({'error': 'User not found'}, status=404)

            # Update user with gender
            users_collection.update_one(
                {'email': user_email},
                {'$set': {'gender': gender}}
            )

            return JsonResponse({'message': 'Profile completed successfully'}, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST method allowed'}, status=405)

@csrf_exempt
def forgot_pin(request):
    """
    POST /loveconnect/api/forgot-pin/
    Body: { "email": "user@example.com" }
    Generates a reset code, stores it in the user doc, and sends an email.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get('email')
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)

        user = users_collection.find_one({'email': email})
        if not user:
            # Explicitly fail if user not found
            return JsonResponse({'error': 'User not found'}, status=404)

        # Generate a 6-digit reset code
        reset_code = ''.join(random.choices(string.digits, k=6))
        users_collection.update_one({'email': email}, {'$set': {
            'pinResetCode': reset_code,
            'pinResetCodeCreatedAt': datetime.datetime.utcnow()
        }})

        # Send the reset code to the user's email
        email_sent = send_reset_email(email, reset_code)
        if not email_sent:
            return JsonResponse({'error': 'Failed to send reset email. Please try again later.'}, status=500)

        return JsonResponse({'message': 'You will receive instructions to reset your PIN.'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def verify_reset_pin(request):
    """
    POST /loveconnect/api/verify-reset-pin/
    Body: { "email": ..., "resetCode": ..., "newPin": ... }
    Verifies the reset code and updates the user's PIN if valid.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get('email')
        reset_code = data.get('resetCode')
        new_pin = data.get('newPin')
        if not (email and reset_code and new_pin):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        user = users_collection.find_one({'email': email})
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)

        # Check if reset code matches and is not expired (valid for 15 min)
        stored_code = user.get('pinResetCode')
        code_time = user.get('pinResetCodeCreatedAt')
        if not stored_code or not code_time:
            return JsonResponse({'error': 'No reset code found. Please request again.'}, status=400)

        # Check code expiry (15 min)
        now = datetime.datetime.utcnow()
        if isinstance(code_time, dict) and '$date' in code_time:
            code_time = datetime.datetime.fromisoformat(code_time['$date'].replace('Z', '+00:00'))
        elif isinstance(code_time, str):
            code_time = datetime.datetime.fromisoformat(code_time.replace('Z', '+00:00'))
        # else assume datetime
        if now - code_time > datetime.timedelta(minutes=15):
            return JsonResponse({'error': 'Reset code expired. Please request again.'}, status=400)

        if str(stored_code) != str(reset_code):
            return JsonResponse({'error': 'Invalid reset code.'}, status=400)

        # Hash and update new PIN
        hashed_new_pin = bcrypt.hashpw(new_pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_collection.update_one(
            {'email': email},
            {'$set': {'pin': hashed_new_pin}, '$unset': {'pinResetCode': '', 'pinResetCodeCreatedAt': ''}}
        )

        return JsonResponse({'message': 'PIN updated successfully.'}, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
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