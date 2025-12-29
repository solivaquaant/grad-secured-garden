require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const Guest = require("./models/Guest");
const Message = require("./models/Message");

const app = express();

// Middleware configuration
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Authenticate guest by name and return event configuration
app.post("/api/login", async (req, res) => {
  const { name } = req.body;

  try {
    const guest = await Guest.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (guest) {
      res.json({
        success: true,
        guestName: guest.name,
        eventConfig: guest.eventConfig,
      });
    } else {
      res.status(401).json({ success: false, message: "Guest not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a new message from a guest
app.post("/api/message", async (req, res) => {
  const { guestName, content } = req.body;

  try {
    const newMessage = new Message({ guestName, content });
    await newMessage.save();
    res.json({ success: true, message: "Message saved" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Retrieve all messages sorted by timestamp
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find({}, "content").sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
