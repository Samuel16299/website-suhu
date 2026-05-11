import styles from "./StatusCard.module.css";

export default function StatusCard({ label, value, sub, icon, color, glow }) {
  return (
    <div className={styles.card} style={{ "--accent": color }}>
      <div className={styles.top}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.value} style={{ color, textShadow: glow ? `0 0 20px ${color}55` : "none" }}>
        {value}
      </div>
      <div className={styles.sub}>{sub}</div>
      <div className={styles.bar}>
        <div className={styles.barFill} />
      </div>
    </div>
  );
}
