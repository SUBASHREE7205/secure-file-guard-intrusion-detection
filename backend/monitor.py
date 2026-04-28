# -*- coding: utf-8 -*-
"""
SecureFileGuard - monitor.py
Monitors filesystem, OS health, and website availability.
Sends WhatsApp alerts via Twilio for any threat detected.
"""

import os
import sys
import time
import shutil
import threading
import requests
import psutil
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Fix Windows console encoding so print() never crashes
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ensure we always resolve paths relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ================= CONFIG =================

USERNAME = "admin"   # Change if needed

# ---- All confirmed real paths on THIS machine ----
POSSIBLE_PATHS = [
    fr"C:\Users\{USERNAME}\Downloads",           # Downloads
    fr"C:\Users\{USERNAME}\Documents",           # Local Documents
    fr"C:\Users\{USERNAME}\OneDrive\Desktop",    # Actual Desktop (OneDrive-synced)
    fr"C:\Users\{USERNAME}\OneDrive\Downloads",  # OneDrive Downloads
    fr"C:\Users\{USERNAME}\OneDrive",            # Entire OneDrive root
]

MONITOR_PATHS = [p for p in POSSIBLE_PATHS if os.path.exists(p)]

QUARANTINE_FOLDER = fr"C:\Users\{USERNAME}\SecureFileGuard_Quarantine"

# Websites / services to health-check
WEBSITES_TO_MONITOR = [
    {"name": "Flask Backend",  "url": "http://127.0.0.1:5000/api/health"},
    {"name": "Frontend App",   "url": "http://localhost:5173"},
]

# OS thresholds for alerts
CPU_THRESHOLD    = 90   # %
MEMORY_THRESHOLD = 90   # %
DISK_THRESHOLD   = 90   # %

# Intervals
WEBSITE_CHECK_INTERVAL = 30   # seconds
OS_CHECK_INTERVAL      = 60   # seconds

# Twilio credentials
import os
TWILIO_SID   = os.getenv("TWILIO_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH", "")
WHATSAPP_FROM = os.getenv("TWILIO_FROM", "whatsapp:+1415523xxxx")
WHATSAPP_TO   = os.getenv("TWILIO_TO", "whatsapp:+919943xxxxx")

# Dangerous extensions -- block immediately on detection (no ML needed)
DANGEROUS_EXTS = {
    ".exe", ".bat", ".cmd", ".vbs", ".ps1",
    ".msi", ".scr", ".pif", ".com", ".jar"
}

# Runtime/system files to always skip
RUNTIME_EXTS = {
    ".lnk", ".ini", ".sys", ".tmp", ".log", ".dll",
    ".db", ".db-journal", ".pf", ".mui", ".etl"
}

processed_files  = {}
os.makedirs(QUARANTINE_FOLDER, exist_ok=True)

last_site_status  = {}   # url  -> True/False
os_alert_cooldown = {}   # metric -> last_alert_time

# ================= HELPERS =================

def now_str():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def log(msg):
    try:
        print(f"[{now_str()}] {msg}", flush=True)
    except Exception:
        pass

# ================= WHATSAPP =================

def send_whatsapp(message):
    """Send WhatsApp via Twilio."""
    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        client.messages.create(
            body=message,
            from_=WHATSAPP_FROM,
            to=WHATSAPP_TO
        )
        log("[WHATSAPP] Message sent successfully.")
    except Exception as e:
        log(f"[WHATSAPP ERROR] {e}")


def send_to_backend(filename, filepath="Unknown", threat="critical", action="blocked"):
    """Send alert to Flask backend (backend handles WhatsApp for file threats)."""
    try:
        resp = requests.post(
            "http://127.0.0.1:5000/api/external-alert",
            json={
                "file":   filename,
                "path":   filepath,
                "threat": threat,
                "action": action,
                "reason": f"Detected by file monitor ({threat} threat)"
            },
            timeout=5
        )
        if resp.status_code == 200:
            log(f"[BACKEND] Notified OK -> threat={threat}, action={action}")
        else:
            log(f"[BACKEND] Returned {resp.status_code}")
    except requests.exceptions.ConnectionError:
        log("[BACKEND ERROR] Cannot connect. Is app.py running on port 5000?")
    except Exception as e:
        log(f"[BACKEND ERROR] {e}")

# ================= FILE HANDLER =================

class SecureHandler(FileSystemEventHandler):

    def block_file(self, file_path, threat_level="critical"):
        try:
            time.sleep(0.8)   # let OS finish writing the file

            if not os.path.exists(file_path):
                log(f"[SKIPPED] Already removed: {file_path}")
                return

            filename       = os.path.basename(file_path)
            quarantine_path = os.path.join(QUARANTINE_FOLDER, filename)

            # Avoid overwrite in quarantine
            if os.path.exists(quarantine_path):
                base, ext = os.path.splitext(filename)
                quarantine_path = os.path.join(
                    QUARANTINE_FOLDER,
                    f"{base}_{int(time.time())}{ext}"
                )

            shutil.move(file_path, quarantine_path)
            log(f"[BLOCKED]     {file_path}")
            log(f"[QUARANTINED] ({threat_level.upper()}) -> {quarantine_path}")

            # Desktop popup notification (optional)
            try:
                from plyer import notification
                notification.notify(
                    title="SecureFileGuard - THREAT BLOCKED",
                    message=f"Blocked ({threat_level.upper()}): {filename}",
                    timeout=5
                )
            except Exception:
                pass

            # Notify backend -> dashboard update + WhatsApp
            send_to_backend(
                filename,
                filepath=file_path,
                threat=threat_level,
                action="quarantined"
            )

        except PermissionError:
            log(f"[SKIPPED] File in use: {file_path}")
        except FileNotFoundError:
            log(f"[SKIPPED] File disappeared: {file_path}")
        except Exception as e:
            log(f"[ERROR] block_file: {e}")

    def process_file(self, file_path):

        if os.path.isdir(file_path):
            return

        # Skip quarantine folder
        if QUARANTINE_FOLDER in file_path:
            return

        # Skip our own project folder
        if "SecureFileGuard" in file_path and "backend" in file_path:
            return

        ext = os.path.splitext(file_path)[1].lower()

        # Skip runtime/system noise
        if ext in RUNTIME_EXTS:
            return

        # ---- Deduplicate rapid duplicate events ----
        n = time.time()
        try:
            current_size = os.path.getsize(file_path)
        except Exception:
            return

        file_info = processed_files.get(file_path)
        if file_info:
            last_time, last_size = file_info
            if current_size == last_size and (n - last_time < 5):
                return

        processed_files[file_path] = (n, current_size)

        # ==================================================
        # RULE 1 - POLICY BLOCK: Dangerous extension
        # Block IMMEDIATELY - no ML needed, no size check.
        # ==================================================
        if ext in DANGEROUS_EXTS:
            log(f"[THREAT DETECTED] Dangerous file: {os.path.basename(file_path)} (ext='{ext}')")
            self.block_file(file_path, threat_level="high")
            return

        # Skip 0-byte files for ML
        if current_size == 0:
            return

        # ==================================================
        # RULE 2 - ML ANALYSIS: Run AI model for all others
        # ==================================================
        import joblib
        if BASE_DIR not in sys.path:
            sys.path.insert(0, BASE_DIR)
        from extract_features import extract_features

        model_path = os.path.join(BASE_DIR, "xgb_model.pkl")

        try:
            model                              = joblib.load(model_path)
            feats, entropy, is_eicar, label    = extract_features(file_path)
            prediction                         = model.predict(feats)[0]

            if prediction == 1:
                log(f"[MALWARE DETECTED] AI flagged: {os.path.basename(file_path)}")
                self.block_file(file_path, threat_level="critical")
            else:
                # Safe - silent, just update backend dashboard
                send_to_backend(
                    os.path.basename(file_path),
                    filepath=file_path,
                    threat="low",
                    action="allowed"
                )

        except Exception as e:
            log(f"[ML ERROR] {e}")
            RISKY_EXTS = {".zip", ".rar", ".7z", ".iso"}
            if ext in RISKY_EXTS:
                log(f"[FALLBACK BLOCK] ML failed + risky ext: {os.path.basename(file_path)}")
                self.block_file(file_path, threat_level="medium")

    def on_created(self, event):
        if not event.is_directory:
            self.process_file(event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self.process_file(event.src_path)

    def on_moved(self, event):
        """Catches rename events (e.g. file.txt renamed to file.exe)."""
        if not event.is_directory:
            self.process_file(event.dest_path)

# ================= WEBSITE MONITOR =================

def monitor_websites():
    # Silent routine checks - only log on state change
    while True:
        for site in WEBSITES_TO_MONITOR:
            name = site["name"]
            url  = site["url"]
            try:
                r    = requests.get(url, timeout=5)
                is_up = (r.status_code < 500)
            except Exception:
                is_up = False

            prev = last_site_status.get(url)

            if is_up:
                if prev is False:
                    # Recovered - this is important
                    log(f"[WEBSITE RECOVERED] {name} is back online -> {url}")
                    send_whatsapp(
                        f"[SecureFileGuard] Service Recovered\n"
                        f"Service: {name}\nURL: {url}\nTime: {now_str()}"
                    )
                # else: routine OK - stay silent
                last_site_status[url] = True
            else:
                if prev is not False:
                    # Just went down - important!
                    log(f"[WEBSITE DOWN] {name} is UNREACHABLE -> {url}")
                    send_whatsapp(
                        f"[SecureFileGuard] Service DOWN!\n"
                        f"Service: {name}\nURL: {url}\nTime: {now_str()}"
                    )
                else:
                    log(f"[STILL DOWN] {name}")
                last_site_status[url] = False

        time.sleep(WEBSITE_CHECK_INTERVAL)

# ================= OS MONITOR =================

def monitor_os():
    # Silent routine sampling - only log on threshold breach
    while True:
        cpu  = psutil.cpu_percent(interval=2)
        mem  = psutil.virtual_memory().percent
        disk = psutil.disk_usage("/").percent

        alerts = []
        t = time.time()

        if cpu > CPU_THRESHOLD:
            if t - os_alert_cooldown.get("cpu", 0) > 300:
                alerts.append(f"CPU Usage: {cpu:.1f}% (limit {CPU_THRESHOLD}%)")
                os_alert_cooldown["cpu"] = t

        if mem > MEMORY_THRESHOLD:
            if t - os_alert_cooldown.get("mem", 0) > 300:
                alerts.append(f"RAM Usage: {mem:.1f}% (limit {MEMORY_THRESHOLD}%)")
                os_alert_cooldown["mem"] = t

        if disk > DISK_THRESHOLD:
            if t - os_alert_cooldown.get("disk", 0) > 300:
                alerts.append(f"Disk Usage: {disk:.1f}% (limit {DISK_THRESHOLD}%)")
                os_alert_cooldown["disk"] = t

        if alerts:
            body = "\n".join(alerts)
            log(f"[OS ALERT] {body}")
            log(f"[WHATSAPP] Sending OS alert...")
            send_whatsapp(
                f"[SecureFileGuard] OS Alert!\n{body}\nTime: {now_str()}"
            )

        time.sleep(OS_CHECK_INTERVAL)

# ================= MAIN =================

if __name__ == "__main__":

    print("=" * 55)
    print("   SecureFileGuard - FULL PROTECTION MODE")
    print("=" * 55)
    print(f"  Monitoring {len(MONITOR_PATHS)} folder(s):")
    for p in MONITOR_PATHS:
        print(f"   -> {p}")
    print(f"  Website checks : every {WEBSITE_CHECK_INTERVAL}s")
    print(f"  OS telemetry   : every {OS_CHECK_INTERVAL}s")
    print(f"  Quarantine     : {QUARANTINE_FOLDER}")
    print("=" * 55)
    print()

    if not MONITOR_PATHS:
        print("[ERROR] No monitored folders found!")
        sys.exit(1)

    # Start website monitor thread
    t_web = threading.Thread(target=monitor_websites, daemon=True, name="WebsiteMonitor")
    t_web.start()

    # Start OS monitor thread
    t_os = threading.Thread(target=monitor_os, daemon=True, name="OSMonitor")
    t_os.start()

    # Start filesystem watchdog
    observer = Observer()
    handler  = SecureHandler()

    for path in MONITOR_PATHS:
        log(f"[MONITORING] {path}")
        observer.schedule(handler, path, recursive=True)

    observer.start()
    log("[READY] SecureFileGuard is watching for threats...")

    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[STOPPING] SecureFileGuard shutting down...")
        observer.stop()

    observer.join()
    print("[STOPPED] Goodbye.")