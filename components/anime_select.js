const { EmbedBuilder } = require("discord.js");
const { gql } = require("graphql-tag");

const endpoint = "https://graphql.anilist.co";

const detailQuery = gql`
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      coverImage {
        large
      }
      episodes
      status
      startDate {
        year
      }
      format
      averageScore
    }
  }
`;

module.exports = {
  customId: "anime_select",

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.user.id !== interaction.message.interaction.user.id) {
      return interaction.reply({
        content: "This menu isn't for you!",
        ephemeral: true,
      });
    }

    const { request } = await import("graphql-request");
    const animeId = parseInt(interaction.values[0]);
    const detail = await request(endpoint, detailQuery, { id: animeId });
    const anime = detail.Media;

    const stripHtml = (html) => html.replace(/<\/?[^>]+(>|$)/g, "");
    const cleanDescription = anime.description
      ? stripHtml(anime.description)
      : "No description available.";

    const embed = new EmbedBuilder()
      .setTitle(anime.title.romaji || anime.title.english)
      .setThumbnail(anime.coverImage.large)
      .setDescription(
        cleanDescription.length > 400
          ? cleanDescription.slice(0, 400) + "..."
          : cleanDescription
      )
      .addFields(
        {
          name: "Episodes",
          value: anime.episodes?.toString() || "Unknown",
          inline: true,
        },
        { name: "Status", value: anime.status || "Unknown", inline: true },
        { name: "Format", value: anime.format || "Unknown", inline: true },
        {
          name: "Start Year",
          value: anime.startDate.year?.toString() || "Unknown",
          inline: true,
        },
        {
          name: "Score",
          value: `${anime.averageScore || "N/A"}/100`,
          inline: true,
        }
      )
      .setColor("Blurple");

    await interaction.update({
      content: "Here is the anime you selected:",
      embeds: [embed],
      components: [],
    });
  },
};
