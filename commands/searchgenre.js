const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { fetchFromAniList } = require("../utils/anilist");
const GENRES = require("../constants/genres");
const { stripHtml } = require("../utils/stripHtml");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("searchgenre")
    .setDescription("Get anime by genre")
    .addStringOption((option) =>
      option
        .setName("genre")
        .setDescription("Genre to search")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const genre = interaction.options.getString("genre");

    const query = `
      query ($genre: String) {
        Page(perPage: 5) {
          media(genre_in: [$genre], type: ANIME, sort: SCORE_DESC) {
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

    try {
      const data = await fetchFromAniList(query, { genre });
      const results = data.Page.media;

      if (results.length === 0)
        return await interaction.reply("❌ No anime found in that genre.");

      const embeds = results.map((anime) =>
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

      await interaction.reply({ embeds });
    } catch (err) {
      console.error(err);
      await interaction.reply("❌ Error searching genre.");
    }
  },

  // Add autocomplete handler
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const filtered = GENRES.filter((g) =>
      g.toLowerCase().startsWith(focused.toLowerCase())
    ).slice(0, 25); // Discord max is 25 suggestions

    await interaction.respond(filtered.map((g) => ({ name: g, value: g })));
  },
};
