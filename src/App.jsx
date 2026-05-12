import { useState } from "react";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={darkMode ? "dark" : "light"}>
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: "fixed",
          bottom: "5px",
          right: "190px",
          zIndex: 999,
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "3px solid white",
          background: darkMode ? "#facc15" : "#1e293b",
          color: darkMode ? "#000" : "#fff",
          fontSize: "28px",
          cursor: "pointer",
          transition: "all 0.4s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(0,0,0,0.4)",
        }}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <Dashboard isDark={darkMode} />
    </div>
  );
}

export default App;