#include <WiFi.h>
#include <PubSubClient.h>
#include <DHTesp.h>
#include <ArduinoJson.h>

// ── WiFi Wokwi (jangan diubah untuk simulasi) ───────────────
const char* ssid     = "Wokwi-GUEST";
const char* password = "";

// ── MQTT Broker Publik (HiveMQ) ─────────────────────────────
const char* mqtt_server = "broker.emqx.io"; 
const int   mqtt_port   = 1883;

const char* TOPIC_DATA   = "thermosense-samwell17-x2314/sensor/data";
const char* TOPIC_STATUS = "thermosense-samwell17-x2314/device/status";
const char* CLIENT_ID    = "esp32-thermosense-samwell17-x2314";

// ── Pin Sensor ───────────────────────────────────────────────
#define DHT_PIN  15
#define LED_PIN   2   // LED bawaan ESP32

DHTesp        dht;
WiFiClient    espClient;
PubSubClient  mqtt(espClient);

unsigned long lastPublish = 0;
const long    INTERVAL    = 3000; // publish setiap 3 detik
unsigned long uptimeStart = 0;

// ── Fungsi Helper ─────────────────────────────────────────────
String formatUptime(unsigned long ms) {
  unsigned long s = ms / 1000;
  unsigned long h = s / 3600; s %= 3600;
  unsigned long m = s / 60;   s %= 60;
  char buf[12];
  sprintf(buf, "%02lu:%02lu:%02lu", h, m, s);
  return String(buf);
}

// ── Setup WiFi ────────────────────────────────────────────────
void setupWiFi() {
  Serial.print("Menghubungkan ke WiFi Wokwi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi terhubung! IP: " + WiFi.localIP().toString());
}

// ── Reconnect MQTT ────────────────────────────────────────────
void reconnectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Menghubungkan ke MQTT broker...");
    if (mqtt.connect(CLIENT_ID)) {
      Serial.println("terhubung!");
      // Publish status online
      mqtt.publish(TOPIC_STATUS, "{\"status\":\"online\"}", true);
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(mqtt.state());
      Serial.println(" — coba lagi dalam 3 detik");
      delay(3000);
    }
  }
}

// ── Setup ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  dht.setup(DHT_PIN, DHTesp::DHT22);
  delay(2000); // tunggu sensor siap

  setupWiFi();

  mqtt.setServer(mqtt_server, mqtt_port);
  
  // PERBAIKAN 1: Memperbesar kapasitas kantong pesan (buffer) agar JSON tidak terpotong
  mqtt.setBufferSize(512); 
  
  mqtt.setKeepAlive(60);

  uptimeStart = millis();
  Serial.println("Setup selesai. Memulai pengiriman data...");
}

// ── Loop ──────────────────────────────────────────────────────
void loop() {
  if (!mqtt.connected()) reconnectMQTT();
  mqtt.loop();

  unsigned long now = millis();
  if (now - lastPublish >= INTERVAL) {
    lastPublish = now;

    TempAndHumidity reading = dht.getTempAndHumidity();

    if (dht.getStatus() != 0) {
      Serial.println("Error membaca sensor DHT22: " + String(dht.getStatusString()));
      return;
    }

    float temp      = reading.temperature;
    float humidity  = reading.humidity;
    float heatIndex = dht.computeHeatIndex(temp, humidity, false);

    // Buat JSON payload
    StaticJsonDocument<256> doc;
    
    // PERBAIKAN 2: Menggunakan tipe data float secara langsung (tidak dikonversi jadi string)
    doc["temperature"] = temp;
    doc["humidity"]    = humidity;
    doc["heatIndex"]   = heatIndex;
    doc["rssi"]        = WiFi.RSSI();
    doc["ip"]          = WiFi.localIP().toString();
    doc["uptime"]      = formatUptime(millis() - uptimeStart);
    doc["ts"]          = millis();

    char payload[256];
    serializeJson(doc, payload);

    // Publish ke MQTT
    bool ok = mqtt.publish(TOPIC_DATA, payload);

    // Kedipkan LED saat berhasil publish
    if (ok) {
      digitalWrite(LED_PIN, HIGH);
      delay(80);
      digitalWrite(LED_PIN, LOW);
    }

    // Debug serial
    Serial.printf("[%.1fs] Suhu: %.1f°C | Kelembaban: %.0f%% | Heat Index: %.1f°C | RSSI: %d dBm\n",
      (millis() - uptimeStart) / 1000.0, temp, humidity, heatIndex, WiFi.RSSI());
  }
}