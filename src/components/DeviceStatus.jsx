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

export default function DeviceStatus({ ip, uptime, rssi, lastUpdate }) {
  const signalLabel = rssi === null ? "—"
    : rssi > -55 ? "Sangat Baik"
      : rssi > -65 ? "Baik"
        : rssi > -75 ? "Lemah" : "Buruk";
  const signalColor = rssi === null ? "var(--text-muted)"
    : rssi > -55 ? "var(--green)"
      : rssi > -65 ? "var(--orange)" : "var(--red)";

  const formatTime = (d) =>
    d ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>Info Perangkat</div>
        <div className={styles.chip}>ESP32</div>
      </div>

      {/* Simplified device icon */}
      <div className={styles.deviceIcon}>
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="14" width="32" height="22" rx="3"
            stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-soft)" />
          <rect x="12" y="18" width="24" height="14" rx="2"
            fill="var(--bg-muted)" stroke="var(--border-hover)" strokeWidth="1" />
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={13 + i * 4.5} y={12} width="1.5" height="3" rx="0.5"
              fill="var(--accent)" opacity="0.4" />
          ))}
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={13 + i * 4.5} y={35} width="1.5" height="3" rx="0.5"
              fill="var(--accent)" opacity="0.4" />
          ))}
          <rect x="19" y="22" width="10" height="6" rx="1"
            fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.8" />
          <circle cx="36" cy="20" r="2" fill="var(--green)" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className={styles.rows}>
        <InfoRow label="Sumber"         value="ESP32" />
        <InfoRow label="IP Address"     value={ip}       mono />
        <InfoRow label="Uptime"         value={uptime}   mono accent="var(--accent)" />
        <InfoRow label="Sinyal Wi-Fi"   value={signalLabel} accent={signalColor} />
        <InfoRow label="RSSI"           value={rssi !== null ? `${rssi} dBm` : null} mono />
        <InfoRow label="Update Terakhir" value={formatTime(lastUpdate)} mono />
        <InfoRow label="Protokol"       value="MQTT / WebSocket" />
        <InfoRow label="Broker"         value="broker.hivemq.com" mono />
        <InfoRow label="Sensor"         value="DHT11" />
      </div>
    </div>
  );
}
