import express from "express";
import cors from "cors";
import natural from "natural";
import trainModel from "./train.js";

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
app.use(express.json());

let classifier = null;

// Load model once
natural.BayesClassifier.load(
  "expense-model.json",
  null,
  (err, loaded) => {
    if (err) console.error(err);
    classifier = loaded;
    console.log("Model loaded ✅");
  }
);

// Single prediction
app.post("/categorize", (req, res) => {
  if (!classifier) {
    return res.status(500).json({ error: "Model not loaded yet" });
  }

  const { description } = req.body;

  const result = classifier.classify(description.toLowerCase().trim());

  res.json({ category: result });
});

// Batch prediction
app.post("/categorize-batch", (req, res) => {
  if (!classifier) {
    return res.status(500).json({ error: "Model not loaded yet" });
  }

  const { descriptions } = req.body;

  const results = descriptions.map((d) =>
    classifier.classify(d.toLowerCase().trim())
  );
  res.json({ categories: results });
});



app.post("/train", async (req, res) => {
  try {
    await trainModel();

    const loaded = await new Promise((resolve, reject) => {
      natural.BayesClassifier.load("expense-model.json", null, (err, model) => {
        if (err) reject(err);
        else resolve(model);
      });
    });

    classifier = loaded;

    res.send("trained + reloaded");
  } catch (err) {
    console.error(err);
    res.status(500).send("training failed");
  }
});

app.listen(5000, () => console.log("Server running on port 5000 🚀"));
