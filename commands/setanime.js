const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActivityType,
} = require("discord.js");
const { gql } = require("graphql-tag");
const CurrentAnime = require("../database/CurrentAnime");

const endpoint = "https://graphql.anilist.co";

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
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The title of the anime")
        .setRequired(true)
    ),

  async execute(interaction) {
    const search = interaction.options.getString("title");

    await interaction.deferReply();

    try {
      const { request } = await import("graphql-request");
      const variables = { search };
      const response = await request(endpoint, query, variables);
      const anime = response.Media;

      if (!anime) {
        return interaction.editReply("Anime not found.");
      }

      // Save to MongoDB
      await CurrentAnime.findOneAndUpdate(
        { guildId: interaction.guildId },
        {
          guildId: interaction.guildId,
          animeId: anime.id,
          animeTitle: anime.title.romaji,
          currentEpisode: 1,
        },
        { upsert: true }
      );
      const stripHtml = (html) => html.replace(/<\/?[^>]+(>|$)/g, "");
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
        content: `Watch party set for **${anime.title.romaji}**!`,
        embeds: [embed],
      });

      interaction.client.user.setPresence({
        activities: [{ name: anime.title.romaji, type: ActivityType.Watching }],
        status: "online", // other options: 'idle', 'dnd', 'invisible'
      });
    } catch (error) {
      console.error(error);
      return interaction.editReply("Failed to fetch anime information.");
    }
  },
};
