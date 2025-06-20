import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAwLOoiZl1hFzpMsy7AN9VBXB9u_b8xw0s",
  authDomain: "esiot-project-c1fad.firebaseapp.com",
  databaseURL: "https://esiot-project-c1fad-default-rtdb.firebaseio.com",
  projectId: "esiot-project-c1fad",
  storageBucket: "esiot-project-c1fad.firebasestorage.app",
  messagingSenderId: "923285177939",
  appId: "1:923285177939:web:9e7ed389deb859572368a6",
  measurementId: "G-MY23YZFEMF"
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };