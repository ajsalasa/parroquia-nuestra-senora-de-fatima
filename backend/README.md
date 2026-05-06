# Backend Deployment (AWS Lambda + S3)

The backend for this application is extremely lightweight to keep costs as low as possible. It consists of a single AWS Lambda function that reads and writes an `events.json` file inside an S3 bucket.

## Deployment Steps

1. **Create an S3 Bucket**
   - Go to the AWS S3 Console and create a new bucket (e.g., `calendario-sagrada-familia-data`).
   - Block public access if you only want the Lambda to access it, OR allow public read access to `events.json` if you want the frontend to read the file directly (cheaper, bypassing Lambda for reads).

2. **Create the Lambda Function**
   - Go to the AWS Lambda Console and create a new function.
   - **Runtime**: Python 3.9 (or newer).
   - **Execution Role**: Make sure the Lambda has an IAM role with permissions to `s3:GetObject` and `s3:PutObject` on your bucket.

3. **Deploy the Code**
   - Copy the contents of `lambda_function.py` into the Lambda code editor.

4. **Environment Variables**
   - Add the following environment variables to your Lambda function configuration:
     - `BUCKET_NAME`: The name of the S3 bucket you created (e.g., `calendario-sagrada-familia-data`).
     - `ADMIN_PASSWORD`: A secure password that the frontend admin dashboard will use to authenticate requests (e.g., `super_secret_password_123`).

5. **API Gateway / Function URL**
   - Under Configuration -> Function URL, create a new Function URL.
   - **Auth type**: NONE (Since our code handles the basic Bearer token check for POST requests).
   - **CORS**: Configure CORS to allow `*` origin, and methods `GET, POST, OPTIONS`.
   - Copy the generated Function URL.

## Connecting Frontend to Backend

Once you have the Function URL, you'll need to update `app.js` in the frontend to make actual `fetch` requests to this URL instead of using the local mocked state. 

*(Currently, the frontend uses local, hardcoded mock data so you can test the UI immediately out of the box).*
