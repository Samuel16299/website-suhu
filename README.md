# 🌡️ ThermoSense — Monitor Suhu IoT ESP32

Dashboard monitoring suhu dan kelembaban real-time yang dibangun dengan **React + Vite**, dirancang untuk diintegrasikan dengan perangkat **ESP32** menggunakan sensor **DHT22**.

---

## 📸 Tampilan

> Dashboard menampilkan gauge suhu interaktif, grafik riwayat data, status perangkat ESP32, dan panel peringatan otomatis.

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Keterangan |
|-----------|------------|
| React 18  | Library UI utama |
| Vite      | Build tool & dev server |
| CSS Modules | Styling terisolasi per komponen |
| SVG Native | Gauge & chart dirender tanpa library eksternal |
| ESP32 (Arduino) | Mikrokontroler sumber data sensor |
| DHT22 / AM2302 | Sensor suhu dan kelembaban |

---

## 📁 Struktur Proyek

```
website-suhu/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Dashboard.jsx          # Layout utama halaman
│   │   ├── Dashboard.module.css
│   │   ├── TemperatureGauge.jsx   # Gauge SVG animasi
│   │   ├── TemperatureGauge.module.css
│   │   ├── StatusCard.jsx         # Kartu metrik (suhu, kelembaban, heat index)
│   │   ├── StatusCard.module.css
│   │   ├── ChartHistory.jsx       # Grafik riwayat SVG real-time
│   │   ├── ChartHistory.module.css
│   │   ├── DeviceStatus.jsx       # Info perangkat ESP32
│   │   ├── DeviceStatus.module.css
│   │   ├── AlertPanel.jsx         # Panel peringatan otomatis
│   │   └── AlertPanel.module.css
│   ├── App.jsx
│   ├── App.css                    # Variabel global & tema
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Cara Menjalankan

### Prasyarat

- Node.js >= 18
- npm >= 9

### Instalasi

```bash
# Clone repositori
git clone https://github.com/username/website-suhu.git
cd website-suhu

# Install dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Buka browser dan akses: `http://localhost:5173`

### Build Produksi

```bash
npm run build
npm run preview
```

---

## 🔌 Integrasi ESP32

### Skema Koneksi Sensor DHT22

```
ESP32 Pin    →  DHT22 Pin
3.3V         →  VCC (Pin 1)
GPIO 4       →  DATA (Pin 2) [dengan resistor pull-up 10kΩ ke 3.3V]
GND          →  GND (Pin 4)
```

### Kode Arduino (ESP32)

Upload kode berikut ke ESP32 menggunakan Arduino IDE:

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ── Konfigurasi ──────────────────────────
const char* ssid     = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

#define DHTPIN  4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

// ── Setup ────────────────────────────────
void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nTerhubung! IP: " + WiFi.localIP().toString());

  // CORS header agar bisa diakses dari browser
  server.on("/data", []() {
    float temp     = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temp) || isnan(humidity)) {
      server.send(500, "application/json", "{\"error\":\"Sensor gagal dibaca\"}");
      return;
    }

    StaticJsonDocument<200> doc;
    doc["temperature"] = temp;
    doc["humidity"]    = humidity;
    doc["heatIndex"]   = dht.computeHeatIndex(temp, humidity, false);
    doc["ip"]          = WiFi.localIP().toString();
    doc["rssi"]        = WiFi.RSSI();

    String json;
    serializeJson(doc, json);

    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", json);
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
```

### Dependensi Arduino Library

Instal via Arduino IDE → *Library Manager*:
- `DHT sensor library` oleh Adafruit
- `ArduinoJson` oleh Benoit Blanchon
- `WiFi` (bawaan ESP32 board package)

### Menghubungkan React ke ESP32

Ganti fungsi simulasi di `Dashboard.jsx` dengan fetch ke ESP32:

```javascript
// Di dalam Dashboard.jsx — ganti useESP32Data() dengan:
function useESP32Data() {
  const ESP32_IP = "192.168.1.105"; // Sesuaikan dengan IP ESP32 Anda
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    heatIndex: 0,
    connected: false,
    lastUpdate: new Date(),
    rssi: 0,
    ip: ESP32_IP,
    history: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res  = await fetch(`http://${ESP32_IP}/data`);
        const json = await res.json();
        setData(prev => ({
          ...prev,
          ...json,
          connected:  true,
          lastUpdate: new Date(),
          history: [
            ...prev.history.slice(-19),
            { time: new Date(), temp: json.temperature, humidity: json.humidity }
          ],
        }));
      } catch (err) {
        setData(prev => ({ ...prev, connected: false }));
        console.error("Gagal mengambil data ESP32:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // polling setiap 3 detik
    return () => clearInterval(interval);
  }, []);

  return data;
}
```

---

## ⚙️ Konfigurasi

### Mengubah Interval Polling

Di `Dashboard.jsx`, ubah angka `3000` (dalam milidetik):

```javascript
const interval = setInterval(fetchData, 3000); // 3000ms = 3 detik
```

### Mengubah Batas Ambang Peringatan

Di `AlertPanel.jsx`, ubah nilai kondisi:

```javascript
// Peringatan suhu tinggi
if (temperature >= 38) { /* bahaya */ }
else if (temperature >= 32) { /* peringatan */ }

// Peringatan kelembaban
if (humidity > 85) { /* terlalu lembab */ }
if (humidity < 30) { /* terlalu kering */ }
```

---

## 🎨 Kustomisasi Tema

Semua warna tema tersedia sebagai CSS variables di `App.css`:

```css
:root {
  --bg-primary:    #050b14;   /* Latar utama */
  --accent-cyan:   #00e5ff;   /* Aksen utama */
  --accent-green:  #00ff9d;   /* Status normal */
  --accent-yellow: #ffd166;   /* Status hangat */
  --accent-orange: #ff6b35;   /* Status panas */
  --accent-red:    #ff3d5a;   /* Status bahaya */
}
```

---

## 📊 Rentang Status Suhu

| Rentang | Status | Warna |
|---------|--------|-------|
| < 20°C  | Dingin | 🔵 Cyan |
| 20–25°C | Normal | 🟢 Hijau |
| 25–32°C | Hangat | 🟡 Kuning |
| 32–38°C | Panas  | 🟠 Oranye |
| > 38°C  | Bahaya | 🔴 Merah |

---

## 🔧 Troubleshooting

### Sensor terbaca `NaN`
- Pastikan kabel data DHT22 terhubung ke pin yang benar
- Pasang resistor pull-up 10kΩ antara pin DATA dan 3.3V
- Tunggu 2 detik setelah `dht.begin()` sebelum pembacaan pertama

### CORS Error di Browser
- Pastikan ESP32 mengirim header: `Access-Control-Allow-Origin: *`
- Atau gunakan proxy di `vite.config.js`:

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.1.105',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
}
```

### ESP32 tidak bisa terhubung WiFi
- Pastikan SSID dan password benar (case-sensitive)
- ESP32 hanya mendukung jaringan 2.4 GHz (bukan 5 GHz)

---

## 📄 Lisensi

MIT License — bebas digunakan dan dimodifikasi.

---

## 👤 Author

Dibuat dengan ❤️ menggunakan React + ESP32

> Untuk pertanyaan atau kontribusi, silakan buka *Issue* atau *Pull Request*.
