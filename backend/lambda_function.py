import json
import boto3
import os
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')
FILE_KEY = 'events.json'
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

def get_events():
    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=FILE_KEY)
        data = response['Body'].read().decode('utf-8')
        return json.loads(data)
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            return []
        raise e

def save_events(events):
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=FILE_KEY,
        Body=json.dumps(events),
        ContentType='application/json',
        # Optional: ACL='public-read' if you want frontend to read directly from S3 URL
    )

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
    }

    http_method = event.get('httpMethod')
    if not http_method and 'requestContext' in event and 'http' in event['requestContext']:
        http_method = event['requestContext']['http']['method']

    if http_method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    # Verify Auth for POST (Admin actions)
    if http_method == 'POST':
        auth_header = event.get('headers', {}).get('authorization', '')
        # Expecting simple Bearer token matching ADMIN_PASSWORD for this cheap prototype
        if auth_header != f"Bearer {ADMIN_PASSWORD}":
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Unauthorized'})
            }

        try:
            body_content = event.get('body', '[]')
            if event.get('isBase64Encoded'):
                import base64
                body_content = base64.b64decode(body_content).decode('utf-8')
            
            body = json.loads(body_content)
            # In a full app, validate 'body' is a list of events.
            save_events(body)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Events updated successfully'})
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error en POST: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    # GET request: return events
    if http_method == 'GET':
        try:
            events = get_events()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(events)
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error en GET: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': str(e)})
            }

    return {
        'statusCode': 400,
        'headers': headers,
        'body': json.dumps({'error': 'Unsupported HTTP method'})
    }
