require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const Guest = require("./models/Guest");
const Message = require("./models/Message");
const HuntResult = require("./models/HuntResult");

const app = express();

// Middleware configuration
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Security middleware to prevent direct access to .js and .css files
app.use((req, res, next) => {
  const path = req.path;

  // Allow only specific pages to be accessed directly
  const allowedPages = ["/", "/index.html", "/hunt.html", "/guestbook.html"];
  if (allowedPages.includes(path)) {
    return next();
  }

  // Check Sec-Fetch-Dest header
  const fetchDest = req.get("Sec-Fetch-Dest");
  if (
    (path.endsWith(".js") || path.endsWith(".css")) &&
    fetchDest === "document"
  ) {
    return res.redirect("/");
  }

  next();
});

app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// Secret flags list
const SECRET_FLAGS = [
  "FLAG_01_SPIN_THE_MEMORY",
  "FLAG_02_STILL_MOMENT",
  "FLAG_03_LOVE_FOUND",
  "FLAG_04_FLOWER_POWER",
  "FLAG_05_UIT_PRIDE",
  "FLAG_06_GRAD_FLIGHT",
  "FLAG_07_HTTP_MASTER",
  "FLAG_08_MISTAKE_MAKER",
];

// Secret flags mapping
const SECRET_MAP = {
  VINYL_SPIN: {
    flag: "FLAG_01_SPIN_THE_MEMORY",
  },
  PORTRAIT_STILL: {
    flag: "FLAG_02_STILL_MOMENT",
  },
  LOVE_KEYWORD: {
    flag: "FLAG_03_LOVE_FOUND",
  },
  FLOWER_POWER: {
    flag: "FLAG_04_FLOWER_POWER",
  },
  UIT_COMBO: {
    flag: "FLAG_05_UIT_PRIDE",
  },
  GRAD_CAP: {
    flag: "FLAG_06_GRAD_FLIGHT",
  },
};

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
  const { guestName, content, bouquetImage } = req.body;

  try {
    const newMessage = new Message({ guestName, content, bouquetImage });
    await newMessage.save();
    res.json({ success: true, message: "Message saved" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Retrieve all messages that have content, sorted by timestamp
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find(
      {
        content: {
          $exists: true,
          $ne: null,
          $not: /^\s*$/,
        },
      },
      "content"
    ).sort({ timestamp: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Claim secret easter egg
app.post("/api/hunt/claim-secret", async (req, res) => {
  const { action, nickname } = req.body;
  if (!SECRET_MAP[action]) {
    return res.status(400).json({ success: false, message: "Invalid action." });
  }
  const secret = SECRET_MAP[action];
  res.json({
    success: true,
    flag: secret.flag,
    message: secret.msg,
  });
});

// Submit found easter egg flag
app.post("/api/hunt/submit", async (req, res) => {
  const { nickname, flag } = req.body;
  if (!nickname)
    return res.status(400).json({ message: "Missing guest's name" });
  if (!SECRET_FLAGS.includes(flag)) {
    return res.status(400).json({
      isEaster: true,
      flag: "FLAG_08_MISTAKE_MAKER",
      message:
        "Incorrect code! But in this garden, even mistakes bloom into secrets. Here is your consolation prize:",
    });
  }

  try {
    let result = await HuntResult.findOne({ nickname });
    if (!result) {
      result = new HuntResult({ nickname, foundFlags: [flag] });
    } else {
      if (result.foundFlags.includes(flag)) {
        return res
          .status(400)
          .json({ message: "You have already submitted this flag!" });
      }
      result.foundFlags.push(flag);
      result.completionTime = Date.now();
    }
    await result.save();
    res.json({
      success: true,
      message: "Congratulations! You have found a piece of memory.",
      total: result.foundFlags.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.all("/api/hunt/leaderboard", async (req, res) => {
  if (req.method !== "GET") {
    return res.status(200).json({
      isEaster: true,
      flag: "FLAG_07_HTTP_MASTER",
      message: "Curiosity didn't kill the cat",
    });
  }

  try {
    const board = await HuntResult.find()
      .sort({ "foundFlags.length": -1, completionTime: 1 })
      .limit(10);
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Catch-all route to redirect unknown paths to home page
app.get("*path", (req, res) => {
  const currentPath = req.path;
  if (req.method === "GET" && !currentPath.startsWith("/api/")) {
    const rootPages = ["/", "/index.html"];
    if (rootPages.includes(currentPath)) {
      return res
        .status(404)
        .send("Error: index.html not found in public folder.");
    }
    return res.redirect("/");
  }
  res.status(404).json({ message: "Not found" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
