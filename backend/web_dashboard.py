from flask import Flask, render_template_string, request, redirect, url_for, send_file
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user
import sqlite3
import csv
import io
import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

app = Flask(__name__)
app.secret_key = "supersecretkey"

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

DATABASE = "alerts.db"


# ========================
# DATABASE SETUP
# ========================
def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            message TEXT,
            severity TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()


# ========================
# LOGIN SYSTEM
# ========================
class User(UserMixin):
    id = 1

@login_manager.user_loader
def load_user(user_id):
    return User()

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        if request.form["username"] == "admin" and request.form["password"] == "admin123":
            login_user(User())
            return redirect(url_for("dashboard"))

    return render_template_string("""
    <style>
    body {
        background: #0f172a;
        color: white;
        font-family: 'Segoe UI';
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }
    .login-box {
        background: #1e293b;
        padding: 40px;
        border-radius: 10px;
        width: 300px;
        text-align: center;
    }
    input {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border-radius: 6px;
        border: none;
    }
    button {
        width: 100%;
        padding: 10px;
        background: #00ff99;
        border: none;
        border-radius: 6px;
        font-weight: bold;
    }
    </style>

    <div class="login-box">
        <h2>🛡 SecureFileGuard Login</h2>
        <form method="post">
            <input name="username" placeholder="Username">
            <input type="password" name="password" placeholder="Password">
            <button type="submit">Login</button>
        </form>
    </div>
    """)


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


# ========================
# DASHBOARD
# ========================
@app.route("/")
@login_required
def dashboard():
    search = request.args.get("search", "")

    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    if search:
        c.execute("SELECT * FROM alerts WHERE message LIKE ? ORDER BY id DESC", ('%' + search + '%',))
    else:
        c.execute("SELECT * FROM alerts ORDER BY id DESC")

    rows = c.fetchall()

    # Stats
    c.execute("SELECT severity, COUNT(*) FROM alerts GROUP BY severity")
    stats_data = dict(c.fetchall())
    conn.close()

    total = sum(stats_data.values())
    high = stats_data.get("high", 0)
    medium = stats_data.get("medium", 0)
    low = stats_data.get("low", 0)

    return render_template_string("""
<!DOCTYPE html>
<html>
<head>
<title>SecureFileGuard SOC</title>
<style>
body { margin:0; font-family:'Segoe UI'; background:#0f172a; color:#e5e7eb; }
.navbar { background:#111827; padding:15px 30px; display:flex; justify-content:space-between; }
.navbar h1 { color:#00ff99; margin:0; }
.btn { background:#1f2937; color:white; padding:8px 12px; border-radius:6px; text-decoration:none; margin-left:8px; }
.btn:hover { background:#00ff99; color:black; }

.container { padding:30px; }

.stats { display:flex; gap:20px; margin-bottom:30px; }
.stat-card {
    flex:1;
    background:#1e293b;
    padding:20px;
    border-radius:10px;
    text-align:center;
}
.stat-card h2 { margin:0; font-size:28px; }

.search-box input { padding:8px; border-radius:6px; border:none; width:250px; }

.card { background:#1e293b; padding:20px; border-radius:10px; margin-bottom:20px; }

.alert { background:#111827; padding:15px; border-radius:8px; margin-bottom:10px; }

.badge-high { color:red; font-weight:bold; }
.badge-medium { color:orange; font-weight:bold; }
.badge-low { color:#00ff99; font-weight:bold; }

img { max-width:500px; border-radius:10px; box-shadow:0 0 15px rgba(0,255,153,0.3); }
</style>
</head>

<body>

<div class="navbar">
    <h1>🛡 SecureFileGuard SOC Dashboard</h1>
    <div>
        <a href="/logout" class="btn">Logout</a>
        <a href="/clear" class="btn">Clear</a>
        <a href="/export" class="btn">Export CSV</a>
    </div>
</div>

<div class="container">

<div class="stats">
    <div class="stat-card"><h2>{{total}}</h2>Total Alerts</div>
    <div class="stat-card"><h2 style="color:red">{{high}}</h2>High</div>
    <div class="stat-card"><h2 style="color:orange">{{medium}}</h2>Medium</div>
    <div class="stat-card"><h2 style="color:#00ff99">{{low}}</h2>Low</div>
</div>

<div class="card">
<form method="get" class="search-box">
    <input name="search" placeholder="Search alerts..." value="{{search}}">
    <button class="btn" type="submit">Search</button>
</form>
</div>

<div class="card" style="text-align:center;">
<h3>📊 Alert Severity Distribution</h3>
<img src="/chart">
</div>

<div class="card">
<h3>🚨 Recent Alerts</h3>
{% for row in rows %}
    <div class="alert">
        <b>{{row[1]}}</b><br>
        {{row[2]}}<br>
        Severity:
        {% if row[3]=='high' %}
            <span class="badge-high">HIGH</span>
        {% elif row[3]=='medium' %}
            <span class="badge-medium">MEDIUM</span>
        {% else %}
            <span class="badge-low">LOW</span>
        {% endif %}
    </div>
{% endfor %}
</div>

</div>
</body>
</html>
""", rows=rows, search=search, total=total, high=high, medium=medium, low=low)


# ========================
# CHART
# ========================
@app.route("/chart")
@login_required
def chart():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT severity, COUNT(*) FROM alerts GROUP BY severity")
    data = c.fetchall()
    conn.close()

    labels = [row[0] for row in data]
    counts = [row[1] for row in data]

    plt.figure()
    plt.bar(labels, counts)
    plt.title("Alert Severity Distribution")
    plt.xlabel("Severity")
    plt.ylabel("Count")

    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()

    return send_file(img, mimetype='image/png')


# ========================
# CLEAR ALERTS
# ========================
@app.route("/clear")
@login_required
def clear_alerts():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("DELETE FROM alerts")
    conn.commit()
    conn.close()
    return redirect(url_for("dashboard"))


# ========================
# EXPORT CSV
# ========================
@app.route("/export")
@login_required
def export_csv():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute("SELECT * FROM alerts")
    rows = c.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "Message", "Severity"])
    writer.writerows(rows)

    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="alerts.csv"
    )


# ========================
# API FOR ALERT SERVER
# ========================
@app.route("/add_alert", methods=["POST"])
def add_alert():
    message = request.form["message"]

    severity = "low"
    if "malicious" in message.lower():
        severity = "high"
    elif "error" in message.lower():
        severity = "medium"

    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO alerts (timestamp, message, severity) VALUES (?, ?, ?)",
        (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), message, severity)
    )
    conn.commit()
    conn.close()

    return "OK"


if __name__ == "__main__":
    app.run(port=8000)
