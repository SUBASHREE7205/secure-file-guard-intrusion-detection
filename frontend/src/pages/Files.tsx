import "../components/Dashboard.css";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";

export default function Files() {

  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [threatFilter, setThreatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortType, setSortType] = useState("date");
  const [visibleCount, setVisibleCount] = useState(10);

  const API = "http://localhost:5000";

  const getValidDate = (t: any) => {
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  };

  const safeText = (v: any) => v || "N/A";

  const critical = ["exe","bat","cmd","vbs","js","ps1"];
  const high = ["zip","rar","7z","iso","dll","jar"];
  const medium = ["doc","docx","xls","xlsx","pdf"];
  const safe = ["txt","jpg","png","mp4","mp3","csv"];

  const getThreatLevel = (filename: string) => {
    const ext = filename?.split(".").pop()?.toLowerCase();

    if (!ext) return "unknown";
    if (critical.includes(ext)) return "critical";
    if (high.includes(ext)) return "high";
    if (medium.includes(ext)) return "medium";
    if (safe.includes(ext)) return "low";

    return "unknown";
  };

  const enforceStatus = (filename: string) => {
    const threat = getThreatLevel(filename);

    if (threat === "critical" || threat === "high") return "blocked";
    if (threat === "medium") return "quarantined";
    return "blocked";
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API}/api/files`);
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      console.log("Error fetching files");
      setFiles([]);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredFiles = files
    .map((file) => {
      const threat = getThreatLevel(file.filename);
      const status = enforceStatus(file.filename);

      return { ...file, threat, status };
    })
    .filter((file) => {
      const filename = safeText(file.filename).toLowerCase();
      const sender = safeText(file.sender).toLowerCase();

      const matchSearch =
        filename.includes(search.toLowerCase()) ||
        sender.includes(search.toLowerCase());

      const matchThreat =
        threatFilter === "All" ||
        file.threat === threatFilter.toLowerCase();

      const matchStatus =
        statusFilter === "All" ||
        file.status === statusFilter.toLowerCase();

      return matchSearch && matchThreat && matchStatus;
    })
    .sort((a, b) => {
      if (sortType === "name") {
        return safeText(a.filename).localeCompare(safeText(b.filename));
      }

      if (sortType === "date") {
        const da = getValidDate(a.timestamp);
        const db = getValidDate(b.timestamp);
        return (db?.getTime() || 0) - (da?.getTime() || 0);
      }

      return 0;
    });

  const getThreatClass = (level: string) => `threat ${level || "low"}`;
  const getStatusClass = (status: string) =>
    `status ${(status || "safe").toLowerCase()}`;

  return (
    <div className="dashboard">

      {/* ✅ FIXED SIDEBAR */}
      <Sidebar />

      <div className="main">

        <div className="header">📁 File Management</div>

        <div style={{ 
          background: "#fef2f2", 
          borderLeft: "4px solid #ef4444", 
          padding: "12px 16px", 
          borderRadius: "8px", 
          marginBottom: "20px",
          color: "#dc2626",
          fontWeight: "600",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>🔒 Secure Mode Enabled: All files are analyzed and blocked against potential threats.</span>
        </div>

        {/* SEARCH */}
        <div className="file-filters">

          <input
            placeholder="Search file or sender..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={threatFilter}
            onChange={(e) => setThreatFilter(e.target.value)}
          >
            <option value="All">All Threat Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="blocked">Blocked</option>
            <option value="quarantined">Quarantined</option>
          </select>

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>

        </div>

        {/* TABLE */}
        <table className="file-table">

          <thead>
            <tr>
              <th>File</th>
              <th>Sender</th>
              <th>Size</th>
              <th>Threat</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>

            {filteredFiles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center" }}>
                  No files found
                </td>
              </tr>
            ) : (
              filteredFiles.slice(0, visibleCount).map((file, index) => {
                const date = getValidDate(file.timestamp);

                return (
                  <tr key={index}>
                    <td>{safeText(file.filename)}</td>
                    <td>{safeText(file.sender)}</td>
                    <td>{safeText(file.size)}</td>

                    <td>
                      <span className={getThreatClass(file.threat)}>
                        {file.threat.toUpperCase()}
                      </span>
                    </td>

                    <td>
                      <span className={getStatusClass(file.status)}>
                        {file.status}
                      </span>
                    </td>

                    <td>
                      {file.threat === "critical" && "Executable blocked"}
                      {file.threat === "high" && "Compressed risk"}
                      {file.threat === "medium" && "Possible macro"}
                      {file.threat === "low" && "Secure mode block"}
                      {file.threat === "unknown" && "Unknown type"}
                    </td>

                    <td>
                      {date ? date.toLocaleString() : "Invalid Date"}
                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>

        {visibleCount < filteredFiles.length && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => setVisibleCount(visibleCount + 10)}
              style={{
                width: "auto",
                padding: "10px 24px",
                background: "#f1f5f9",
                color: "#334155",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "none"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
              onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
            >
              View More
            </button>
          </div>
        )}

      </div>
    </div>
  );
}