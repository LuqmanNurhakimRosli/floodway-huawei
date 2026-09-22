// FloodWay sensor node - ESP32 + JSN-SR04T (waterproof ultrasonic, mounted ABOVE the water, pointing down).
// Sends raw distance; the server owns mount height / calibration so you can recalibrate without reflashing.
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#include "mbedtls/md.h"

const char* WIFI_SSID = "YOUR_WIFI";       const char* WIFI_PASS = "YOUR_PASS";
const char* API_URL   = "https://YOUR_HOST/api/v1/ingest";
const char* DEVICE_ID = "fw-node-01";      const char* SECRET = "CHANGE_ME_32_BYTES";   // same as backend DEVICES
const int TRIG = 27, ECHO = 26;
const uint32_t NORMAL_MS = 30000, FAST_MS = 10000;                                      // speed up while water is rising
// For production pin the server CA: client.setCACert(ROOT_CA_PEM). setInsecure() is for the bench only.

float readDistanceCm() {                                   // median of 9 pings; JSN-SR04T needs >= 60 ms between pings
  float s[9]; int n = 0;
  for (int i = 0; i < 9; i++) {
    digitalWrite(TRIG, LOW); delayMicroseconds(4);
    digitalWrite(TRIG, HIGH); delayMicroseconds(12); digitalWrite(TRIG, LOW);
    unsigned long d = pulseIn(ECHO, HIGH, 30000UL);        // 30 ms timeout ~ 5 m
    if (d > 0) s[n++] = d * 0.0343f / 2.0f;                // 343 m/s; add temperature compensation if you have a probe
    delay(70);
  }
  if (n < 5) return -1;                                     // too many misses -> report nothing rather than garbage
  for (int i = 1; i < n; i++) { float k = s[i]; int j = i - 1; while (j >= 0 && s[j] > k) { s[j + 1] = s[j]; j--; } s[j + 1] = k; }
  return s[n / 2];
}

String hmacHex(const String& key, const String& msg) {
  uint8_t out[32]; mbedtls_md_context_t c; mbedtls_md_init(&c);
  mbedtls_md_setup(&c, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
  mbedtls_md_hmac_starts(&c, (const unsigned char*)key.c_str(), key.length());
  mbedtls_md_hmac_update(&c, (const unsigned char*)msg.c_str(), msg.length());
  mbedtls_md_hmac_finish(&c, out); mbedtls_md_free(&c);
  String h; char b[3]; for (int i = 0; i < 32; i++) { snprintf(b, 3, "%02x", out[i]); h += b; } return h;
}

void wifiUp() { if (WiFi.status() == WL_CONNECTED) return; WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(500); }

void setup() {
  Serial.begin(115200); pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);
  wifiUp(); configTime(0, 0, "pool.ntp.org", "time.google.com");                       // server rejects unsynced clocks (replay guard)
  while (time(nullptr) < 1700000000) delay(500);
}

float lastDist = -1;
void loop() {
  wifiUp();
  float d = readDistanceCm();
  uint32_t wait = NORMAL_MS;
  if (d > 0 && WiFi.status() == WL_CONNECTED) {
    long ts = (long)time(nullptr); char ds[16]; snprintf(ds, sizeof ds, "%.1f", d);   // MUST match server's f"{distance:.1f}"
    String sig = hmacHex(SECRET, String(DEVICE_ID) + "." + ts + "." + ds);
    String body = String("{\"device_id\":\"") + DEVICE_ID + "\",\"ts\":" + ts + ",\"distance_cm\":" + ds + ",\"sig\":\"" + sig + "\"}";
    WiFiClientSecure cli; cli.setInsecure(); HTTPClient http; http.begin(cli, API_URL);
    http.addHeader("Content-Type", "application/json"); int code = http.POST(body); http.end();
    Serial.printf("dist=%.1f cm -> HTTP %d\n", d, code);
    if (lastDist > 0 && (lastDist - d) > 2.0f) wait = FAST_MS;                          // distance shrinking = water rising
    lastDist = d;
  }
  delay(wait);
}
