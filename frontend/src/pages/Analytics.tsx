import "../components/Dashboard.css";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { FaChartArea, FaCalendarAlt } from "react-icons/fa";
import CountUp from "react-countup";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Analytics() {
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, safe: 0, unsafe: 0, blocked: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchFiles = async () => {
    try {
      const [filesRes, statsRes] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/files"),
        fetch("http://127.0.0.1:5000/api/stats")
      ]);
      const filesData = await filesRes.json();
      const statsData = await statsRes.json();
      setFiles(filesData);
      setStats(statsData);
      setInitialLoad(false);
    } catch {
      console.log("Backend error");
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 4000);
    return () => clearInterval(interval);
  }, []);

  const getValidDate = (t: any) => {
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  };

  const isThreat = (f: any) =>
    f.threat_level === "high" || f.threat_level === "critical";

  /* ================= DATA ================= */
  // Use a predictable noon-time date boundary to avoid timezone shifting issues
  const baseDate = new Date(`${selectedDateStr}T12:00:00`);

  const last7Days: any = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate.getTime());
    d.setDate(d.getDate() - i);
    last7Days[d.toISOString().slice(5, 10)] = 0;
  }

  files.forEach(f => {
    const d = getValidDate(f.timestamp);
    if (!d) return;

    const key = d.toISOString().slice(5, 10);
    if (last7Days[key] !== undefined && isThreat(f)) {
      last7Days[key]++;
    }
  });

  const dailyData = Object.keys(last7Days).map(k => ({
    day: k,
    threats: last7Days[k]
  }));

  // Weekly mapping relative to the base date
  const currentWeekStart = new Date(baseDate.getTime());
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);
  currentWeekStart.setHours(0,0,0,0);
  
  const currentWeekEnd = new Date(baseDate.getTime());
  currentWeekEnd.setHours(23,59,59,999);

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weeklyMap: any = {Sun:0,Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0};

  files.forEach(f => {
    const d = getValidDate(f.timestamp);
    if (!d) return;
    if (d >= currentWeekStart && d <= currentWeekEnd) {
      const day = days[d.getDay()];
      if (isThreat(f)) weeklyMap[day]++;
    }
  });

  const weeklyData = days.map(d => ({
    day: d,
    threats: weeklyMap[d]
  }));

  const monthlyMap: any = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(baseDate.getTime());
    d.setMonth(d.getMonth() - i);
    const m = d.toLocaleString("default", { month: "short" });
    const y = d.getFullYear().toString().slice(-2);
    monthlyMap[`${m} '${y}`] = 0;
  }

  files.forEach(f => {
    const d = getValidDate(f.timestamp);
    if (!d) return;
    const m = d.toLocaleString("default", { month: "short" });
    const y = d.getFullYear().toString().slice(-2);
    const key = `${m} '${y}`;
    if (monthlyMap[key] !== undefined && isThreat(f)) {
      monthlyMap[key]++;
    }
  });

  const monthlyData = Object.keys(monthlyMap).map(k => ({
    month: k,
    threats: monthlyMap[k]
  }));

  const yearlyMap: any = {};
  for (let i = 4; i >= 0; i--) {
    yearlyMap[baseDate.getFullYear() - i] = 0;
  }

  files.forEach(f => {
    const d = getValidDate(f.timestamp);
    if (!d) return;
    const y = d.getFullYear();
    if (yearlyMap[y] !== undefined && isThreat(f)) {
      yearlyMap[y]++;
    }
  });

  const yearlyData = Object.keys(yearlyMap).map(y => ({
    year: y,
    threats: yearlyMap[y]
  }));

  const typeMap: any = {};
  files.forEach(f => {
    const ext = f.filename?.split(".").pop() || "unknown";
    if (!isThreat(f)) return;
    typeMap[ext] = (typeMap[ext] || 0) + 1;
  });

  const colors = ["#ef4444","#f97316","#facc15","#38bdf8","#22c55e"];

  const fileTypeData = Object.keys(typeMap).map((ext, i) => ({
    name: `.${ext}`,
    value: typeMap[ext],
    color: colors[i % colors.length]
  }));

  /* ================= UI ================= */

  return (
    <div className="dashboard">

      {/* ✅ SAME SIDEBAR */}
      <Sidebar />

      <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* TOP NAV/HEADER */}
        <div className="top-navbar" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#10b981", border: "none", boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <FaChartArea /> Security Analytics
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "13px", fontWeight: "500", margin: 0 }}>
              Comprehensive historical threat intelligence
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
               onClick={() => {
                 let csvContent = "data:text/csv;charset=utf-8,Filename,Threat Level,Timestamp\n";
                 files.forEach(f => {
                   csvContent += `${f.filename || 'unknown'},${f.threat_level || 'Safe'},${f.timestamp || 'N/A'}\n`;
                 });
                 const encodedUri = encodeURI(csvContent);
                 const link = document.createElement("a");
                 link.setAttribute("href", encodedUri);
                 link.setAttribute("download", `Threat_Report_${selectedDateStr}.csv`);
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
               }}
               style={{
                 background: "#ffffff",
                 color: "#10b981",
                 border: "none",
                 padding: "10px 16px",
                 borderRadius: "12px",
                 fontWeight: "800",
                 fontSize: "13px",
                 cursor: "pointer",
                 boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                 display: "flex",
                 alignItems: "center",
                 gap: "8px",
                 transition: "transform 0.2s"
               }}
               onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
               onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
               <span>📥 Export CSV</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(15, 23, 42, 0.4)", padding: "10px 14px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.15)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }}>
               <div className="pulse-dot" style={{ width: "8px", height: "8px", backgroundColor: "#34d399", borderRadius: "50%" }}></div>
               <span style={{ color: "#ffffff", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Live Sync</span>
            </div>
            
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "rgba(0, 0, 0, 0.25)", padding: "10px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.2)", backdropFilter: "blur(10px)", transition: "all 0.3s ease", cursor: "pointer", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)" }}>
              <FaCalendarAlt style={{ color: "#ffffff", fontSize: "16px", marginTop: "-1px" }} />
            <input 
              type="date" 
              className="modern-date-input"
              title="Time Machine Filter"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontWeight: "700",
                fontFamily: "'Inter', sans-serif",
                fontSize: "15px",
                cursor: "pointer",
                padding: 0,
                margin: 0,
                width: "115px",
                position: "relative",
                zIndex: 2,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                lineHeight: "normal",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
              }}
            />
          </div>
          </div>
        </div>

        {/* CARDS */}
        <div className="cards">
          <div className="card blue">
            <div className="card-top"><h4>Total Files</h4></div>
            {initialLoad ? <div className="skeleton-text"></div> : <h2><CountUp end={stats.total || files.length} duration={2.5} separator="," /></h2>}
          </div>
          <div className="card red">
            <div className="card-top"><h4>Critical + High</h4></div>
            {initialLoad ? <div className="skeleton-text"></div> : <h2><CountUp end={(stats.critical || 0) + (stats.high || 0)} duration={2.5} separator="," /></h2>}
          </div>
          <div className="card yellow">
            <div className="card-top"><h4>Quarantined</h4></div>
            {initialLoad ? <div className="skeleton-text"></div> : <h2><CountUp end={stats.quarantined || 0} duration={2.5} separator="," /></h2>}
          </div>
          <div className="card cyan">
            <div className="card-top"><h4>Safe Files</h4></div>
            {initialLoad ? <div className="skeleton-text"></div> : <h2><CountUp end={stats.safe || 0} duration={2.5} separator="," /></h2>}
          </div>
        </div>

        {/* TIMELINE ANALYSIS 2x2 GRID */}
        <div className="middle">

          <div className="panel">
            <h3>Daily Threats</h3>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                  <Line dataKey="threats" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <h3>Weekly Trend</h3>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="threats" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <h3>Monthly Trend</h3>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="threats" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <h3>Yearly Analysis</h3>
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData}>
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="threats" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* PIE SECTION */}
        <div className="middle">
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h3>Threat File Types</h3>
            <div style={{ width: '100%', height: '220px', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fileTypeData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                    {fileTypeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: '600' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}