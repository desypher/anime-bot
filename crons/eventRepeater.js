const cron = require("node-cron");
const watchParty = require("../database/helpers/watchparties");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

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

          // Safely parse hour and minute
          const [hourStr, minuteStr] = party.time.split(":");
          const hour = parseInt(hourStr, 10);
          const minute = parseInt(minuteStr, 10);

          // Schedule next episode for the same time next week
          const nextEpisodeTime = dayjs()
            .add(1, "week")
            .hour(hour)
            .minute(minute)
            .second(0);
          const newEventStartTime = nextEpisodeTime;
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
  cron.schedule("*/10 * * * *", async () => {
    console.log("Checking notifications that need to go out...");

    try {
      const parties = await watchParty.getPartiesByGuild(process.env.GUILD_ID);

      for (const party of parties) {
        if (party.paused) {
          console.log(`Skipping ${party.animeTitle} watch party due to pause.`);
          continue;
        }

        const currentTime = dayjs();

        const startTime = dayjs(party.eventStartTime);
        const minutesUntilStart = startTime.diff(currentTime, "minute");
        if (
          minutesUntilStart <= 15 &&
          minutesUntilStart >= 0 &&
          !party.notified
        ) {
          const guild = client.guilds.cache.get(party.guildId);
          if (!guild) continue;

          const textChannel = guild.channels.cache.get(
            process.env.WATCH_PARTY_TEXT_CHANNEL_ID
          );
          const roleId = process.env.WATCH_PARTY_ROLE_ID;
          if (textChannel) {
            await textChannel.send({
              content: `🎉 The watch party for **${party.animeTitle} - Episode ${party.currentEpisode}** is starting soon! See you in <#${process.env.WATCH_PARTY_CHANNEL_ID}> <@&${roleId}>`,
            });

            await watchParty.setNotified(party.guildId, party.scheduledEventId);
          }
        }
      }
    } catch (err) {
      console.error("Error in watch party notification cron job:", err);
    }
  });
};

async function createPartyEvent(guild, party, startTime, endTime) {
  const { guildId, animeTitle, currentEpisode } = party;
  const channelId = process.env.WATCH_PARTY_CHANNEL_ID;
  const voiceChannel = guild.channels.cache.get(channelId);

  const scheduledEvent = await guild.scheduledEvents.create({
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

  await watchParty.updatePartyEvent(
    guildId,
    party.scheduledEventId,
    scheduledEvent.id,
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
