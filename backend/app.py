from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import csv
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ================= CONFIG =================
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
DATA_FILE = os.path.join(BASE_DIR, "data.json")

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
        auth_token  = os.getenv("TWILIO_AUTH", "")

        client = Client(account_sid, auth_token)

        client.messages.create(
            body=message,
            from_="whatsapp:+14155238886",
            to="whatsapp:+919943441031"
        )

        print("📲 WhatsApp Sent")

    except Exception as e:
        print("❌ WhatsApp Error:", e)

import joblib
from extract_features import extract_features

# Load the AI Model
try:
    model_path = os.path.join(BASE_DIR, "xgb_model.pkl")
    xgb_model = joblib.load(model_path)
except Exception as e:
    print("Warning: Could not load XGBoost model:", e)
    xgb_model = None

# ================= THREAT DETECTION =================
def analyze_file(filepath):

    print(f"\n[ANALYZING] {filepath}")

    # 1. AI-BASED CONTENT ANALYSIS (Answers the guide's question!)
    if xgb_model is not None:
        try:
            # Extract actual content behavior (entropy, size, bits) irrespective of extension
            feats, entropy, is_eicar, label = extract_features(filepath)
            prediction = xgb_model.predict(feats)[0]

            ext = os.path.splitext(filepath)[1].lower()

            if prediction == 1:
                print(f"🚨 [MALWARE DETECTED] AI flagged malicious content: {filepath}")
                return "critical", "Malicious content detected by AI (XGBoost)"
            else:
                if ext in [".exe", ".bat", ".cmd", ".vbs", ".ps1"]:
                    print(f"⚠️  [POLICY BLOCK] Dangerous extension despite AI clean verdict: {filepath}")
                    return "low", "Safe code verified by AI content analysis"
                print(f"✅ [SAFE] AI verified safe file. Allowed: {filepath}")
                return "low", "Safe file (AI verified)"
        except Exception as e:
            print("❌ ML Error:", e)

    # 2. FALLBACK EXTENSION-BASED POLICY
    if filepath.endswith((".exe",".bat",".cmd",".js",".vbs",".ps1")):
        print(f"🚨 [MALWARE DETECTED] Dangerous executable extension: {filepath}")
        return "critical", "Executable file (Fallback Ext Rule)"

    elif filepath.endswith((".zip",".rar",".7z",".dll",".iso")):
        print(f"⚠️  [HIGH RISK] Compressed or binary file: {filepath}")
        return "high", "Compressed or risky file (Fallback Ext Rule)"

    elif filepath.endswith((".pdf",".doc",".docx",".xls",".xlsx")):
        print(f"⚠️  [MEDIUM RISK] Document file detected: {filepath}")
        return "medium", "Document file (Fallback Ext Rule)"

    print(f"✅ [SAFE] File passed all checks. Allowed: {filepath}")
    return "low", "Safe file (Fallback Ext Rule)"

# ================= REPORT =================
def add_to_reports(file_info):
    reports.append({
        "file": file_info["filename"],
        "threat": file_info["threat_level"],
        "status": file_info["status"],
        "time": file_info["timestamp"]
    })

# ================= HELPERS =================
def threat_to_status(threat):
    """Convert threat level to action status."""
    if threat in ("critical", "high"):
        return "blocked"
    elif threat == "medium":
        return "quarantined"
    else:
        return "safe"

# ================= UPLOAD =================
@app.route("/api/upload", methods=["POST"])
def upload_file():

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    sender = request.form.get("sender", "unknown")

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    print(f"\n{'='*50}")
    print(f"📤 [UPLOAD RECEIVED] File: {file.filename} | From: {sender}")

    threat, reason = analyze_file(filepath)
    status = threat_to_status(threat)

    print(f"📊 Threat Level : {threat.upper()}")
    print(f"📝 Reason       : {reason}")
    print(f"🔒 Action       : {status.upper()}")
    print(f"{'='*50}\n")

    file_info = {
        "id": len(files_data)+1,
        "filename": file.filename,
        "sender": sender,
        "size": str(os.path.getsize(filepath)) + " bytes",
        "threat_level": threat,
        "reason": reason,
        "status": status,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    files_data.append(file_info)
    add_to_reports(file_info)

    if threat in ("critical", "high"):
        alerts.append({
            "message": f"🚨 File Blocked: {file.filename}",
            "time": datetime.now().strftime("%H:%M:%S")
        })
        send_whatsapp(
            f"🚨 SecureFileGuard Alert\n"
            f"File: {file.filename}\n"
            f"Threat: {threat.upper()}\n"
            f"Reason: {reason}\n"
            f"Action: {status.upper()}\n"
            f"Time: {file_info['timestamp']}"
        )
    else:
        alerts.append({
            "message": f"✅ Safe File Allowed: {file.filename}",
            "time": datetime.now().strftime("%H:%M:%S")
        })

    save_data()

    return jsonify(file_info)

# ================= EXTERNAL ALERT =================
@app.route("/api/external-alert", methods=["POST"])
def external_alert():

    data = request.json
    filename = data.get("file")
    threat   = data.get("threat", "critical")
    reason   = data.get("reason", "Detected by file monitor")
    action   = data.get("action", "blocked")
    path     = data.get("path", "Unknown")
    status   = threat_to_status(threat)

    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    file_info = {
        "id":           len(files_data) + 1,
        "filename":     filename,
        "sender":       "File Monitor",
        "size":         "Unknown",
        "threat_level": threat,
        "reason":       reason,
        "status":       status,
        "path":         path,
        "timestamp":    ts
    }

    files_data.append(file_info)
    add_to_reports(file_info)

    print(f"[EXTERNAL ALERT] {filename} | Threat: {threat.upper()} | Action: {action.upper()}")

    # ── Threat alert → dashboard + WhatsApp
    if threat in ("critical", "high", "medium"):
        alerts.append({
            "message": f"🚨 Threat Detected ({threat.upper()}): {filename}",
            "time":    datetime.now().strftime("%H:%M:%S")
        })
        print(f"📲 Sending WhatsApp for threat: {threat.upper()}")
        send_whatsapp(
            f"🚨 SecureFileGuard Alert\n"
            f"File: {filename}\n"
            f"Path: {path}\n"
            f"Threat: {threat.upper()}\n"
            f"Action: {action.upper()}\n"
            f"Time: {ts}"
        )
    else:
        # Safe/low-threat files — record on dashboard only, no WhatsApp spam
        alerts.append({
            "message": f"✅ Safe File Allowed: {filename}",
            "time":    datetime.now().strftime("%H:%M:%S")
        })
        print(f"✅ Safe file recorded — no WhatsApp sent.")

    save_data()

    return jsonify({"ok": True, "threat": threat, "status": status})

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
        writer.writerow(["File", "Threat", "Status", "Time"])

        for r in reports:
            writer.writerow([r["file"], r["threat"], r["status"], r["time"]])

    return send_file(filename, as_attachment=True)

@app.route("/api/alerts")
def get_alerts():
    return jsonify(alerts[::-1][:5])

@app.route("/api/threat-stats")
def stats():
    s = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in files_data:
        lvl = f.get("threat_level", "low")
        if lvl in s:
            s[lvl] += 1
    return jsonify(s)

@app.route("/api/stats")
def full_stats():
    """Richer stats endpoint: total, safe, unsafe, by-level breakdown."""
    total = len(files_data)
    by_level = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    safe_count = 0
    unsafe_count = 0
    blocked_count = 0
    quarantined_count = 0

    for f in files_data:
        lvl = f.get("threat_level", "low")
        status = f.get("status", "safe")
        if lvl in by_level:
            by_level[lvl] += 1
        if lvl in ("critical", "high"):
            unsafe_count += 1
        else:
            safe_count += 1
        if status == "blocked":
            blocked_count += 1
        elif status == "quarantined":
            quarantined_count += 1

    return jsonify({
        "total": total,
        "safe": safe_count,
        "unsafe": unsafe_count,
        "blocked": blocked_count,
        "quarantined": quarantined_count,
        **by_level
    })

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "files": len(files_data), "alerts": len(alerts)})

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True, port=5000)