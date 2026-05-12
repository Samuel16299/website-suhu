import { useEffect, useRef, useState } from "react";
import styles from "./TemperatureGauge.module.css";

const MIN_TEMP = 0;
const MAX_TEMP = 50;

function tempToAngle(temp) {
  const pct = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
  return -135 + pct * 270;
}

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const s = polarToXY(cx, cy, r, startAngle);
  const e = polarToXY(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function TemperatureGauge({ temperature, status, isDark }) {
  const [displayTemp, setDisplayTemp] = useState(temperature);
  const animRef = useRef(null);

  useEffect(() => {
    const start = displayTemp;
    const end = temperature;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayTemp(parseFloat((start + (end - start) * ease).toFixed(2)));
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [temperature]);

  const cx = 150, cy = 150, r = 110;
  const trackStart = -135, trackEnd = 135;
  const fillEnd = -135 + ((displayTemp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 270;
  const needle = polarToXY(cx, cy, r - 18, tempToAngle(displayTemp));

  const getGradientId = () => {
    if (displayTemp < 25) return "gradCold";
    if (displayTemp < 32) return "gradWarm";
    return "gradHot";
  };

  const trackBg        = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const tickMajor      = isDark ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.3)";
  const tickMinor      = isDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.12)";
  const labelFill      = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.5)";
  const centerNumFill  = isDark ? "#ffffff"                : "#0f172a";
  const celsiusFill    = isDark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.4)";
  const needleBg       = isDark ? "var(--bg-card)"         : "#ffffff";

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Monitor Suhu</span>
        <span className={styles.cardSub}>Real-time</span>
      </div>

      <div className={styles.gaugeWrap}>
        <svg viewBox="0 0 300 260" className={styles.svg}>
          <defs>
            <linearGradient id="gradCold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#00ff9d" />
            </linearGradient>
            <linearGradient id="gradWarm" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff9d" />
              <stop offset="100%" stopColor="#ffd166" />
            </linearGradient>
            <linearGradient id="gradHot" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd166" />
              <stop offset="100%" stopColor="#ff3d5a" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke="rgba(0,229,255,0.05)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r + 8}  fill="none" stroke="rgba(0,229,255,0.08)" strokeWidth="1" />

          <path
            d={describeArc(cx, cy, r, trackStart, trackEnd)}
            fill="none"
            stroke={trackBg}
            strokeWidth="14"
            strokeLinecap="round"
          />

          <path
            d={describeArc(cx, cy, r, trackStart, Math.max(trackStart + 1, fillEnd))}
            fill="none"
            stroke={`url(#${getGradientId()})`}
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {Array.from({ length: 11 }, (_, i) => {
            const angle = -135 + i * 27;
            const inner = polarToXY(cx, cy, r - 22, angle);
            const outer = polarToXY(cx, cy, r + 2,  angle);
            return (
              <line
                key={i}
                x1={outer.x} y1={outer.y}
                x2={inner.x} y2={inner.y}
                stroke={i % 5 === 0 ? tickMajor : tickMinor}
                strokeWidth={i % 5 === 0 ? 1.5 : 1}
              />
            );
          })}

          {[0, 10, 20, 30, 40, 50].map((val, i) => {
            const angle = -135 + (i / 5) * 270;
            const pos = polarToXY(cx, cy, r - 36, angle);
            return (
              <text key={val} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fill={labelFill} fontFamily="Space Mono, monospace">
                {val}
              </text>
            );
          })}

          <line
            x1={cx} y1={cy}
            x2={needle.x} y2={needle.y}
            stroke={status.color}
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          <circle cx={cx} cy={cy} r="8" fill={needleBg} stroke={status.color} strokeWidth="2" />
          <circle cx={cx} cy={cy} r="3" fill={status.color} />

          <text x={cx} y={cy + 42} textAnchor="middle" fontSize="38" fontWeight="700"
            fill={centerNumFill} fontFamily="Syne, sans-serif" letterSpacing="-1">
            {displayTemp.toFixed(1)}
          </text>
          <text x={cx} y={cy + 64} textAnchor="middle" fontSize="14"
            fill={celsiusFill} fontFamily="DM Sans, sans-serif">
            °Celsius
          </text>
          <text x={cx} y={cy + 86} textAnchor="middle" fontSize="11" fontWeight="600"
            fill={status.color} fontFamily="Syne, sans-serif" letterSpacing="0.08em">
            {status.label.toUpperCase()}
          </text>
        </svg>
      </div>

      <div className={styles.ranges}>
        <div className={styles.range} style={{ "--c": "var(--accent-cyan)" }}>
          <span className={styles.rangeDot} />
          <span>Dingin &lt;20°</span>
        </div>
        <div className={styles.range} style={{ "--c": "var(--accent-green)" }}>
          <span className={styles.rangeDot} />
          <span>Normal 20–25°</span>
        </div>
        <div className={styles.range} style={{ "--c": "var(--accent-yellow)" }}>
          <span className={styles.rangeDot} />
          <span>Hangat 25–32°</span>
        </div>
        <div className={styles.range} style={{ "--c": "var(--accent-red)" }}>
          <span className={styles.rangeDot} />
          <span>Panas &gt;32°</span>
        </div>
      </div>
    </div>
  );
}