# 🛡️ SecureFileGuard — Enterprise Threat Detection System

A real-time intelligent file monitoring and threat detection platform with a web dashboard, AI-powered analysis, and WhatsApp alerts.

---

## 🚀 Quick Start

Double-click `start.bat` to launch everything at once:
- Flask Backend → http://127.0.0.1:5000
- React Dashboard → http://localhost:5173
- File Monitor (watchdog) — runs in background

---

## 🏗️ Architecture

```
d:\SecureFileGuard\
├── backend\
│   ├── app.py              ← Flask REST API (port 5000)
│   ├── monitor.py          ← Watchdog file system monitor
│   ├── alert_server.py     ← Optional TCP alert relay server
│   ├── extract_features.py ← Feature extractor for AI model
│   ├── xgb_model.pkl       ← Trained XGBoost ML model
│   ├── train_model.py      ← Model training script
│   └── data.json           ← Persistent file/alert/report store
│
├── frontend\securefileguard-frontend\
│   └── src\
│       ├── pages\
│       │   ├── Login.tsx       ← Auth (Google OAuth + manual)
│       │   ├── Dashboard.tsx   ← Overview cards + charts
│       │   ├── Analytics.tsx   ← Historical trends (daily/weekly/monthly/yearly)
│       │   ├── Files.tsx       ← File management table with filters
│       │   └── Reports.tsx     ← Audit log + PDF/CSV download
│       └── components\
│           ├── Sidebar.tsx     ← Navigation sidebar
│           └── Dashboard.css   ← All dashboard styles
│
├── start.bat      ← One-click startup (all services)
└── stop.bat       ← Kill all services
```

---

## 🔧 Configuration

### Backend — `app.py`
- **Port**: 5000 (change in last line)
- **Data**: Stored in `data.json` (auto-created)
- **Uploads**: `backend/uploads/` folder

### Monitor — `monitor.py`
- **Username**: Line 11 — change `USERNAME = "admin"` to your Windows username
- **Quarantine**: `C:\Users\{USERNAME}\SecureFileGuard_Quarantine\`
- **Monitored paths**: Downloads, Desktop, Documents (auto-detected)

### WhatsApp Alerts — `app.py` / `alert_server.py`
- Uses Twilio Sandbox API
- Configure `account_sid`, `auth_token`, `to` number in `app.py`

---

## 📡 REST API Endpoints

| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/api/health`           | Health check                         |
| GET    | `/api/stats`            | Full stats (total/safe/unsafe/etc.)  |
| GET    | `/api/threat-stats`     | Breakdown by critical/high/medium/low|
| GET    | `/api/files`            | All scanned files (newest first)     |
| GET    | `/api/alerts`           | Last 5 system alerts                 |
| GET    | `/api/reports`          | All audit report entries             |
| GET    | `/api/reports/download` | Download CSV report                  |
| POST   | `/api/upload`           | Upload & scan a file                 |
| POST   | `/api/external-alert`   | Trigger alert from monitor           |
| POST   | `/send-whatsapp`        | Send a WhatsApp message directly     |

---

## 🧠 Threat Classification

| Level    | Action      | Files                              |
|----------|-------------|-------------------------------------|
| Critical | Blocked     | AI-detected malware content         |
| High     | Blocked     | Dangerous extensions (.exe, .bat…) |
| Medium   | Quarantined | Documents (.doc, .pdf, .xlsx…)     |
| Low/Safe | Allowed     | AI-verified clean content           |

---

## 🖥️ Dashboard Pages

| Page       | Features                                                       |
|------------|----------------------------------------------------------------|
| Dashboard  | Live stats, threat pie chart, file upload scanner, alerts feed |
| Analytics  | Daily/Weekly/Monthly/Yearly threat trends + file type pie      |
| Files      | Full table, search, filter by threat/status, sort by date/name |
| Reports    | Audit log, PDF/CSV export, threat/status filters               |

---

## 🔐 Authentication
- **Google OAuth** via Firebase — production ready
- **Manual login** — any username/password works (for demo)
- Protected routes redirect unauthenticated users to /login

---

## 📦 Requirements

**Backend** (install once):
```bash
cd backend
pip install flask flask-cors watchdog plyer twilio joblib xgboost scikit-learn requests
```

**Frontend** (install once):
```bash
cd frontend\securefileguard-frontend
npm install
```

---

## 📲 WhatsApp Alert Format
```
🚨 SecureFileGuard Alert
File: malware.exe
Path: C:\Users\admin\Downloads\malware.exe
Threat: CRITICAL
Action: QUARANTINED
Time: 2026-04-19 22:53:23
```

---

*SecureFileGuard v2.4.1 Enterprise Core*
