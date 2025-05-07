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
      scheduledEventId,
      eventStartTime,
      eventEndTime,
    } = data;

    const [result] = await db.mysqlPool.execute(
      `
      INSERT INTO watch_parties
      (guildId, animeId, animeTitle, coverImage, currentEpisode, season, day, time, duration, \`repeat\`, scheduledEventId, eventStartTime, eventEndTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        scheduledEventId,
        eventStartTime,
        eventEndTime,
      ]
    );

    return { id: result.insertId, ...data };
  }
}

async function getPartiesByGuild(guildId) {
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

async function updateEpisode(guildId, scheduledEventId, animeId, nextEpisode) {
  if (db.isMongo()) {
    return await WatchParty.updateOne(
      { guildId, animeId },
      { $set: { currentEpisode: nextEpisode } }
    );
  } else {
    await db.mysqlPool.execute(
      "UPDATE watch_parties SET currentEpisode = ? WHERE guildId = ? AND scheduledEventId = ? AND animeId = ? ",
      [nextEpisode, guildId, scheduledEventId, animeId]
    );
  }
}

async function updateParty(guildId, updateData) {
  if (db.isMongo()) {
    return await WatchParty.findOneAndUpdate({ guildId }, updateData, {
      new: true,
    });
  } else {
    const { paused } = updateData;
    const [result] = await db.mysqlPool.execute(
      "UPDATE watch_parties SET paused = ? WHERE guildId = ?",
      [paused, guildId]
    );
    return result;
  }
}

async function getPartyById(partyId) {
  if (db.isMongo()) {
    // Find the party by its MongoDB _id
    return await WatchParty.findById(partyId);
  } else {
    // MySQL query to fetch the party by ID
    const [rows] = await db.mysqlPool.execute(
      "SELECT * FROM watch_parties WHERE id = ?",
      [partyId]
    );
    return rows[0] || null; // Return the first row or null if not found
  }
}

async function getAllRepeating() {
  if (db.isMongo()) {
    // Find all parties where the 'repeat' field is true
    return await WatchParty.find({ repeat: true });
  } else {
    // MySQL query to fetch all repeating watch parties
    const [rows] = await db.mysqlPool.execute(
      "SELECT * FROM watch_parties WHERE `repeat` = 1"
    );
    return rows || []; // Return the rows or an empty array if no repeating parties are found
  }
}

async function updatePartyEventTimes(
  guildId,
  scheduledEventId,
  startTime,
  endTime
) {
  if (db.isMongo()) {
    await WatchParty.findOneAndUpdate(
      { guildId },
      {
        eventStartTime: startTime,
        eventEndTime: endTime,
      }
    );
  } else {
    await db.mysqlPool.execute(
      `UPDATE watch_parties SET eventStartTime = ?, eventEndTime = ? WHERE guildId = ? AND scheduledEventId = ?`,
      [startTime, endTime, guildId, scheduledEventId]
    );
  }
}

module.exports = {
  createParty,
  getPartiesByGuild,
  deleteParty,
  updateEpisode,
  updateParty,
  getPartyById,
  getAllRepeating,
  updatePartyEventTimes,
};
