import styles from "./DeviceStatus.module.css";

function InfoRow({ label, value, mono, accent }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={`${styles.rowValue} ${mono ? styles.mono : ""}`}
        style={accent ? { color: accent } : {}}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function DeviceStatus({ ip, uptime, rssi, lastUpdate, source }) {
  const signalLabel = rssi === null ? "—"
    : rssi > -55 ? "Sangat Baik"
      : rssi > -65 ? "Baik"
        : rssi > -75 ? "Lemah" : "Buruk";
  const signalColor = rssi === null ? "var(--text-muted)"
    : rssi > -55 ? "var(--accent-green)"
      : rssi > -65 ? "var(--accent-yellow)" : "var(--accent-red)";

  const formatTime = (d) =>
    d ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>Info Perangkat</div>
        <div className={styles.chip}>ESP32</div>
      </div>
      <div className={styles.deviceIcon}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="14" width="32" height="22" rx="3" stroke="var(--accent-cyan)" strokeWidth="1.5" fill="rgba(0,229,255,0.05)" />
          <rect x="12" y="18" width="24" height="14" rx="2" fill="rgba(0,229,255,0.08)" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={13 + i * 4.5} y={12} width="1.5" height="3" rx="0.5" fill="rgba(0,229,255,0.4)" />
          ))}
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={13 + i * 4.5} y={35} width="1.5" height="3" rx="0.5" fill="rgba(0,229,255,0.4)" />
          ))}
          <rect x="19" y="22" width="10" height="6" rx="1" fill="rgba(0,229,255,0.2)" stroke="var(--accent-cyan)" strokeWidth="0.8" />
          <circle cx="36" cy="20" r="2" fill="var(--accent-green)" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div className={styles.rows}>
        <InfoRow label="Sumber" value={source ?? "ESP32"} />
        <InfoRow label="IP Address" value={ip} mono />
        <InfoRow label="Uptime" value={uptime} mono accent="var(--accent-cyan)" />
        <InfoRow label="Sinyal Wi-Fi" value={signalLabel} accent={signalColor} />
        <InfoRow label="RSSI" value={rssi !== null ? `${rssi} dBm` : null} mono />
        <InfoRow label="Update Terakhir" value={formatTime(lastUpdate)} mono />
        <InfoRow label="Protokol" value="MQTT over WebSocket" />
        <InfoRow label="Broker" value="broker.hivemq.com" mono />
        <InfoRow label="Sensor" value="DHT11" />
      </div>
    </div>
  );
}
