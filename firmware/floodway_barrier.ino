// FloodWay bench barrier - ESP32 + SG90 servo + red/green LEDs. BENCH PROTOTYPE ONLY: it models an underpass barrier
// arm on a desk. It polls the backend for one simulated barrier and moves the arm to match. It never drives a real road
// barrier, and a real one needs a certified controller, a fail-safe position and a manual override on site.
//
// Pair it with floodway_node.ino posting as fw-node-03 (or the Klang sample camera) to show the whole loop:
// water reaches DANGER -> backend closes B-02 -> this arm drops -> the map stops routing through the underpass.
#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>

const char* WIFI_SSID = "YOUR_WIFI";       const char* WIFI_PASS = "YOUR_PASS";
const char* STATE_URL = "http://YOUR_HOST:8080/api/v1/vision/barriers/B-02";  // read-only, no token needed
const int SERVO_PIN = 18, LED_RED = 25, LED_GREEN = 26;
const int ARM_UP = 90, ARM_DOWN = 0;        // degrees
const uint32_t POLL_MS = 2000;
const uint32_t STALE_MS = 15000;            // no answer for this long -> fail safe (arm down, red blinking)

Servo arm;
uint32_t lastOk = 0;
bool closed = false;

void show(bool isClosed, bool stale) {
  arm.write(isClosed ? ARM_DOWN : ARM_UP);
  digitalWrite(LED_GREEN, (!isClosed && !stale) ? HIGH : LOW);
  digitalWrite(LED_RED, isClosed ? HIGH : (stale ? (millis() / 300) % 2 : LOW));
}

void setup() {
  pinMode(LED_RED, OUTPUT); pinMode(LED_GREEN, OUTPUT);
  arm.attach(SERVO_PIN);
  show(true, true);                         // start closed until the server answers: safe by default
  WiFi.begin(WIFI_SSID, WIFI_PASS);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(STATE_URL);
    if (http.GET() == 200) {
      String body = http.getString();       // {"id":"B-02",...,"state":"CLOSED",...}
      closed = body.indexOf("\"state\":\"CLOSED\"") >= 0;
      lastOk = millis();
    }
    http.end();
  }
  bool stale = millis() - lastOk > STALE_MS;
  show(stale ? true : closed, stale);       // lost the server: close and blink, never stay open blind
  delay(POLL_MS);
}
