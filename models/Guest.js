const mongoose = require("mongoose");

const GuestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  eventConfig: {
    date: { type: Date, required: true },
    locationName: { type: String, required: true },
    address: { type: String, required: true },
    mapUrl: { type: String, required: true },
  },
});

module.exports = mongoose.model("Guest", GuestSchema);
