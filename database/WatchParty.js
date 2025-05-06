const mongoose = require('mongoose');

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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WatchParty', WatchPartySchema);