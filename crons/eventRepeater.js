const cron = require("node-cron");
const watchParty = require("../database/helpers/watchparties");
const dayjs = require("dayjs");

module.exports = function initializeWatchPartyCron(client) {
  cron.schedule("*/10 * * * *", async () => {
    console.log("Checking for completed watch parties...");

    try {
      const repeatingParties = await watchParty.getAllRepeating();

      for (const party of repeatingParties) {
        if (party.paused) {
          console.log(`Skipping ${party.animeTitle} watch party due to pause.`);
          continue;
        }

        const currentTime = dayjs();
        const eventEndTime = dayjs(party.eventEndTime);

        if (currentTime.isAfter(eventEndTime)) {
          console.log(
            `Event for ${party.animeTitle} has ended, updating episode...`
          );

          await watchParty.updateEpisode(
            party.guildId,
            party.scheduledEventId,
            party.animeId,
            party.currentEpisode + 1
          );

          const nextEpisodeTime = dayjs().add(1, "week");
          const newEventStartTime = nextEpisodeTime
            .hour(party.time.split(":")[0])
            .minute(party.time.split(":")[1]);
          const newEventEndTime = newEventStartTime.add(
            parseDuration(party.duration),
            "minute"
          );

          const guild = client.guilds.cache.get(party.guildId);
          if (!guild) continue;

          await createPartyEvent(
            guild,
            party,
            newEventStartTime,
            newEventEndTime
          );
        }
      }
    } catch (err) {
      console.error("Error in watch party cron job:", err);
    }
  });
};

async function createPartyEvent(guild, party, startTime, endTime) {
  const { guildId, animeTitle, currentEpisode } = party;
  const channelId = process.env.WATCH_PARTY_CHANNEL_ID;
  const voiceChannel = guild.channels.cache.get(channelId);

  await guild.scheduledEvents.create({
    channel: voiceChannel,
    name: animeTitle,
    scheduledStartTime: startTime.toDate(),
    scheduledEndTime: endTime.toDate(),
    privacyLevel: 2,
    entityType: 2,
    description: `🎬 Episode ${currentEpisode + 1}`,
    entityMetadata: {
      location: "Online - Watch Party",
    },
    image: await fetchAndConvertImage(party.coverImage),
  });

  await watchParty.updatePartyEventTimes(
    guildId,
    party.scheduledEventId,
    startTime.toDate(),
    endTime.toDate()
  );
}

function parseDuration(durationStr) {
  if (durationStr.endsWith("h")) return parseInt(durationStr) * 60;
  if (durationStr.endsWith("m")) return parseInt(durationStr);
  if (!isNaN(durationStr)) return parseInt(durationStr);
  return 60;
}

const fetch = (...args) =>
  import("node-fetch").then((mod) => mod.default(...args));

async function fetchAndConvertImage(url) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
