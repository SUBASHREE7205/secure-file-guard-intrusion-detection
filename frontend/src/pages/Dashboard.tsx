import "../components/Dashboard.css";
import Sidebar from "../components/Sidebar";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaShieldAlt, FaExclamationTriangle, FaBug, FaBell, FaCloudUploadAlt, FaUserCircle } from "react-icons/fa";
import CountUp from "react-countup";

/* ================= TYPES ================= */

type Stats = {
  total: number;
  safe: number;
  unsafe: number;
  blocked: number;
  quarantined: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

type Alert = {
  message: string;
  time: string;
};

export default function Dashboard() {
  const API = "http://127.0.0.1:5000";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [senderEmail, setSenderEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Stats>({
    total: 0,
    safe: 0,
    unsafe: 0,
    blocked: 0,
    quarantined: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  const [chartData, setChartData] = useState<
    { name: string; value: number }[]
  >([]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [userName, setUserName] = useState("Admin User");
  const [userEmail, setUserEmail] = useState("admin@securefileguard.local");
  const [lastLogin, setLastLogin] = useState("Just now");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || "Admin User");
        setUserEmail(user.email || "admin@securefileguard.local");
        
        if (user.metadata && user.metadata.lastSignInTime) {
          const date = new Date(user.metadata.lastSignInTime);
          setLastLogin(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + date.toLocaleDateString());
        }
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ================= FETCH DATA ================= */

  const fetchData = async () => {
    try {
      // Use richer /api/stats endpoint
      const statsRes = await fetch(`${API}/api/stats`);
      const statsData: Stats = await statsRes.json();
      setStats(statsData);

      // Chart uses threat-level breakdown for pie
      setChartData([
        { name: "Critical", value: statsData.critical },
        { name: "High", value: statsData.high },
        { name: "Medium", value: statsData.medium },
        { name: "Low / Safe", value: statsData.low }
      ]);

      const alertsRes = await fetch(`${API}/api/alerts`);
      const alertsData: Alert[] = await alertsRes.json();

      setAlerts(alertsData);
      setInitialLoad(false);
    } catch (err) {
      console.error("Backend not reachable", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  /* ================= FILE ================= */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Select a file first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sender", senderEmail);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      if (data.threat_level?.toLowerCase() === "critical") {
        toast.error(`🚨 Critical Threat: ${data.reason}`);
      } else if (data.threat_level?.toLowerCase() === "high") {
        toast.warning(`⚠ High Risk: ${data.reason}`);
      } else {
        toast.info(`✅ Safe File`);
      }

      setSelectedFile(null);
      setSenderEmail("");
      fetchData();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= COLORS ================= */

  const COLORS = ["#dc2626", "#d97706", "#059669", "#0284c7"];

  /* ================= UI ================= */

  return (
    <div className="dashboard dashboard-locked">

      {/* ✅ USE SAME SIDEBAR */}
      <Sidebar />

      <div className="main">

        <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>System Overview</h1>
            <p style={{ margin: 0 }}>Real-time threat analysis and intercept telemetry</p>
          </div>

          <div className="user-controls" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(16, 185, 129, 0.1)", padding: "6px 14px", borderRadius: "20px", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
               <div className="pulse-dot" style={{ width: "8px", height: "8px", backgroundColor: "#10b981", borderRadius: "50%" }}></div>
               <span style={{ color: "#10b981", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Live Protection</span>
            </div>
            <div className="notification-bell" style={{ color: "rgba(255,255,255,0.9)", margin: 0 }}>
              <FaBell />
              <span className="badge"></span>
            </div>
            <div 
              ref={profileRef}
              className="user-profile" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ 
                position: 'relative', 
                cursor: 'pointer', 
                background: '#10b981', 
                padding: '8px 16px',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
              }}
            >
              <FaUserCircle className="avatar-icon" style={{ color: "#ffffff", fontSize: '20px' }} />
              <span style={{ color: "#ffffff", fontWeight: '800', letterSpacing: '0.05em' }}>{userName}</span>

              {showProfileMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "12px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  padding: "20px",
                  width: "280px",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  cursor: "default",
                  color: "#0f172a"
                }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "8px" }}>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{userName}</p>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b", fontWeight: "500", marginTop: "6px", wordBreak: "break-all" }}>{userEmail}</p>
                    <div style={{ marginTop: "12px", padding: "6px 10px", background: "#f0fdf4", display: "inline-block", borderRadius: "6px", color: "#10b981", fontSize: "12px", fontWeight: "800", letterSpacing: "0.05em", textTransform: "uppercase" }}>Administrator</div>
                  </div>

                  <div style={{ marginBottom: "12px", padding: "0 6px" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b' }}>Last Login</span>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{lastLogin}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>Auto Logout</span>
                      <span style={{ fontWeight: '700', color: '#10b981' }}>In 2 Hours</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                        localStorage.removeItem("auth");
                        auth.signOut();
                        window.location.href = "/";
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "15px",
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#fee2e2"}
                    onMouseOut={(e) => e.currentTarget.style.background = "#fef2f2"}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div className="cards">

          <div className="card blue">
            <div className="card-top">
              <h4>Total Scanned</h4>
              <div className="icon-wrapper blue-icon"><FaShieldAlt /></div>
            </div>
            {initialLoad ? <div className="skeleton-text"></div> : <h2><CountUp end={stats.total} duration={2.5} separator="," /></h2>}
          </div>

          <div className="card cyan">
            <div className="card-top">
              <h4>Safe Files</h4>
              <div className="icon-wrapper cyan-icon"><FaShieldAlt /></div>
            </div>
            {initialLoad ? <div className="skeleton-text"></div> : <h2><CountUp end={stats.safe} duration={2.5} separator="," /></h2>}
          </div>

          <div className="card red">
            <div className="card-top">
              <h4>Threats</h4>
              <div className="icon-wrapper red-icon"><FaBug /></div>
            </div>
            {initialLoad ? <div className="skeleton-text"></div> : <h2><CountUp end={stats.unsafe} duration={2.5} separator="," /></h2>}
          </div>

          <div className="card yellow">
            <div className="card-top">
              <h4>Blocked</h4>
              <div className="icon-wrapper yellow-icon"><FaExclamationTriangle /></div>
            </div>
            {initialLoad ? <div className="skeleton-text"></div> : <h2><CountUp end={stats.blocked} duration={2.5} separator="," /></h2>}
          </div>

        </div>

        {/* MIDDLE */}
        <div className="middle">

          {/* CHART */}
          <div className="panel">
            <h3>Threat Distribution</h3>

            <div style={{ width: "100%", height: "280px", minHeight: "280px" }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={5}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* UPLOAD */}
          <div className="panel upload-panel">
            <h3><FaCloudUploadAlt style={{ color: '#10b981', fontSize: '1.4rem' }} /> Simulate Incoming File</h3>

            <div className="upload-zone">
              <input
                placeholder="Sender Email Address"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="modern-input"
              />

              <div className="file-input-wrapper">
                <FaCloudUploadAlt className="upload-icon-large" />
                <p>Click to browse or drag and drop</p>
                <input type="file" onChange={handleFileChange} className="hidden-file-input" />
                {selectedFile && <span className="selected-filename">{selectedFile.name}</span>}
              </div>

              <button onClick={handleUpload} disabled={loading} className="modern-button">
                {loading ? "Scanning..." : "Secure Upload & Scan"}
              </button>
            </div>

            <div className="alerts-section">
              <h4>Recent System Alerts</h4>
              <div className="alerts-container">
                {alerts.length === 0 ? (
                  <p className="no-alerts">Everything is secure. No recent threats.</p>
                ) : (
                  alerts.map((alert, index) => (
                    <div key={index} className="alert-item">
                      <div className="alert-indicator"></div>
                      <div className="alert-content">
                        <strong>{alert.message}</strong>
                        <span className="alert-time">{alert.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}