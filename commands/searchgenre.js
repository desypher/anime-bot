const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { fetchFromAniList } = require("../utils/anilist");
const GENRES = require("../constants/genres");

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
            siteUrl
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
          .setTitle(anime.title.english || anime.title.romaji)
          .setDescription(anime.description?.slice(0, 300) + "...")
          .setURL(anime.siteUrl)
          .setThumbnail(anime.coverImage.large)
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
