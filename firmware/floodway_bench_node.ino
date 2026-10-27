// FloodWay bench node (Nadi) - ESP32 + HC-SR04 + 20x4 I2C LCD + 3 LEDs + buzzer, over a demo cup (8 cm deep).
// No WiFi: each reading goes out over Bluetooth Classic (and USB Serial) as "pct,STATUS,distance_cm",
// e.g. "57,WARNING,4.0". On the laptop, scripts/bench_bridge.py reads that COM port and forwards the distance to
// FloodWay /api/v1/ingest as device fw-bench-01 (see backend/app/config.py). The local LEDs, LCD and siren work
// on their own, with or without the laptop.
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "BluetoothSerial.h"

BluetoothSerial SerialBT;
LiquidCrystal_I2C lcd(0x27, 20, 4);

const int trigPin = 25;
const int echoPin = 26;
const int buzzerPin = 13;
const int redLedPin = 27;    // Alert / Danger LED
const int yellowLedPin = 12; // Warning LED
const int greenLedPin = 14;  // Safe / Normal LED

const float EMPTY_DISTANCE = 8.0;  // sensor to cup bottom (cm); same as the server's mount_height_cm
const float FULL_DISTANCE  = 1.0;
// Water height (cm) at which the status changes. Same as the server's warning_threshold_m 0.03 and
// danger_threshold_m 0.05, so the cup and the web app agree (about 43% and 71% of the cup).
const float WARNING_WATER_CM = 3.0;
const float DANGER_WATER_CM  = 5.0;

// Median of 5 pings. pulseIn needs a timeout: a missed echo returns 0, which used to read as a full cup and fire
// the siren. Returns -1 when too many pings miss, so the loop skips the reading instead of alarming on garbage.
float readDistanceCm() {
  float s[5]; int n = 0;
  for (int i = 0; i < 5; i++) {
    digitalWrite(trigPin, LOW); delayMicroseconds(2);
    digitalWrite(trigPin, HIGH); delayMicroseconds(10); digitalWrite(trigPin, LOW);
    unsigned long d = pulseIn(echoPin, HIGH, 30000UL);   // 30 ms timeout ~ 5 m
    if (d > 0) s[n++] = d * 0.0343f / 2.0f;
    delay(60);                                           // HC-SR04 needs ~60 ms between pings
  }
  if (n < 3) return -1;
  for (int i = 1; i < n; i++) { float k = s[i]; int j = i - 1; while (j >= 0 && s[j] > k) { s[j + 1] = s[j]; j--; } s[j + 1] = k; }
  return s[n / 2];
}

void playSharpAlert() {
  for (int i = 0; i < 4; i++) {
    tone(buzzerPin, 3700);
    delay(60);
    tone(buzzerPin, 2700);
    delay(60);
  }
  noTone(buzzerPin);
}

void setLeds(bool green, bool yellow, bool red) {
  digitalWrite(greenLedPin, green);
  digitalWrite(yellowLedPin, yellow);
  digitalWrite(redLedPin, red);
}

void setup() {
  Serial.begin(115200);
  SerialBT.begin("FloodWay-IoT-Node");   // the name shown when pairing in Windows Bluetooth settings

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(redLedPin, OUTPUT);
  pinMode(yellowLedPin, OUTPUT);
  pinMode(greenLedPin, OUTPUT);

  Wire.begin(32, 33);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("IoT Water Monitor");
}

void loop() {
  float distance = readDistanceCm();
  if (distance < 0) {                                    // no echo: keep the last LEDs, send nothing
    Serial.println("# no echo");                         // '#' lines are ignored by the bridge
    lcd.setCursor(0, 3); lcd.print("Sensor: no echo     ");
    delay(200);
    return;
  }

  float clamped = constrain(distance, FULL_DISTANCE, EMPTY_DISTANCE);
  float waterCm = EMPTY_DISTANCE - clamped;
  int percentage = round(waterCm / (EMPTY_DISTANCE - FULL_DISTANCE) * 100.0);

  String statusStr;
  if (waterCm >= DANGER_WATER_CM) statusStr = "DANGER";
  else if (waterCm >= WARNING_WATER_CM) statusStr = "WARNING";
  else statusStr = "SAFE";

  // --- Bluetooth + USB line for the bridge: "pct,STATUS,distance_cm" ---
  String line = String(percentage) + "," + statusStr + "," + String(clamped, 1);
  SerialBT.println(line);
  Serial.println(line);

  // --- LCD ---
  lcd.setCursor(0, 1);
  lcd.print("Status: " + statusStr + "    ");
  lcd.setCursor(0, 2);
  lcd.print("Level: " + String(percentage) + "%   ");
  lcd.setCursor(0, 3);
  lcd.print(SerialBT.hasClient() ? "Bluetooth: linked   " : "Bluetooth: waiting  ");

  // --- LEDs and buzzer ---
  if (statusStr == "SAFE") {
    setLeds(HIGH, LOW, LOW);
    noTone(buzzerPin);
    delay(200);
  } else if (statusStr == "WARNING") {
    setLeds(LOW, HIGH, LOW);
    noTone(buzzerPin);
    delay(200);
  } else {
    setLeds(LOW, LOW, HIGH);
    playSharpAlert();
    delay(150);
  }
}
