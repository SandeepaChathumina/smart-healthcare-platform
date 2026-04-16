const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const symptomRoutes = require("./routes/symptomRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Symptom Checker Service Running...");
});

app.use("/api/symptoms", symptomRoutes);

const PORT = process.env.PORT || 5020;

app.listen(PORT, () => {
  console.log(`AI Symptom Checker Service running on port ${PORT}`);
});