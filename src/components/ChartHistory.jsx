import { useMemo } from "react";
import styles from "./ChartHistory.module.css";

function buildPath(points, width, height, minVal, maxVal) {
  if (points.length < 2) return "";
  const xStep = width / (points.length - 1);
  const range = maxVal - minVal || 1;
  const coords = points.map((v, i) => ({
    x: i * xStep,
    y: height - ((v - minVal) / range) * height,
  }));
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function buildArea(points, width, height, minVal, maxVal) {
  const path = buildPath(points, width, height, minVal, maxVal);
  if (!path) return "";
  const xStep = width / (points.length - 1);
  return `${path} L ${(points.length - 1) * xStep} ${height} L 0 ${height} Z`;
}

export default function ChartHistory({ history }) {
  const W = 600, H = 120;

  // ── Guard: tampilkan placeholder saat data belum ada ──────────
  const hasData = history.length >= 2;

  const temps = hasData ? history.map((h) => h.temp) : [];
  const hums  = hasData ? history.map((h) => h.humidity) : [];

  const minT = hasData ? Math.min(...temps) - 1 : 0;
  const maxT = hasData ? Math.max(...temps) + 1 : 50;
  const minH = hasData ? Math.min(...hums)  - 2 : 0;
  const maxH = hasData ? Math.max(...hums)  + 2 : 100;

  const tempPath = useMemo(() => hasData ? buildPath(temps, W, H, minT, maxT) : "", [history]);
  const tempArea = useMemo(() => hasData ? buildArea(temps, W, H, minT, maxT) : "", [history]);
  const humPath  = useMemo(() => hasData ? buildPath(hums,  W, H, minH, maxH) : "", [history]);

  const timeLabels = useMemo(() => {
    if (!hasData) return [];
    return history
      .filter((_, i) => i % 5 === 0)
      .map((h) => h.time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
  }, [history]);

  // Koordinat live dot — hanya kalkulasi jika data tersedia
  const lastX     = hasData ? W : null;
  const lastTempY = hasData ? H - ((temps[temps.length - 1] - minT) / (maxT - minT)) * H : null;
  const lastHumY  = hasData ? H - ((hums[hums.length - 1]  - minH) / (maxH - minH)) * H : null;

  const avg = hasData ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : "—";
  const min = hasData ? Math.min(...temps).toFixed(1) : "—";
  const max = hasData ? Math.max(...temps).toFixed(1) : "—";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>Riwayat Data</div>
        <div className={styles.legends}>
          <div className={styles.legend}>
            <span className={styles.legendDot} style={{ background: "var(--accent-cyan)" }} />
            <span>Suhu (°C)</span>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendDot} style={{ background: "var(--accent-blue)" }} />
            <span>Kelembaban (%)</span>
          </div>
        </div>
      </div>

      <div className={styles.chartWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.svg}>
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
            </linearGradient>
            <filter id="lineGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines — selalu tampil */}
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <line key={i} x1="0" y1={v * H} x2={W} y2={v * H}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {!hasData && (
            <>
              {/* Placeholder garis putus-putus */}
              <line x1="0" y1={H / 2} x2={W} y2={H / 2}
                stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="6 4" />
              <text x={W / 2} y={H / 2 - 12} textAnchor="middle"
                fill="rgba(255,255,255,0.2)" fontSize="12" fontFamily="Space Mono, monospace">
                Menunggu data dari ESP32...
              </text>
              <text x={W / 2} y={H / 2 + 14} textAnchor="middle"
                fill="rgba(255,255,255,0.12)" fontSize="10" fontFamily="Space Mono, monospace">
                Butuh minimal 2 sampel
              </text>
            </>
          )}

          {hasData && (
            <>
              <path d={tempArea} fill="url(#tempGrad)" />
              <path d={humPath} fill="none" stroke="var(--accent-blue)"
                strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="4 3" />
              <path d={tempPath} fill="none" stroke="var(--accent-cyan)"
                strokeWidth="2" filter="url(#lineGlow)" />
              {/* Live dot — temp */}
              <circle cx={lastX} cy={lastTempY} r="4" fill="var(--accent-cyan)" />
              <circle cx={lastX} cy={lastTempY} r="8" fill="var(--accent-cyan)" opacity="0.2">
                <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Live dot — humidity */}
              <circle cx={lastX} cy={lastHumY} r="3" fill="var(--accent-blue)" />
            </>
          )}
        </svg>
      </div>

      {/* Time axis */}
      <div className={styles.timeAxis}>
        {timeLabels.map((t, i) => (
          <span key={i} className={styles.timeLabel}>{t}</span>
        ))}
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Min</span>
          <span className={styles.statValue} style={{ color: "var(--accent-cyan)" }}>
            {min}{hasData ? "°C" : ""}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Maks</span>
          <span className={styles.statValue} style={{ color: "var(--accent-orange)" }}>
            {max}{hasData ? "°C" : ""}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Rata-rata</span>
          <span className={styles.statValue} style={{ color: "var(--accent-green)" }}>
            {avg}{hasData ? "°C" : ""}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Sampel</span>
          <span className={styles.statValue}>{history.length}</span>
        </div>
      </div>
    </div>
  );
}
