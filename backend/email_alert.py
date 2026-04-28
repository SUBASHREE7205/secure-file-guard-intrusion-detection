import smtplib
from email.mime.text import MIMEText

def send_email_alert(filename):

    sender = "subashreeraman2005@gmail.com"
    password = "zedj bjnb ggun nhky"
    receiver = "subashreeraman57@gmail.com"

    message = MIMEText(f"Threat detected in file: {filename}")
    message["Subject"] = "SecureFileGuard Alert"
    message["From"] = sender
    message["To"] = receiver

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender, password)
    server.sendmail(sender, receiver, message.as_string())
    server.quit()