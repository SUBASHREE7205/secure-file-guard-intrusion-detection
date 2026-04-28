import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Files from "./pages/Files";
import Login from "./pages/Login"; // Trigger HMR
import Reports from "./pages/Reports";
// import reports from "./pages/reports"; // REMOVE if not using

function PrivateRoute({ children }: any) {
  const auth = localStorage.getItem("auth");
  return auth ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={<PrivateRoute><Dashboard /></PrivateRoute>}
      />

      <Route
        path="/analytics"
        element={<PrivateRoute><Analytics /></PrivateRoute>}
      />

      <Route
        path="/files"
        element={<PrivateRoute><Files /></PrivateRoute>}
      />

      {/* ✅ REPORTS FIXED */}
      <Route
        path="/reports"
        element={<PrivateRoute><Reports /></PrivateRoute>}
      />

      <Route path="/" element={<Navigate to="/login" />} />

    </Routes>
  );
}

export default App;