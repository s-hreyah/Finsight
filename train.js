import natural from "natural";
import fs from "fs";

import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
// import firebaseConfig from './firebase-applet-config.json';
const firebaseConfig = {
  "apiKey": "AIzaSyB0U49WJlyAWp-UwwR8PBxe4_g4wIrlbPo",
  "authDomain": "finsight-38094.firebaseapp.com",
  "projectId": "finsight-38094",
  "storageBucket": "finsight-38094.firebasestorage.app",
  "messagingSenderId": "350956687593",
  "appId": "1:350956687593:web:5705d696d15746056b2078",
  "measurementId": "G-B088ZQ787V"
}


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const classifier = new natural.BayesClassifier();

const trainModel = async () => {
  try {
    console.log("📥 Fetching historical data...");

    const snapshot = await getDocs(collection(db, "transactions"));

    if (snapshot.empty) {
      console.log("⚠️ No training data found");
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (!data.description || !data.category) return;

      const description = data.description.toLowerCase();
      const category = data.category;

      classifier.addDocument(description, category);
    });

    console.log("🧠 Training model...");

    classifier.train();

    console.log("✅ Model trained");

    classifier.save("expense-model.json", (err) => {
      if (err) console.error(err);
      else console.log("💾 Model saved");
    });

  } catch (err) {
    console.error("❌ Training error:", err);
  }
};

export default trainModel;