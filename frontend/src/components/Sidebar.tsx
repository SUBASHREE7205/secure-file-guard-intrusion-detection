import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  FaChartPie,
  FaChartLine,
  FaFolder,
  FaBars,
  FaFileAlt
} from "react-icons/fa";
import "../components/Dashboard.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={collapsed ? "sidebar collapsed" : "sidebar"}>

      {/* TOP */}
      <div className="top">
        <FaBars
          className="toggle"
          onClick={() => setCollapsed(!collapsed)}
        />

        <h2 className="logo">
          {collapsed ? "🛡" : "FileGuard 🛡"}
        </h2>
      </div>

      {/* STATUS */}
      <p className="sidebar-status">System Active</p>

      {/* MENU */}
      <ul>

        <li>
          <NavLink to="/dashboard" className="nav-item">
            {({ isActive }) => (
              <>
                <FaChartPie className={`icon ${isActive ? "active-icon" : ""}`} />
                {!collapsed && (
                  <span className={isActive ? "active-text" : ""}>
                    Dashboard
                  </span>
                )}
              </>
            )}
          </NavLink>
        </li>

        <li>
          <NavLink to="/analytics" className="nav-item">
            {({ isActive }) => (
              <>
                <FaChartLine className={`icon ${isActive ? "active-icon" : ""}`} />
                {!collapsed && (
                  <span className={isActive ? "active-text" : ""}>
                    Analytics
                  </span>
                )}
              </>
            )}
          </NavLink>
        </li>

        <li>
          <NavLink to="/files" className="nav-item">
            {({ isActive }) => (
              <>
                <FaFolder className={`icon ${isActive ? "active-icon" : ""}`} />
                {!collapsed && (
                  <span className={isActive ? "active-text" : ""}>
                    Files
                  </span>
                )}
              </>
            )}
          </NavLink>
        </li>

        <li>
          <NavLink to="/reports" className="nav-item">
            {({ isActive }) => (
              <>
                <FaFileAlt className={`icon ${isActive ? "active-icon" : ""}`} />
                {!collapsed && (
                  <span className={isActive ? "active-text" : ""}>
                    Reports
                  </span>
                )}
              </>
            )}
          </NavLink>
        </li>

      </ul>

      {/* FOOTER WIDGET */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="footer-widget">
            <div className="widget-header">
              <span className="widget-title">Secure Storage</span>
              <span className="widget-value">72%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill"></div>
            </div>
            <p className="widget-desc">28.4 GB used of 40 GB</p>
          </div>
          <p className="system-version">v2.4.1 Enterprise Core</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;