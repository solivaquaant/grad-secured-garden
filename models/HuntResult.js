const mongoose = require("mongoose");

const huntResultSchema = new mongoose.Schema({
  nickname: { type: String, required: true, unique: true },
  foundFlags: [String],
  completionTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HuntResult", huntResultSchema);
