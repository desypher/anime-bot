const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { gql } = require("graphql-tag");

const endpoint = "https://graphql.anilist.co";

const topAnimeQuery = gql`
  query ($page: Int) {
    Page(perPage: 50, page: $page) {
      media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
        id
        title {
          romaji
          english
        }
        description(asHtml: false)
        coverImage {
          large
        }
        averageScore
        episodes
        format
        genres
        startDate {
          year
        }
      }
    }
  }
`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("recommend")
    .setDescription("Get 5 highly rated anime recommendations"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const { request } = await import("graphql-request");
      const allAnime = [];

      // Fetch top anime from 2 random pages to increase variety
      const pages = [
        Math.floor(Math.random() * 10) + 1,
        Math.floor(Math.random() * 10) + 1,
      ];

      for (const page of pages) {
        const response = await request(endpoint, topAnimeQuery, { page });
        allAnime.push(...response.Page.media);
      }

      // Shuffle and pick 5 unique anime
      const shuffled = allAnime.sort(() => 0.5 - Math.random());
      const recommendations = shuffled.slice(0, 5);
      const stripHtml = (html) =>
        html != null ? html.replace(/<\/?[^>]+(>|$)/g, "") : "";

      const embeds = recommendations.map((anime) =>
        new EmbedBuilder()
          .setTitle(anime.title.romaji || anime.title.english)
          .setThumbnail(anime.coverImage.large)
          .setDescription(
            stripHtml(anime.description)?.length > 300
              ? stripHtml(anime.description).slice(0, 300) + "..."
              : stripHtml(anime.description) || "No description available."
          )
          .addFields(
            {
              name: "Score",
              value: `${anime.averageScore || "N/A"}/100`,
              inline: true,
            },
            {
              name: "Episodes",
              value: anime.episodes?.toString() || "Unknown",
              inline: true,
            },
            { name: "Format", value: anime.format || "Unknown", inline: true },
            {
              name: "Genres",
              value: anime.genres.slice(0, 3).join(", ") || "N/A",
            }
          )
          .setFooter({ text: `Year: ${anime.startDate.year || "Unknown"}` })
          .setColor("Random")
      );

      await interaction.editReply({
        content: `🎉 Here are 5 animes you might enjoy:`,
        embeds,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply(
        "❌ Something went wrong fetching recommendations."
      );
    }
  },
};
