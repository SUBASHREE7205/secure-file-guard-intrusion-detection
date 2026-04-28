import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "../components/Dashboard.css";
import { FaFileAlt, FaDownload, FaFilePdf, FaSearch } from "react-icons/fa";

export default function Reports() {

  const [reports, setReports] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [threatFilter, setThreatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const API = "http://127.0.0.1:5000";

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API}/api/reports`);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Error fetching reports");
      setReports([]);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredReports = reports.filter(r => {
    const matchSearch =
      (r.file || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.threat || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.status || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchThreat =
      threatFilter === "All" ||
      (r.threat || "").toLowerCase() === threatFilter.toLowerCase();

    const matchStatus =
      statusFilter === "All" ||
      (r.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchThreat && matchStatus;
  });

  // ── Summary stats
  const totalReports   = filteredReports.length;
  const criticalCount  = filteredReports.filter(r => (r.threat || "").toLowerCase() === "critical").length;
  const blockedCount   = filteredReports.filter(r => (r.status || "").toLowerCase() === "blocked").length;
  // Count safe as low/medium threat since legacy data has status=blocked for all
  const safeCount      = filteredReports.filter(r => ["low", "safe"].includes((r.threat || "").toLowerCase())).length;

  const getThreatColor = (threat: string) => {
    switch ((threat || "").toLowerCase()) {
      case "critical": return { color: "#dc2626", background: "#fef2f2" };
      case "high":     return { color: "#ea580c", background: "#fff7ed" };
      case "medium":   return { color: "#ca8a04", background: "#fefce8" };
      default:         return { color: "#059669", background: "#ecfdf5" };
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "blocked":     return { color: "#dc2626", background: "#fef2f2" };
      case "quarantined": return { color: "#d97706", background: "#fffbeb" };
      case "safe":        return { color: "#059669", background: "#ecfdf5" };
      default:            return { color: "#64748b", background: "#f1f5f9" };
    }
  };

  // ── PDF Download via browser print
  const handlePrint = () => {
    const rows = filteredReports.map(r => `
      <tr>
        <td>${r.file || "N/A"}</td>
        <td style="color:${getThreatColor(r.threat).color};font-weight:700">${(r.threat || "").toUpperCase()}</td>
        <td>${r.status || "N/A"}</td>
        <td>${r.time || "N/A"}</td>
      </tr>
    `).join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head>
        <title>SecureFileGuard – Threat Report</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #0f172a; }
          h1 { color: #10b981; margin-bottom: 4px; font-size: 24px; }
          p  { color: #64748b; font-size: 13px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #10b981; color: white; padding: 10px 12px; text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:last-child td { border-bottom: none; }
        </style>
      </head><body>
        <h1>🛡 SecureFileGuard — Threat Report</h1>
        <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total Records: ${filteredReports.length}</p>
        <table>
          <thead><tr><th>File</th><th>Threat</th><th>Status</th><th>Time</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main">

        {/* ── Header */}
        <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaFileAlt />
            <span>Reports &amp; Audit Log</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handlePrint}
              style={{ width: "auto", padding: "8px 18px", background: "#ffffff", color: "#dc2626", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FaFilePdf /> PDF Report
            </button>
            <button
              onClick={() => window.open(`${API}/api/reports/download`)}
              style={{ width: "auto", padding: "8px 18px", background: "#ffffff", color: "#10b981", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FaDownload /> CSV Export
            </button>
          </div>
        </div>

        {/* ── Summary bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
          {[
            { label: "Total Reports",   value: totalReports, color: "#0284c7", border: "#38bdf8" },
            { label: "Critical Threats", value: criticalCount, color: "#dc2626", border: "#ef4444" },
            { label: "Files Blocked",    value: blockedCount,  color: "#d97706", border: "#f59e0b" },
            { label: "Low Risk Files",   value: safeCount,     color: "#059669", border: "#10b981" },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", borderRadius: "10px", padding: "14px 18px", borderLeft: `4px solid ${c.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: `1px solid #e2e8f0`, borderLeftWidth: "4px", borderLeftColor: c.border }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{c.label}</p>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "800", color: c.color }}>{c.value}</h2>
            </div>
          ))}
        </div>

        {/* ── Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "16px", background: "#fff", padding: "14px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ position: "relative" }}>
            <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "13px" }} />
            <input
              type="text"
              placeholder="Search files, threats, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "34px", margin: 0, width: "100%", padding: "10px 14px 10px 34px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
              onFocus={(e) => e.target.style.borderColor = "#10b981"}
              onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
            />
          </div>
          <select value={threatFilter} onChange={(e) => setThreatFilter(e.target.value)} style={{ margin: 0, padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
            <option value="All">All Threats</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ margin: 0, padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}>
            <option value="All">All Status</option>
            <option value="blocked">Blocked</option>
            <option value="quarantined">Quarantined</option>
            <option value="safe">Safe</option>
          </select>
        </div>

        {/* ── Table */}
        <table className="file-table">
          <thead>
            <tr>
              <th>#</th>
              <th>File</th>
              <th>Threat Level</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: "15px" }}>
                  {searchQuery || threatFilter !== "All" || statusFilter !== "All"
                    ? "🔍 No matches found for your filters."
                    : "📭 No reports yet. Upload or monitor files to begin."}
                </td>
              </tr>
            ) : (
              filteredReports.slice(0, visibleCount).map((r, i) => {
                const tc = getThreatColor(r.threat);
                const sc = getStatusColor(r.status);
                return (
                  <tr key={i}>
                    <td style={{ color: "#94a3b8", fontWeight: "600", fontSize: "12px" }}>{i + 1}</td>
                    <td style={{ fontWeight: "600", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.file || "N/A"}</td>
                    <td>
                      <span style={{ ...tc, padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.04em" }}>
                        {(r.threat || "unknown").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span style={{ ...sc, padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.04em" }}>
                        {(r.status || "unknown").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "12px" }}>{r.time || "N/A"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── Pagination */}
        {visibleCount < filteredReports.length && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => setVisibleCount(v => v + 15)}
              style={{ width: "auto", padding: "10px 28px", background: "#f1f5f9", color: "#334155", borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "600", cursor: "pointer", boxShadow: "none" }}
              onMouseOver={e => (e.currentTarget.style.background = "#e2e8f0")}
              onMouseOut={e => (e.currentTarget.style.background = "#f1f5f9")}
            >
              Load More ({filteredReports.length - visibleCount} remaining)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}