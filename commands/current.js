const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const { gql } = require("graphql-tag");
const CurrentAnime = require("../database/helpers/currentAnime");
const { fetchFromAniList } = require("../utils/anilist");
const { stripHtml } = require("../utils/stripHtml");

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
    const party = await CurrentAnime.getCurrent(interaction.guildId);

    if (!party) {
      return interaction.reply({
        content: "No anime is currently set. Use `/setanime` first.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const variables = { id: party.animeId };
      const response = await fetchFromAniList(query, variables);
      const anime = response.Media;
      const cleanDescription = anime.description
        ? stripHtml(anime.description)
        : "No description available.";

      const embed = new EmbedBuilder()
        .setTitle(`${anime.title.romaji} - Episode ${party.currentEpisode}`)
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
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
