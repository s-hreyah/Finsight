// import express from "express";
// import cors from "cors";
import natural from "natural";

// const app = express();
// app.use(cors());
// app.use(express.json());

let classifier = null;

// Load model once
natural.BayesClassifier.load(
    "expense-model.json",
    null,
    (err, loaded) => {
        if (err) console.error(err);
        classifier = loaded;
        console.log("Model loaded ✅");
        console.log("monthly salary ko category: ", classifier.classify("monthly salary"))

    }
);

// // Single prediction
// app.post("/categorize", (req, res) => {
//   if (!classifier) {
//     return res.status(500).json({ error: "Model not loaded yet" });
//   }

//   const { description } = req.body;

//   const result = classifier.classify(description.toLowerCase().trim());

//   res.json({ category: result });
// });

// // Batch prediction
// app.post("/categorize-batch", (req, res) => {
//   if (!classifier) {
//     return res.status(500).json({ error: "Model not loaded yet" });
//   }

//   const { descriptions } = req.body;

//   const results = descriptions.map((d) =>
//     classifier.classify(d.toLowerCase().trim())
//   );

//   res.json({ categories: results });
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000 🚀");
// }); 

//   const  descriptions  = ["monthly salary"];

//   const results = descriptions.map((d) =>
//     classifier.classify(d.toLowerCase().trim())
//   );
//   console.log("result", results)
