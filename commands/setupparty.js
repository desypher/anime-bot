const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const { gql } = require("graphql-tag");
const currentAnime = require("../database/helpers/currentAnime");
const watchParty = require("../database/helpers/watchparties");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { fetchFromAniList } = require("../utils/anilist");
const { stripHtml } = require("../utils/stripHtml");

dayjs.extend(utc);
dayjs.extend(timezone);

const searchAnimeQuery = gql`
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      id
      title {
        romaji
        english
      }
      coverImage {
        large
      }
      description(asHtml: false)
    }
  }
`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setupparty")
    .setDescription("Create a new anime watch party")
    .setDefaultMemberPermissions("0")
    .addStringOption((opt) =>
      opt
        .setName("day")
        .setDescription("Day of the week (e.g., Friday)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("time").setDescription("Time (e.g., 20:00)").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("duration")
        .setDescription("Duration (e.g., 2h)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Anime title").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("episode")
        .setDescription("Start at episode number")
        .setRequired(true)
    )
    .addBooleanOption((opt) =>
      opt.setName("repeat").setDescription("Repeat weekly?").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("season")
        .setDescription("Season number (optional)")
        .setRequired(false)
    ),
  async execute(interaction) {
    const allowedRoleId = process.env.WATCH_PARTY_HOST_ROLE_ID;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ Only Watch Party Hosts can use this command.",
      });
    }

    const day = interaction.options.getString("day");
    const time = interaction.options.getString("time");
    const duration = interaction.options.getString("duration");
    const title = interaction.options.getString("title");
    const season = interaction.options.getInteger("season") || null;
    const episode = interaction.options.getInteger("episode");
    const repeat = interaction.options.getBoolean("repeat");
    const guild = interaction.guild;
    const guildId = interaction.guildId;

    try {
      const animeData = await fetchFromAniList(searchAnimeQuery, {
        search: title,
      });
      const anime = animeData.Media;

      const description = `📖 ${
        stripHtml(anime.description)?.substring(0, 800) ||
        "No synopsis available."
      }
        🎬 Episode ${episode}${season ? ` • Season: ${season}` : ""}`;

      if (!anime) {
        return interaction.editReply("❌ Anime not found.");
      }

      // Set current anime if not already set
      const existing = await currentAnime.getCurrent(interaction.guildId);
      if (!existing) {
        await currentAnime.setCurrent(interaction.guildId, {
          guildId,
          animeId: anime.id,
          title: anime.title.romaji || anime.title.english,
          episode,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🎉 Watch Party Scheduled`)
        .setDescription(`**${anime.title.romaji || anime.title.english}**`)
        .addFields(
          { name: "📅 Day", value: day, inline: true },
          { name: "🕗 Time", value: time, inline: true },
          { name: "⏱ Duration", value: duration, inline: true },
          { name: "🎞 Episode", value: `Episode ${episode}`, inline: true },
          {
            name: "🔁 Repeats Weekly",
            value: repeat ? "Yes" : "No",
            inline: true,
          },
          ...(season
            ? [{ name: "📺 Season", value: `Season ${season}`, inline: true }]
            : [])
        )
        .setImage(anime.coverImage.large)
        .setColor("Purple");

      await interaction.editReply({ embeds: [embed] });

      const dayMapping = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };

      const now = dayjs();
      const todayIndex = now.day();
      const targetIndex = dayMapping[day];

      let [hour, minute] = time.split(":").map(Number);

      let targetDay = dayjs()
        .day(targetIndex)
        .hour(hour)
        .minute(minute)
        .second(0);

      if (
        (targetIndex === todayIndex && targetDay.isBefore(now)) ||
        targetIndex < todayIndex
      ) {
        targetDay = targetDay.add(1, "week");
      }

      const startTime = targetDay;
      const endTime = startTime.add(parseDuration(duration), "minute");

      const channelId = process.env.WATCH_PARTY_CHANNEL_ID;
      const voiceChannel = guild.channels.cache.get(channelId);

      const scheduledEvent = await guild.scheduledEvents.create({
        channel: voiceChannel,
        name: title,
        scheduledStartTime: startTime.toDate(),
        scheduledEndTime: endTime.toDate(),
        privacyLevel: 2, // GUILD_ONLY
        entityType: 2, // External
        description: description,
        entityMetadata: {
          location: "Online - Watch Party",
        },
        image: await fetchAndConvertImage(anime.coverImage.large),
      });

      //Save to DB
      await watchParty.createParty({
        guildId: guildId,
        animeId: anime.id,
        animeTitle: anime.title.romaji || anime.title.english,
        coverImage: anime.coverImage.large,
        currentEpisode: episode,
        season: season ? `Season ${season}` : null,
        day: day,
        time: time,
        duration: duration,
        repeat: repeat,
        scheduledEventId: scheduledEvent.id,
        eventStartTime: startTime.toDate(),
        eventEndTime: endTime.toDate(),
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Failed to set up watch party.");
    }
  },
};

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
