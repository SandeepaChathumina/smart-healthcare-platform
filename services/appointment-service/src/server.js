const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Appointment Service Running...");
});

const PORT = process.env.PORT || 5004;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected (Appointment Service)");
    app.listen(PORT, () => {
      console.log(`Appointment Service running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));