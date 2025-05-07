const db = require("../../db");
const mongoose = require("mongoose");
const WatchParty = require("../scheme/WatchParty"); // Mongoose model

async function createParty(data) {
  if (db.isMongo()) {
    return await WatchParty.create(data);
  } else {
    const {
      guildId,
      animeId,
      animeTitle,
      coverImage,
      currentEpisode,
      season,
      day,
      time,
      duration,
      repeat,
    } = data;

    const [result] = await db.mysqlPool.execute(
      `
      INSERT INTO watch_parties
      (guildId, animeId, animeTitle, coverImage, currentEpisode, season, day, time, duration, \`repeat\`)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        guildId,
        animeId,
        animeTitle,
        coverImage,
        currentEpisode,
        season,
        day,
        time,
        duration,
        repeat,
      ]
    );

    return { id: result.insertId, ...data };
  }
}

async function getPartyByGuild(guildId) {
  if (db.isMongo()) {
    return await WatchParty.findOne({ guildId });
  } else {
    const [rows] = await db.mysqlPool.execute(
      "SELECT * FROM watch_parties WHERE guildId = ? ORDER BY createdAt DESC",
      [guildId]
    );
    return rows || null;
  }
}

async function deleteParty(selectedId) {
  if (db.isMongo()) {
    return await WatchParty.deleteOne({ _id: selectedId });
  } else {
    const [result] = await db.mysqlPool.execute(
      "DELETE FROM watch_parties WHERE id = ?",
      [selectedId]
    );
    return result;
  }
}

module.exports = {
  createParty,
  getPartyByGuild,
  deleteParty,
};
