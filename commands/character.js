const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { fetchFromAniList } = require("../utils/anilist");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("character")
    .setDescription("Get info about an anime character")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the character")
        .setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString("name");

    const query = `
      query ($search: String) {
        Character(search: $search) {
          name {
            full
            native
          }
          image {
            large
          }
          description(asHtml: false)
          siteUrl
        }
      }
    `;

    try {
      const data = await fetchFromAniList(query, { search: name });
      const character = data.Character;

      const embed = new EmbedBuilder()
        .setTitle(character.name.full)
        .setDescription(
          character.description?.slice(0, 1024) || "No description available."
        )
        .setURL(character.siteUrl)
        .setThumbnail(character.image.large)
        .setFooter({ text: character.name.native || "" });

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.reply("❌ Character not found.");
    }
  },
};
