const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Notification Service Running...");
});

app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5010;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected (Notification Service)");
    app.listen(PORT, () => {
      console.log(`Notification Service running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));