const mongoose = require("mongoose");

const WatchPartySchema = new mongoose.Schema({
  guildId: String,
  animeId: String,
  animeTitle: String,
  coverImage: String,
  currentEpisode: Number,
  season: String,
  day: String,
  time: String,
  duration: String,
  repeat: Boolean,
  paused: { type: Boolean, default: false },
  eventStartTime: { type: Date, default: null },
  eventEndTime: { type: Date, default: null },
  scheduledEventId: { type: String, default: null },
});

module.exports = mongoose.model("WatchParty", WatchPartySchema);
