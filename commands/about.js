const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("about")
    .setDefaultMemberPermissions("0")
    .setDescription("Information about the bot"),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle(`About ${process.env.BOT_NAME}`)
        .setDescription(
          `This bot is designed to enhance your anime watch party experience!`
        )
        .setFooter({
          text: `Created by Desypher`,
        })
        .setColor("Random");

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Could not get information about the bot.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
