import styles from "./MQTTStatus.module.css";

export default function MQTTStatus({ connected, connecting, error, onReconnect }) {
  if (connected) return null; // hilang saat terhubung

  if (connecting) {
    return (
      <div className={`${styles.banner} ${styles.connecting}`}>
        <div className={styles.spinner}></div>
        <span>Menghubungkan ke MQTT broker <strong>broker.hivemq.com</strong>…</span>
        <span className={styles.hint}>Pastikan simulasi Wokwi sedang berjalan</span>
      </div>
    );
  }

  return (
    <div className={`${styles.banner} ${styles.error}`}>
      <span>⚠️</span>
      <span>
        {error
          ? `Koneksi gagal: ${error}`
          : "MQTT terputus — menunggu reconnect otomatis…"}
      </span>
      <button className={styles.btn} onClick={onReconnect}>
        Hubungkan Ulang
      </button>
    </div>
  );
}
