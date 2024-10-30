from flask import Flask, request, jsonify
import pyotp
import mysql.connector
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import threading
from flask_cors import CORS
import boto3
import os

# Use AWS SES SMTP settings
SMTP_SERVER = ''  # Change this to the region you're using SES in
SMTP_PORT = 587  
SENDER_EMAIL = ''  # Replace with your verified email in SES
SES_SMTP_USERNAME = ''  # SMTP credentials from SES
SES_SMTP_PASSWORD = ''


app = Flask(__name__)


CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, methods=['GET', 'POST', 'OPTIONS'])
CORS(app, resources={r"/*": {"origins": "http://localhost:3001"}}, methods=['GET', 'POST', 'OPTIONS'])


# Connect to MySQL database
try:
    usersDb = mysql.connector.connect(
        host='',
        user='',
        password='',
        database=''
    )
except mysql.connector.Error as err:
    print(f"Error connecting to MySQL: {err}")

# Store OTPs in memory (for demonstration purposes) and a lock for thread safety
otp_store = {}
otp_lock = threading.Lock()


def send_otp_via_email(receiver_email, otp):
    """Send OTP via email using Amazon SES."""
    try:
        # Email content
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = receiver_email
        msg['Subject'] = 'Your OTP for Verification'

        body = f"Your OTP is {otp}. It will expire in 5 minutes."
        msg.attach(MIMEText(body, 'plain'))

        # Set up the server and send the email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Use starttls for secure connection

        # Log in to the server using SES SMTP credentials
        server.login(SES_SMTP_USERNAME, SES_SMTP_PASSWORD)

        # Send the email
        server.sendmail(SENDER_EMAIL, receiver_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def clean_expired_otps():
    """Remove expired OTPs from the store."""
    with otp_lock:
        now = datetime.now()
        expired_users = [user for user, data in otp_store.items() if data['expires_at'] < now]
        for user in expired_users:
            del otp_store[user]

@app.route('/generate-otp', methods=['POST'])
def generate_otp():
    """Generate an OTP and send it to the user's email."""
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({'error': 'Username is required'}), 400
    cursor = None 
    # Query to fetch user email from the database
    try:
        cursor = usersDb.cursor(dictionary=True)
        query = "SELECT email_id FROM user WHERE username = %s"
        cursor.execute(query, (username,))
        result = cursor.fetchone()

        if not result:
            return jsonify({'error': 'User not found'}), 404

        email = result['email_id']

        # Generate TOTP using pyotp
        totp = pyotp.TOTP(pyotp.random_base32())
        otp = totp.now()

        # Store the OTP with an expiration time of 5 minutes
        with otp_lock:
            otp_store[username] = {
                'otp': otp,
                'expires_at': datetime.now() + timedelta(minutes=5)
            }

        # Send OTP via email
        if send_otp_via_email(email, otp):
            return jsonify({'message': 'OTP sent to email'}), 200
        else:
            return jsonify({'error': 'Failed to send OTP'}), 500
    except mysql.connector.Error as err:
        return jsonify({'error': f'Database error: {err}'}), 500
    finally:
        cursor.close()

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify the OTP provided by the user."""
    data = request.json
    username = data.get('username')
    otp = data.get('otp')

    if not username or not otp:
        return jsonify({'error': 'Username and OTP are required'}), 400

    # Clean up expired OTPs before verification
    clean_expired_otps()

    # Verify the OTP
    with otp_lock:
        if username in otp_store:
            stored_otp_data = otp_store[username]
            if datetime.now() > stored_otp_data['expires_at']:
                del otp_store[username]  # Remove expired OTP
                return jsonify({'error': 'OTP expired'}), 400
            if stored_otp_data['otp'] == otp:
                del otp_store[username]  # OTP is valid, remove after verification
                return jsonify({'message': 'OTP verified successfully'}), 200
            else:
                return jsonify({'error': 'Invalid OTP'}), 400
        else:
            return jsonify({'error': 'OTP not found for user'}), 404

if __name__ == '__main__':
    app.run(debug=True)
