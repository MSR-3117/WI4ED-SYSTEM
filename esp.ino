#include <SPIFFS.h>

// =====================
// USER CONFIG
// =====================
#define RX_PIN 20          // Arduino TX → ESP32 RX
#define TX_PIN 21
#define RELAY_PIN 8        // ACTIVE-LOW relay

#define ADC_REF 5.0
#define ADC_RES 1023.0

// Thresholds (tune later)
#define OVER_CURRENT_RMS 2.2
#define MIN_CURRENT_RMS 0.05
#define MIN_VOLTAGE_RMS 160.0

// Predictive maintenance
#define CURRENT_TREND_LIMIT 0.3   // RMS drift

// =====================
// GLOBALS
// =====================
float c2_samples[256];
float v2_samples[256];
int sample_count = 0;

float prev_c2_rms = 0;

// =====================
// SETUP
// =====================
void setup() {
  Serial.begin(115200);
  Serial1.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);   // Relay ON (active-low)

  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS FAILED");
    while (1);
  }

  Serial.println("ESP32 EDGE ANALYTICS STARTED");
}

// =====================
// RMS FUNCTION
// =====================
float computeRMS(float *buf, int len) {
  double sum = 0;
  for (int i = 0; i < len; i++) sum += buf[i] * buf[i];
  return sqrt(sum / len);
}

// =====================
// STORE LOCALLY
// =====================
void storeData(float c2_rms, float v2_rms, String anomaly) {
  File f = SPIFFS.open("/log.txt", FILE_APPEND);
  if (!f) return;

  f.printf("C2_RMS=%.3f,V2_RMS=%.1f,ANOMALY=%s\n",
           c2_rms, v2_rms, anomaly.c_str());
  f.close();
}

// =====================
// MAIN LOOP
// =====================
void loop() {

  if (!Serial1.available()) return;

  String line = Serial1.readStringUntil('\n');
  line.trim();

  // -------- START WAVEFORM --------
  if (line == "BEGIN_WAVEFORM") {
    sample_count = 0;
    return;
  }

  // -------- END WAVEFORM --------
  if (line == "END_WAVEFORM") {

    // --- RMS ---
    float c2_rms = computeRMS(c2_samples, sample_count);
    float v2_rms = computeRMS(v2_samples, sample_count) * 100.0;

    // --- ANOMALY LOGIC ---
    String anomaly = "NORMAL";

    if (c2_rms > OVER_CURRENT_RMS) {
      anomaly = "OVER CURRENT";
      digitalWrite(RELAY_PIN, HIGH);  // CUT POWER
    }

    if (v2_rms > MIN_VOLTAGE_RMS && c2_rms < MIN_CURRENT_RMS) {
      anomaly = "VOLTAGE PRESENT NO LOAD";
    }

    if (v2_rms < MIN_VOLTAGE_RMS) {
      anomaly = "VOLTAGE DROP";
    }

    // --- PREDICTIVE MAINTENANCE ---
    if (abs(c2_rms - prev_c2_rms) > CURRENT_TREND_LIMIT) {
      anomaly = "PREDICTIVE: CURRENT DRIFT";
    }

    prev_c2_rms = c2_rms;

    // --- OUTPUT ---
    Serial.println("===== ESP32 ANALYTICS =====");
    Serial.printf("C2_RMS: %.3f A\n", c2_rms);
    Serial.printf("V2_RMS: %.1f V\n", v2_rms);
    Serial.print("STATUS: ");
    Serial.println(anomaly);
    Serial.println("===========================\n");

    // --- STORE LOCALLY ---
    storeData(c2_rms, v2_rms, anomaly);

    return;
  }

  // -------- COLLECT SAMPLES --------
  if (line.indexOf(',') > 0 && sample_count < 256) {
    int i1 = line.indexOf(',');
    int i2 = line.lastIndexOf(',');

    float c2 = line.substring(i1 + 1, i2).toFloat();
    float v2 = line.substring(i2 + 1).toFloat();

    // Center waveform
    c2_samples[sample_count] = (c2 - 512) * (ADC_REF / ADC_RES);
    v2_samples[sample_count] = (v2 - 512) * (ADC_REF / ADC_RES);

    sample_count++;
  }
}
