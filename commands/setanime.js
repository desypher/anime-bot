const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActivityType,
} = require("discord.js");
const { gql } = require("graphql-tag");
const currentAnime = require("../database/helpers/currentAnime");
const { fetchFromAniList } = require("../utils/anilist");
const { stripHtml } = require("../utils/stripHtml");

const query = gql`
  query ($search: String) {
    Media(search: $search, type: ANIME) {
      id
      title {
        romaji
      }
      coverImage {
        large
      }
      description(asHtml: false)
      episodes
    }
  }
`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setanime")
    .setDescription("Sets the anime for the watch party")
    .setDefaultMemberPermissions("0")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The title of the anime")
        .setRequired(true)
    ),

  async execute(interaction) {
    const search = interaction.options.getString("title");

    const allowedRoleId = process.env.WATCH_PARTY_HOST_ROLE_ID;

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ Only Watch Party Hosts can use this command.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const variables = { search };
      const response = await fetchFromAniList(query, variables);
      const anime = response.Media;

      if (!anime) {
        return interaction.editReply("Anime not found.");
      }

      // Save to DB
      await currentAnime.setCurrent(
        interaction.guildId,
        anime.id,
        anime.title.romaji,
        1
      );

      const cleanDescription = anime.description
        ? stripHtml(anime.description)
        : "No description available.";
      // Create Embed
      const embed = new EmbedBuilder()
        .setTitle(anime.title.romaji)
        .setDescription(
          cleanDescription.length > 400
            ? cleanDescription.slice(0, 400) + "..."
            : cleanDescription
        )
        .setThumbnail(anime.coverImage.large)
        .addFields(
          {
            name: "Total Episodes",
            value: anime.episodes?.toString() || "Unknown",
            inline: true,
          },
          { name: "Current Episode", value: "1", inline: true }
        )
        .setColor("Purple");

      await interaction.editReply({
        content: `📺 Watch party set for **${anime.title.romaji}**!`,
        embeds: [embed],
      });

      interaction.client.user.setPresence({
        activities: [{ name: anime.title.romaji, type: ActivityType.Watching }],
        status: "online",
      });
    } catch (error) {
      console.error(error);
      return interaction.editReply("❌ Failed to fetch anime information.");
    }
  },
};
