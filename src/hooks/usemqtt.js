import { useState, useEffect, useRef, useCallback } from "react";
import mqtt from "mqtt";

// ── Konfigurasi MQTT ──────────────────────────────────────────
const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";

const TOPIC_DATA   = "thermosense-samwell17-x2314/sensor/data";
const TOPIC_STATUS = "thermosense-samwell17-x2314/device/status";

export function useMQTT() {
  const clientRef = useRef(null);

  const [state, setState] = useState({
    connected:  false,
    connecting: true,
    error:      null,
  });

  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity:    null,
    heatIndex:   null,
    rssi:        null,
    ip:          "—",
    uptime:      "—",
    lastUpdate:  null,
    history:     [],
  });

  const connect = useCallback(() => {
    // Bersihkan koneksi lama jika ada
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }

    setState({ connected: false, connecting: true, error: null });

    // Client ID
    const clientId = `thermosense-web-${Date.now().toString(16)}`;

    const client = mqtt.connect(BROKER_URL, {
      clientId,
      clean:           true,
      reconnectPeriod: 5000,   // coba reconnect tiap 5 detik
      connectTimeout:  15_000, // timeout 15 detik
      keepalive:       60,
    });

    clientRef.current = client;

    client.on("connect", () => {
      console.log("[MQTT] Terhubung ke broker:", BROKER_URL);
      setState({ connected: true, connecting: false, error: null });

      client.subscribe([TOPIC_DATA, TOPIC_STATUS], { qos: 0 }, (err) => {
        if (err) console.error("[MQTT] Subscribe gagal:", err);
        else console.log("[MQTT] Subscribe ke:", TOPIC_DATA);
      });
    });

    client.on("message", (topic, payload) => {
      try {
        const data = JSON.parse(payload.toString());
        console.log("[MQTT] Data diterima:", data);

        if (topic === TOPIC_DATA) {
          setSensorData(prev => {
            const newPoint = {
              time:     new Date(),
              temp:     parseFloat(data.temperature),
              humidity: parseFloat(data.humidity),
            };
            // Simpan max 30 titik riwayat
            const newHistory = [...prev.history.slice(-29), newPoint];

            return {
              temperature: parseFloat(data.temperature),
              humidity:    parseFloat(data.humidity),
              heatIndex:   parseFloat(data.heatIndex),
              rssi:        data.rssi   ?? prev.rssi,
              ip:          data.ip     ?? prev.ip,
              uptime:      data.uptime ?? prev.uptime,
              lastUpdate:  new Date(),
              history:     newHistory,
            };
          });
        }
      } catch (e) {
        console.warn("[MQTT] Payload tidak valid:", payload.toString());
      }
    });

    client.on("reconnect", () => {
      console.log("[MQTT] Mencoba reconnect...");
      setState(s => ({ ...s, connecting: true, connected: false }));
    });

    client.on("offline", () => {
      console.warn("[MQTT] Koneksi offline");
      setState(s => ({ ...s, connected: false, connecting: false }));
    });

    client.on("error", (err) => {
      console.error("[MQTT] Error:", err.message);
      setState({ connected: false, connecting: false, error: err.message });
    });

    client.on("close", () => {
      setState(s => ({ ...s, connected: false }));
    });
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
      setState({ connected: false, connecting: false, error: null });
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, []);

  return { ...state, sensorData, reconnect: connect, disconnect };
}
