const mongoose = require('mongoose');

const currentAnimeSchema = new mongoose.Schema({
  guildId: String,
  animeId: Number,
  animeTitle: String,
  currentEpisode: Number
});

module.exports = mongoose.model('CurrentAnime', currentAnimeSchema);
