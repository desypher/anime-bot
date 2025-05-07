const db = require("../../db");
const mongoose = require("mongoose");
const CurrentAnime = require("../scheme/CurrentAnime");

async function setCurrent(guildId, animeId, animeTitle, currentEpisode = 1) {
  if (db.isMongo()) {
    return await CurrentAnime.findOneAndUpdate(
      { guildId },
      { animeId, animeTitle, currentEpisode },
      { upsert: true, new: true }
    );
  } else {
    const [existing] = await db.mysqlPool.execute(
      "SELECT id FROM current_anime WHERE guildId = ?",
      [guildId]
    );

    if (existing.length > 0) {
      await db.mysqlPool.execute(
        "UPDATE current_anime SET animeId = ?, animeTitle = ?, currentEpisode = ? WHERE guildId = ?",
        [animeId, animeTitle, currentEpisode, guildId]
      );
    } else {
      await db.mysqlPool.execute(
        "INSERT INTO current_anime (guildId, animeId, animeTitle, currentEpisode) VALUES (?, ?, ?, ?)",
        [guildId, animeId, animeTitle, currentEpisode]
      );
    }
  }
}

async function getCurrent(guildId) {
  if (db.isMongo()) {
    return await CurrentAnime.findOne({ guildId });
  } else {
    if (!db.mysqlPool) throw new Error("MySQL pool not initialized");

    const [rows] = await db.mysqlPool.execute(
      "SELECT * FROM current_anime WHERE guildId = ? LIMIT 1",
      [guildId]
    );
    return rows[0] || null;
  }
}

async function setEpisode(guildId, episodeNumber) {
  if (db.isMongo()) {
    return await CurrentAnime.findOneAndUpdate(
      { guildId },
      { currentEpisode: episodeNumber },
      { new: true }
    );
  } else {
    await db.mysqlPool.execute(
      "UPDATE current_anime SET currentEpisode = ? WHERE guildId = ?",
      [episodeNumber, guildId]
    );
  }
}

module.exports = {
  setCurrent,
  getCurrent,
  setEpisode,
};
