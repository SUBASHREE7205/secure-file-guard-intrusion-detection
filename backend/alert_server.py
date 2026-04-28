import socket
import smtplib
import requests
from email.mime.text import MIMEText

# CONFIG
HOST = "127.0.0.1"
PORT = 5050
FLASK_API = "http://127.0.0.1:5000/api/external-alert"

# EMAIL
import os
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "your_email@gmail.com")
APP_PASSWORD = os.getenv("APP_PASSWORD", "your_app_password")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin_email@gmail.com")

# WHATSAPP (Twilio)
TWILIO_SID = os.getenv("TWILIO_SID", "your_twilio_sid")
TWILIO_AUTH = os.getenv("TWILIO_AUTH", "your_twilio_auth")
FROM = os.getenv("TWILIO_FROM", "whatsapp:+1415523xxxx")
TO = os.getenv("TWILIO_TO", "whatsapp:+919943xxxxx")


def send_email(msg_text):
    try:
        msg = MIMEText(msg_text)
        msg["Subject"] = "🚨 Malware Alert"
        msg["From"] = SENDER_EMAIL
        msg["To"] = ADMIN_EMAIL

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        server.send_message(msg)
        server.quit()

        print("📧 Email Sent")
    except Exception as e:
        print("Email Error:", e)


def send_whatsapp(msg_text):
    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_AUTH)

        client.messages.create(
            body=msg_text,
            from_=FROM,
            to=TO
        )

        print("📲 WhatsApp Sent")
    except Exception as e:
        print("WhatsApp Error:", e)


# SERVER
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((HOST, PORT))
server.listen(5)

print("🚀 Alert Server Running...")

while True:
    client, addr = server.accept()
    print("Connected:", addr)

    msg = client.recv(4096).decode()
    print("🚨 ALERT:", msg)

    filename = msg.split(":")[-1].strip()

    send_email(msg)
    send_whatsapp(f"🚨 Malware Blocked: {filename}")

    try:
        requests.post(FLASK_API, json={"file": filename})
        print("📊 Dashboard Updated")
    except:
        print("Dashboard error")

    client.close()