const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const WatchParty = require("../database/CurrentAnime");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setepisode")
    .setDescription("Sets the current episode number")
    .setDefaultMemberPermissions("0")
    .addIntegerOption((option) =>
      option
        .setName("number")
        .setDescription("Episode number to set")
        .setRequired(true)
    ),

  async execute(interaction) {
    const allowedRoleId = process.env.WATCH_PARTY_HOST_ROLE_ID;

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ Only Watch Party Hosts can use this command.",
        ephemeral: true,
      });
    }
    const episode = interaction.options.getInteger("number");

    const party = await CurrentAnime.findOne({ guildId: interaction.guildId });

    if (!party) {
      return interaction.reply({
        content: "No anime is currently set. Use `/setanime` first.",
        ephemeral: true,
      });
    }

    party.currentEpisode = episode;
    await party.save();

    const embed = new EmbedBuilder()
      .setTitle(`${party.animeTitle} - Episode ${episode}`)
      .setDescription(`Watch party updated to episode **${episode}**.`)
      .setColor("Blue");

    await interaction.reply({ embeds: [embed] });
  },
};
