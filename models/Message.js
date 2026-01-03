const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  content: { type: String },
  bouquetImage: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);
