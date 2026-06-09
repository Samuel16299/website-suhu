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
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
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
    const duration = 700;
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

  const cx = 150, cy = 150, r = 108;
  const trackStart = -135, trackEnd = 135;
  const fillEnd = -135 + ((displayTemp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 270;

  const trackBg       = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
  const tickMajor     = isDark ? "rgba(255,255,255,0.2)"  : "rgba(0,0,0,0.2)";
  const tickMinor     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const labelFill     = isDark ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.4)";
  const centerNumFill = isDark ? "#f0f2f7"                : "#111827";
  const celsiusFill   = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const needleBg      = isDark ? "#1c2030"                : "#ffffff";

  // Color from status
  const fillColor = status.color;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Monitor Suhu</span>
        <span className={styles.cardSub}>Live</span>
      </div>

      <div className={styles.gaugeWrap}>
        <svg viewBox="0 0 300 255" className={styles.svg}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={fillColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Track background */}
          <path
            d={describeArc(cx, cy, r, trackStart, trackEnd)}
            fill="none"
            stroke={trackBg}
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Filled arc */}
          <path
            d={describeArc(cx, cy, r, trackStart, Math.max(trackStart + 0.5, fillEnd))}
            fill="none"
            stroke={fillColor}
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Tick marks */}
          {Array.from({ length: 11 }, (_, i) => {
            const angle = -135 + i * 27;
            const inner = polarToXY(cx, cy, r - 20, angle);
            const outer = polarToXY(cx, cy, r + 1, angle);
            return (
              <line
                key={i}
                x1={outer.x} y1={outer.y}
                x2={inner.x} y2={inner.y}
                stroke={i % 5 === 0 ? tickMajor : tickMinor}
                strokeWidth={i % 5 === 0 ? 1.5 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {/* Labels */}
          {[0, 10, 20, 30, 40, 50].map((val, i) => {
            const angle = -135 + (i / 5) * 270;
            const pos = polarToXY(cx, cy, r - 34, angle);
            return (
              <text key={val} x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fill={labelFill}
                fontFamily="JetBrains Mono, monospace">
                {val}
              </text>
            );
          })}

          {/* Needle */}
          {(() => {
            const needle = polarToXY(cx, cy, r - 16, tempToAngle(displayTemp));
            return (
              <>
                <line
                  x1={cx} y1={cy}
                  x2={needle.x} y2={needle.y}
                  stroke={fillColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <circle cx={cx} cy={cy} r="7" fill={needleBg} stroke={fillColor} strokeWidth="2" />
                <circle cx={cx} cy={cy} r="2.5" fill={fillColor} />
              </>
            );
          })()}

          {/* Center readout */}
          <text x={cx} y={cy + 40} textAnchor="middle" fontSize="36" fontWeight="700"
            fill={centerNumFill} fontFamily="Inter, sans-serif" letterSpacing="-1">
            {displayTemp.toFixed(1)}
          </text>
          <text x={cx} y={cy + 60} textAnchor="middle" fontSize="12"
            fill={celsiusFill} fontFamily="Inter, sans-serif">
            °Celsius
          </text>
          <text x={cx} y={cy + 80} textAnchor="middle" fontSize="10" fontWeight="600"
            fill={fillColor} fontFamily="Inter, sans-serif" letterSpacing="0.05em">
            {status.label.toUpperCase()}
          </text>
        </svg>
      </div>

      <div className={styles.ranges}>
        <div className={styles.range} style={{ "--c": "var(--cyan)" }}>
          <span className={styles.rangeDot} />
          <span>Dingin &lt;20°</span>
        </div>
        <div className={styles.range} style={{ "--c": "var(--green)" }}>
          <span className={styles.rangeDot} />
          <span>Normal 20–25°</span>
        </div>
        <div className={styles.range} style={{ "--c": "var(--orange)" }}>
          <span className={styles.rangeDot} />
          <span>Hangat 25–32°</span>
        </div>
        <div className={styles.range} style={{ "--c": "var(--red)" }}>
          <span className={styles.rangeDot} />
          <span>Panas &gt;32°</span>
        </div>
      </div>
    </div>
  );
}