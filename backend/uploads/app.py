from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import csv
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ================= CONFIG =================
UPLOAD_FOLDER = "uploads"
DATA_FILE = "data.json"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

files_data = []
alerts = []
reports = []

# ================= LOAD DATA =================
if os.path.exists(DATA_FILE):
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            files_data = data.get("files", [])
            alerts = data.get("alerts", [])
            reports = data.get("reports", [])
    except:
        pass

def save_data():
    with open(DATA_FILE, "w") as f:
        json.dump({
            "files": files_data,
            "alerts": alerts,
            "reports": reports
        }, f, indent=4)

# ================= WHATSAPP FUNCTION =================
def send_whatsapp(message):
    try:
        import os
        from twilio.rest import Client

        account_sid = os.getenv("TWILIO_SID", "")
        auth_token = os.getenv("TWILIO_AUTH", "")

        client = Client(account_sid, auth_token)

        client.messages.create(
            body=message,
            from_="whatsapp:+14155238886",
            to="whatsapp:+919943441031"
        )

        print("📲 WhatsApp Sent")

    except Exception as e:
        print("❌ WhatsApp Error:", e)

# ================= THREAT DETECTION =================
def analyze_file(filepath):

    if filepath.endswith((".exe",".bat",".cmd",".js",".vbs",".ps1")):
        return "critical", "Executable file"

    elif filepath.endswith((".zip",".rar",".7z",".dll",".iso")):
        return "high", "Compressed or risky file"

    elif filepath.endswith((".pdf",".doc",".docx",".xls",".xlsx")):
        return "medium", "Document file"

    return "low", "Safe file (blocked by policy)"

# ================= REPORT =================
def add_to_reports(file_info):
    reports.append({
        "file": file_info["filename"],
        "threat": file_info["threat_level"],
        "status": file_info["status"],
        "time": file_info["timestamp"]
    })

# ================= UPLOAD =================
@app.route("/api/upload", methods=["POST"])
def upload_file():

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    sender = request.form.get("sender", "unknown")

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    threat, reason = analyze_file(filepath)

    file_info = {
        "id": len(files_data)+1,
        "filename": file.filename,
        "sender": sender,
        "size": str(os.path.getsize(filepath)) + " bytes",
        "threat_level": threat,
        "reason": reason,
        "status": "blocked",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    files_data.append(file_info)
    add_to_reports(file_info)

    alerts.append({
        "message": f"🚨 File Blocked: {file.filename}",
        "time": datetime.now().strftime("%H:%M:%S")
    })

    send_whatsapp(f"🚨 File Blocked: {file.filename}")  # 📲 ALERT

    save_data()

    return jsonify(file_info)

# ================= EXTERNAL ALERT =================
@app.route("/api/external-alert", methods=["POST"])
def external_alert():

    data = request.json
    filename = data.get("file")

    file_info = {
        "id": len(files_data)+1,
        "filename": filename,
        "sender": "system",
        "size": "Unknown",
        "threat_level": "critical",
        "reason": "Detected by monitor",
        "status": "blocked",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    files_data.append(file_info)
    add_to_reports(file_info)

    alerts.append({
        "message": f"🚨 Threat: {filename}",
        "time": datetime.now().strftime("%H:%M:%S")
    })

    send_whatsapp(f"🚨 External Threat: {filename}")  # 📲 ALERT

    save_data()

    return jsonify({"ok": True})

# ================= WHATSAPP API =================
@app.route("/send-whatsapp", methods=["POST"])
def whatsapp_api():
    data = request.json
    message = data.get("message")

    send_whatsapp(message)

    return jsonify({"status": "sent"})

# ================= APIs =================
@app.route("/api/files")
def get_files():
    return jsonify(files_data[::-1])

@app.route("/api/reports")
def get_reports():
    return jsonify(reports[::-1])

@app.route("/api/reports/download")
def download():
    filename = "report.csv"

    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["File","Threat","Status","Time"])

        for r in reports:
            writer.writerow([r["file"],r["threat"],r["status"],r["time"]])

    return send_file(filename, as_attachment=True)

@app.route("/api/alerts")
def get_alerts():
    return jsonify(alerts[::-1][:5])

@app.route("/api/threat-stats")
def stats():
    s = {"critical":0,"high":0,"medium":0,"low":0}
    for f in files_data:
        if f["threat_level"] in s:
            s[f["threat_level"]] += 1
    return jsonify(s)

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True, port=5000)