import styles from "./StatusCard.module.css";

export default function StatusCard({ label, value, sub, icon, color }) {
  return (
    <div className={styles.card} style={{ "--accent-color": color }}>
      <div className={styles.top}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.value} style={{ color }}>
        {value}
      </div>
      <div className={styles.sub}>{sub}</div>
      <div className={styles.divider} />
    </div>
  );
}
