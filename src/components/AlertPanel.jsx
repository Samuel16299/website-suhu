import { useState, useEffect } from "react";
import styles from "./AlertPanel.module.css";

function getAlerts(temperature, humidity) {
  const alerts = [];
  if (temperature >= 38) alerts.push({ type: "danger", msg: "Suhu sangat tinggi! Periksa area segera.", icon: "🚨" });
  else if (temperature >= 32) alerts.push({ type: "warning", msg: "Suhu di atas normal, pantau terus.", icon: "⚠️" });
  if (humidity > 85) alerts.push({ type: "warning", msg: "Kelembaban sangat tinggi (>85%).", icon: "💧" });
  if (humidity < 30) alerts.push({ type: "warning", msg: "Kelembaban sangat rendah (<30%).", icon: "🔆" });
  if (alerts.length === 0) alerts.push({ type: "ok", msg: "Semua parameter dalam batas normal.", icon: "✅" });
  return alerts;
}

export default function AlertPanel({ temperature, humidity, status }) {
  const alerts = getAlerts(temperature, humidity);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [temperature, humidity]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>Panel Peringatan</div>
        <div className={`${styles.statusBadge} ${styles[status.level]}`}>
          {status.label}
        </div>
      </div>

      <div className={styles.alerts}>
        {alerts.map((a, i) => (
          <div key={i} className={`${styles.alert} ${styles[a.type]} ${pulse ? styles.pulse : ""}`}>
            <span className={styles.alertIcon}>{a.icon}</span>
            <span className={styles.alertMsg}>{a.msg}</span>
          </div>
        ))}
      </div>

      {/* Threshold settings display */}
      <div className={styles.thresholds}>
        <div className={styles.threshTitle}>Batas Ambang</div>
        <div className={styles.threshRow}>
          <span>Suhu Aman</span>
          <span className={styles.threshVal} style={{ color: "var(--accent-green)" }}>20° – 32°C</span>
        </div>
        <div className={styles.threshRow}>
          <span>Kelembaban Aman</span>
          <span className={styles.threshVal} style={{ color: "var(--accent-blue)" }}>30% – 85%</span>
        </div>
      </div>
    </div>
  );
}
