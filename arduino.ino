// ===============================
// ARDUINO UNO
// DATA COLLECTION + WAVEFORM + RMS + ANOMALY
// ===============================

// Sensors
#define C2_PIN A2      // ACS712 current sensor
#define V2_PIN A3      // ZMPT101B voltage sensor

// Sampling
#define SAMPLES 200
#define ADC_REF 5.0
#define ADC_RES 1023.0
#define MID_ADC 512.0

// Thresholds (tune later)
#define OVER_CURRENT_RMS 2.2
#define MIN_CURRENT_RMS 0.05
#define MIN_VOLTAGE_RMS 160.0

void setup() {
  Serial.begin(115200);
  Serial.println("ARDUINO DATA COLLECTION STARTED");
}

// ---------- RMS FUNCTION ----------
float computeRMS(int pin) {
  double sumSq = 0;

  for (int i = 0; i < SAMPLES; i++) {
    int raw = analogRead(pin);
    float centered = raw - MID_ADC;
    sumSq += centered * centered;
    delayMicroseconds(200);
  }

  return sqrt(sumSq / SAMPLES);
}

void loop() {

  // ---------- WAVEFORM OUTPUT ----------
  Serial.println("BEGIN_WAVEFORM");

  for (int i = 0; i < SAMPLES; i++) {
    int c2_raw = analogRead(C2_PIN);
    int v2_raw = analogRead(V2_PIN);

    // CSV: index,C2_raw,V2_raw
    Serial.print(i);
    Serial.print(",");
    Serial.print(c2_raw);
    Serial.print(",");
    Serial.println(v2_raw);

    delayMicroseconds(200);
  }

  Serial.println("END_WAVEFORM");

  // ---------- RMS COMPUTATION ----------
  float c2_rms = computeRMS(C2_PIN) * (ADC_REF / ADC_RES);
  float v2_rms = computeRMS(V2_PIN) * (ADC_REF / ADC_RES) * 100.0;

  Serial.println("----- RMS (V2 & C2) -----");
  Serial.print("C2_RMS(A): ");
  Serial.println(c2_rms, 3);
  Serial.print("V2_RMS(V): ");
  Serial.println(v2_rms, 1);

  // ---------- ANOMALY DETECTION ----------
  Serial.println("----- ANOMALY -----");

  if (c2_rms > OVER_CURRENT_RMS) {
    Serial.println("⚠️ OVER CURRENT (C2)");
  }
  else if (v2_rms > MIN_VOLTAGE_RMS && c2_rms < MIN_CURRENT_RMS) {
    Serial.println("⚠️ VOLTAGE PRESENT BUT NO LOAD");
  }
  else if (v2_rms < MIN_VOLTAGE_RMS) {
    Serial.println("⚠️ VOLTAGE DROP (V2)");
  }
  else {
    Serial.println("NORMAL");
  }

  Serial.println("-------------------------\n");

  delay(3000);   // next cycle
}
