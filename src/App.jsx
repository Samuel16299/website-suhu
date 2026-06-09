import { useState } from "react";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={darkMode ? "dark" : "light"}>
      <button
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 999,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          border: "1px solid var(--border-hover)",
          background: "var(--bg-card)",
          color: "var(--text-secondary)",
          fontSize: "18px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        }}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <Dashboard isDark={darkMode} />
    </div>
  );
}

export default App;