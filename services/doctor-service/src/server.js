const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Doctor Service Running...");
});

const PORT = process.env.PORT || 5003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected (Doctor Service)");
    app.listen(PORT, () => {
      console.log(`Doctor Service running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));