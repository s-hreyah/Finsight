import fs from "fs";
import csv from "csv-parser";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
// import firebaseConfig from './firebase-applet-config.json';
interface CsvRow {
  type?: string;
  description?: string;
  category?: string;
}
const firebaseConfig = {
  "apiKey": "AIzaSyB0U49WJlyAWp-UwwR8PBxe4_g4wIrlbPo",
  "authDomain": "finsight-38094.firebaseapp.com",
  "projectId": "finsight-38094",
  "storageBucket": "finsight-38094.firebasestorage.app",
  "messagingSenderId": "350956687593",
  "appId": "1:350956687593:web:5705d696d15746056b2078",
  "measurementId": "G-B088ZQ787V"
}
const results: CsvRow[] = [];
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

fs.createReadStream("expense_dataset.csv")
  .pipe(csv())
  .on("data", (row: CsvRow) => {
    results.push(row);
  })
  .on("end", async () => {
    console.log("CSV loaded ✔");

    for (const row of results) {
      try {
        const docData = {
          type: row.type?.toLowerCase().trim(),
          description: row.description?.toLowerCase().trim(),
          category: row.category?.toLowerCase().trim(),
          createdAt: serverTimestamp(),
        };

        // skip invalid rows
        if (!docData.type || !docData.description || !docData.category) {
          continue;
        }

        await addDoc(collection(db, "historical_data"), docData);
      } catch (err) {
        console.error("Error inserting row:", err);
      }
    }

    console.log("🔥 Historical data imported successfully!");
  });