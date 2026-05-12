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
  if (temp < 20) return { label: "Dingin",   color: "var(--accent-cyan)",   level: "cold"   };
  if (temp < 25) return { label: "Normal",   color: "var(--accent-green)",  level: "normal" };
  if (temp < 32) return { label: "Hangat",   color: "var(--accent-yellow)", level: "warm"   };
  if (temp < 38) return { label: "Panas",    color: "var(--accent-orange)", level: "hot"    };
  return           { label: "Bahaya!",  color: "var(--accent-red)",    level: "danger" };
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

  const fmt     = (d) => d.toLocaleTimeString("id-ID",   { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDate = (d) => d.toLocaleDateString("id-ID",   { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const tempDisplay = temperature !== null ? `${temperature}°C` : "—";
  const humDisplay  = humidity    !== null ? `${humidity}%`     : "—";
  const hiDisplay   = heatIndex   !== null ? `${heatIndex}°C`   : "—";

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="var(--accent-cyan)" strokeWidth="1.5" />
              <path d="M14 6v10M14 20v2" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="14" cy="21" r="3" fill="var(--accent-cyan)" opacity="0.8" />
              <path d="M10 14h8" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M11 10h6" stroke="var(--accent-blue)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span className={styles.logoText}>ThermoSense</span>
          </div>
          <div className={styles.headerTag}>ESP32 · Wokwi · MQTT</div>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.clockTime} style={{ color: "#ffffff" }}>{fmt(now)}</div>
          <div className={styles.clockDate} style={{ color: "rgba(255,255,255,0.6)" }}>{fmtDate(now)}</div>
        </div>

        <div className={styles.headerRight}>
          <div className={`${styles.connBadge} ${connected ? styles.connected : styles.disconnected}`}>
            <span className={styles.connDot}></span>
            {connecting ? "Menghubungkan..." : connected ? "MQTT Terhubung" : "Terputus"}
          </div>
          {rssi !== null && (
            <div className={styles.rssi}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1"  y="11" width="2" height="4"  rx="1" fill={rssi > -70 ? "var(--accent-cyan)" : "var(--text-muted)"} />
                <rect x="5"  y="8"  width="2" height="7"  rx="1" fill={rssi > -65 ? "var(--accent-cyan)" : "var(--text-muted)"} />
                <rect x="9"  y="5"  width="2" height="10" rx="1" fill={rssi > -60 ? "var(--accent-cyan)" : "var(--text-muted)"} />
                <rect x="13" y="2"  width="2" height="13" rx="1" fill={rssi > -55 ? "var(--accent-cyan)" : "var(--text-muted)"} />
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
            <StatusCard label="Suhu"       value={tempDisplay} sub="Celsius"       icon="🌡️" color={status.color}           glow />
            <StatusCard label="Kelembaban" value={humDisplay}  sub="Relatif"       icon="💧" color="var(--accent-blue)"          />
            <StatusCard label="Heat Index" value={hiDisplay}   sub="Terasa seperti" icon="🔥" color="var(--accent-orange)"        />
          </div>
          <ChartHistory history={history} />
        </div>
        <div className={styles.colRight}>
          <DeviceStatus ip={ip} uptime={uptime} rssi={rssi} lastUpdate={lastUpdate} />
        </div>
      </main>

      <footer className={styles.footer}>
        <span>ThermoSense v1.0.0</span>
        <span>·</span>
        <span>ESP32 + DHT11 via MQTT</span>
        <span>·</span>
        <span>Broker: broker.hivemq.com</span>
        {lastUpdate && <><span>·</span><span>Update: {fmt(lastUpdate)}</span></>}
      </footer>
    </div>
  );
}