const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const WatchParty = require("../database/CurrentAnime");
const { gql } = require("graphql-tag");
const CurrentAnime = require("../database/CurrentAnime");

const endpoint = "https://graphql.anilist.co";

const query = gql`
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
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
    .setName("current")
    .setDescription("Shows the current anime and episode being watched"),

  async execute(interaction) {
    const party = await CurrentAnime.findOne({ guildId: interaction.guildId });

    if (!party) {
      return interaction.reply({
        content: "No anime is currently set. Use `/setanime` first.",
        ephemeral: true,
      });
    }

    try {
      // Dynamically import graphql-request
      const { request } = await import("graphql-request");

      const variables = { id: party.animeId };
      const response = await request(endpoint, query, variables);
      const anime = response.Media;
      const stripHtml = (html) => html.replace(/<\/?[^>]+(>|$)/g, "");
      const cleanDescription = anime.description
        ? stripHtml(anime.description)
        : "No description available.";

      const embed = new EmbedBuilder()
        .setTitle(
          `${anime.title.romaji} ${anime.title.english} - Episode ${party.currentEpisode}`
        )
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
          {
            name: "Current Episode",
            value: party.currentEpisode.toString(),
            inline: true,
          }
        )
        .setColor("Green");

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Failed to fetch anime data from AniList.",
        ephemeral: true,
      });
    }
  },
};
