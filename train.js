import natural from "natural";
import fs from "fs";
import csv from "csv-parser";

const classifier = new natural.BayesClassifier();

// Store only EXPENSES for category prediction
fs.createReadStream("expense_dataset.csv")
  .pipe(csv())
  .on("data", (row) => {
    const type = row.type?.toLowerCase();

    // We only train on expense classification (important!)
    if (type === "expense" || type === "income") {
      const description = row.description.toLowerCase();
      const category = row.category;

      classifier.addDocument(description, category);
    }
  })
  .on("end", () => {
    console.log("Training model...");

    classifier.train();

    console.log("Model trained ✅");

    // Save model for reuse
    classifier.save("expense-model.json", (err) => {
      if (err) console.error(err);
      else console.log("Model saved successfully 💾");
    });

    // Test predictions
    const tests = [
      "paid internet bill",
      "uber ride to office",
      "had momo at cafe",
      "bought clothes from daraz",
      "movie ticket at QFX",
      "electricity bill payment",
      "monthly salary"
      
    ];

    console.log("\nTesting predictions:\n");

    tests.forEach((t) => {
      console.log(`${t} → ${classifier.classify(t)}`);
    });
  });