#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <SPI.h>
#include <MFRC522.h>

// Wi-Fi credentials
#define WIFI_SSID "Raghul"
#define WIFI_PASSWORD "12344321"

// Firebase credentials
#define API_KEY "AIzaSyAwLOoiZl1hFzpMsy7AN9VBXB9u_b8xw0s"
#define DATABASE_URL "https://esiot-project-c1fad-default-rtdb.firebaseio.com/"

// Firebase authentication
#define USER_EMAIL "raghulraghul55008@gmail.com"
#define USER_PASSWORD "Raghul@2005"

// RFID setup
#define SS_PIN D2
#define RST_PIN D1

MFRC522 rfid(SS_PIN, RST_PIN);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

String currentBookID = "";
bool waitingForStudent = false;
int transactionCount = 1;

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.RTDB.getInt(&fbdo, "/transaction_counter")) {
    transactionCount = fbdo.intData() + 1;
  } else {
    Firebase.RTDB.setInt(&fbdo, "/transaction_counter", 1);
  }
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String scannedID = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    scannedID += String(rfid.uid.uidByte[i], HEX);
  }
  scannedID.toUpperCase();
  Serial.println("Scanned ID: " + scannedID);

  if (!waitingForStudent) {
    currentBookID = scannedID;
    toggleBookAvailability(currentBookID);
    Serial.println("Now scan Student ID...");
    waitingForStudent = true;
  } else {
    logTransaction(scannedID);
    waitingForStudent = false;
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

void toggleBookAvailability(String bookID) {
  String path = "books/" + bookID + "/available";
  bool available = false;

  if (Firebase.RTDB.getBool(&fbdo, path)) {
    available = fbdo.boolData();
    available = !available;
    Firebase.RTDB.setBool(&fbdo, path, available);
  } else {
    FirebaseJson bookJson;
    bookJson.set("title", getBookTitle(bookID));
    bookJson.set("available", false);
    Firebase.RTDB.updateNode(&fbdo, ("books/" + bookID).c_str(), &bookJson);
  }
}

void logTransaction(String studentID) {
  String bookPath = "books/" + currentBookID + "/available";
  bool isAvailable = true;

  if (Firebase.RTDB.getBool(&fbdo, bookPath)) {
    isAvailable = fbdo.boolData();
  }

  String action = isAvailable ? "returned" : "borrowed";
  unsigned long timestamp = millis();

  String txnPath = "transactions/book_borr" + String(transactionCount);
  FirebaseJson txnJson;
  txnJson.set("studentID", studentID);
  txnJson.set("bookID", currentBookID);
  txnJson.set("timestamp", timestamp);
  txnJson.set("action", action);
  Firebase.RTDB.updateNode(&fbdo, txnPath, &txnJson);

  // Update student
  if (Firebase.RTDB.getString(&fbdo, "students/" + studentID + "/name")) {
    if (action == "borrowed") {
      Firebase.RTDB.setString(&fbdo, "students/" + studentID + "/borrowedBookID", currentBookID);
    } else {
      Firebase.RTDB.deleteNode(&fbdo, "students/" + studentID + "/borrowedBookID");
    }
  } else {
    FirebaseJson studentJson;
    studentJson.set("name", getStudentName(studentID));
    studentJson.set("phone", getStudentPhone(studentID));
    studentJson.set("borrowedBookID", currentBookID);
    Firebase.RTDB.updateNode(&fbdo, ("students/" + studentID).c_str(), &studentJson);
  }

  Firebase.RTDB.setInt(&fbdo, "/transaction_counter", transactionCount);
  transactionCount++;
  Serial.println("Transaction logged: " + action);
}

String getBookTitle(String id) {
  if (id == "06DC4103") return "Physics";
  if (id == "8C144B01") return "Chemistry";
  if (id == "53FAE52C") return "Maths";
  if (id == "47CE4701") return "Biology";
  return "Unknown Book";
}

String getStudentName(String id) {
  if (id == "2D904102") return "Yuvaraj U";
  if (id == "D7E74A01") return "Shaurav Vikas G";
  return "Student " + id;
}

String getStudentPhone(String id) {
  if (id == "2D904102") return "+918015661073";
  if (id == "D7E74A01") return "+91934520297";
  return "N/A";
}
