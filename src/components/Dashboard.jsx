import { useState, useEffect } from "react";
import { useMQTT } from "../hooks/useMQTT";
import TemperatureGauge from "./TemperatureGauge";
import StatusCard from "./StatusCard";
import ChartHistory from "./ChartHistory";
import DeviceStatus from "./DeviceStatus";
import AlertPanel from "./AlertPanel";
import MQTTStatus from "./MQTTStatus";
import styles from "./Dashboard.module.css";

function getTemperatureStatus(temp) {
  if (temp === null || temp === undefined)
    return { label: "Menunggu...", color: "var(--text-muted)", level: "waiting" };
  if (temp < 20) return { label: "Dingin", color: "var(--cyan)", level: "cold" };
  if (temp < 25) return { label: "Normal", color: "var(--green)", level: "normal" };
  if (temp < 32) return { label: "Hangat", color: "var(--orange)", level: "warm" };
  if (temp < 38) return { label: "Panas", color: "var(--orange)", level: "hot" };
  return { label: "Bahaya!", color: "var(--red)", level: "danger" };
}

export default function Dashboard({ isDark }) {
  const { connected, connecting, error, sensorData, reconnect } = useMQTT();
  const { temperature, humidity, heatIndex, rssi, ip, uptime, lastUpdate, history } = sensorData;
  const status = getTemperatureStatus(temperature);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (d) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDate = (d) => d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const tempDisplay = temperature !== null ? `${temperature}°C` : "—";
  const humDisplay = humidity !== null ? `${humidity}%` : "—";
  const hiDisplay = heatIndex !== null ? `${Number(heatIndex).toFixed(1)}°C` : "—";

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            {/* Thermometer icon — sederhana */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>
            <span className={styles.logoText}>ThermoSense</span>
          </div>
          <div className={styles.headerTag}>ESP32 · MQTT</div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.clockTime}>{fmt(now)}</div>
          <div className={styles.clockDate}>{fmtDate(now)}</div>
        </div>

        <div className={styles.headerRight}>
          <div className={`${styles.connBadge} ${connected ? styles.connected : styles.disconnected}`}>
            <span className={styles.connDot} />
            {connecting ? "Menghubungkan..." : connected ? "Terhubung" : "Terputus"}
          </div>
          {rssi !== null && (
            <div className={styles.rssi}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="11" width="2" height="4" rx="1" fill={rssi > -70 ? "var(--accent)" : "var(--text-muted)"} />
                <rect x="5" y="8" width="2" height="7" rx="1" fill={rssi > -65 ? "var(--accent)" : "var(--text-muted)"} />
                <rect x="9" y="5" width="2" height="10" rx="1" fill={rssi > -60 ? "var(--accent)" : "var(--text-muted)"} />
                <rect x="13" y="2" width="2" height="13" rx="1" fill={rssi > -55 ? "var(--accent)" : "var(--text-muted)"} />
              </svg>
              <span>{rssi} dBm</span>
            </div>
          )}
        </div>
      </header>

      <MQTTStatus connected={connected} connecting={connecting} error={error} onReconnect={reconnect} />

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <TemperatureGauge temperature={temperature ?? 0} status={status} noData={temperature === null} isDark={isDark} />
          <AlertPanel temperature={temperature} humidity={humidity} status={status} />
        </div>
        <div className={styles.colCenter}>
          <div className={styles.statsRow}>
            <StatusCard label="Suhu" value={tempDisplay} sub="Celsius" color={status.color} />
            <StatusCard label="Kelembaban" value={humDisplay} sub="Relatif" color="var(--accent)" />
            <StatusCard label="Heat Index" value={hiDisplay} sub="Terasa seperti" color="var(--orange)" />
          </div>
          <ChartHistory history={history} />
        </div>
        <div className={styles.colRight}>
          <DeviceStatus ip={ip} uptime={uptime} rssi={rssi} lastUpdate={lastUpdate} />
        </div>
      </main>

      <footer className={styles.footer}>
        <span>ThermoSense v1.0</span>
        <span>·</span>
        <span>ESP32 + DHT11 via MQTT</span>
        <span>·</span>
        <span>broker.hivemq.com</span>
        {lastUpdate && <><span>·</span><span>Update: {fmt(lastUpdate)}</span></>}
      </footer>
    </div>
  );
}