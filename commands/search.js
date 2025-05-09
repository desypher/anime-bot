const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const { gql } = require("graphql-tag");
const { fetchFromAniList } = require("../utils/anilist");

const searchQuery = gql`
  query ($search: String) {
    Page(perPage: 10) {
      media(search: $search, type: ANIME) {
        id
        title {
          romaji
          english
        }
      }
    }
  }
`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("searchanime")
    .setDescription("Searches for anime and lets you pick from a list")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The anime title to search for")
        .setRequired(true)
    ),

  async execute(interaction) {
    const title = interaction.options.getString("title");
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const response = await fetchFromAniList(searchQuery, { search: title });
      const results = response.Page.media;

      if (!results.length) {
        return interaction.editReply("No anime found with that title.");
      }

      const options = results.map((anime) => ({
        label: anime.title.romaji || anime.title.english,
        value: anime.id.toString(),
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("anime_select")
        .setPlaceholder("Select an anime...")
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.editReply({
        content: "Select an anime from the list:",
        components: [row],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(error);
      interaction.editReply("❌ Something went wrong while searching.");
    }
  },
};
