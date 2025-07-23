import token
import boto3
import uuid
import os
from dotenv import load_dotenv
import jwt
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pymongo import MongoClient
import re

# MongoDB Connection
client = MongoClient("mongodb+srv://ihub:akash@ihub.fel24ru.mongodb.net/")
db = client['LoveConnect']
users_collection = db['users']

load_dotenv()

def upload_to_r2(file):
    import re

    def clean_filename(name):
        return re.sub(r'[^a-zA-Z0-9_.-]', '_', name)

    filename = f"{uuid.uuid4().hex}_{clean_filename(file.name)}"

    session = boto3.session.Session()
    s3 = session.client(
        service_name='s3',
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        endpoint_url=os.getenv("R2_ENDPOINT"),
        region_name=os.getenv("R2_REGION", "auto"),
    )

    s3.upload_fileobj(
        Fileobj=file,
        Bucket=os.getenv("R2_BUCKET_NAME"),
        Key=filename,
        ExtraArgs={
            "ContentType": file.content_type,
            "ACL": "public-read"
        }
    )

    # ✅ Do not include bucket name in URL path
    public_base = "https://pub-45e0e3fae3ed4ccdbe7b62d6420e2409.r2.dev"
    return f"{public_base}/{filename}"

@csrf_exempt
def upload_photo(request):
    if request.method == 'POST':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)

            payload = jwt.decode(token, "loveconnect", algorithms=["HS256"])
            user_email = payload['email']
            uploader_name = payload['name']
            partner_code = payload['partnerCode']

            image = request.FILES.get('image')
            caption = request.POST.get('caption')

            if not image or not caption:
                return JsonResponse({'error': 'Missing image or caption'}, status=400)

            image_url = upload_to_r2(image)

            db['gallery'].insert_one({
                'url': image_url,
                'caption': caption,
                'uploadedBy': uploader_name,
                'uploadedAt': datetime.datetime.utcnow(),
                'partnerCode': partner_code
            })

            return JsonResponse({'message': 'Photo uploaded', 'url': image_url}, status=201)

        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only POST allowed'}, status=405)

@csrf_exempt
def get_gallery(request):
    if request.method == 'GET':
        try:
            token = request.COOKIES.get('loveconnect')
            if not token:
                return JsonResponse({'error': 'Missing token'}, status=401)

            payload = jwt.decode(token, "loveconnect", algorithms=["HS256"])
            partner_code = payload['partnerCode']

            photos = list(db['gallery'].find({'partnerCode': partner_code}).sort('uploadedAt', -1))
            for p in photos:
                p['_id'] = str(p['_id'])

            return JsonResponse({'gallery': photos}, status=200)

        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Only GET allowed'}, status=405)
