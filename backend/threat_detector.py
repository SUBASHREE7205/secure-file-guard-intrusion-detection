import os

suspicious_extensions = [".exe", ".bat", ".vbs", ".ps1", ".cmd"]

def detect_threat(filename):

    ext = os.path.splitext(filename)[1].lower()

    if ext in suspicious_extensions:
        return "Threat"

    return "Safe"