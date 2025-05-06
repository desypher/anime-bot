const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const WatchParty = require('../database/CurrentAnime');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setepisode')
    .setDescription('Sets the current episode number')
    .addIntegerOption(option =>
      option.setName('number')
        .setDescription('Episode number to set')
        .setRequired(true)
    ),

  async execute(interaction) {
    const episode = interaction.options.getInteger('number');

    const party = await CurrentAnime.findOne({ guildId: interaction.guildId });

    if (!party) {
      return interaction.reply({
        content: 'No anime is currently set. Use `/setanime` first.',
        ephemeral: true
      });
    }

    party.currentEpisode = episode;
    await party.save();

    const embed = new EmbedBuilder()
      .setTitle(`${party.animeTitle} - Episode ${episode}`)
      .setDescription(`Watch party updated to episode **${episode}**.`)
      .setColor('Blue');

    await interaction.reply({ embeds: [embed] });
  }
};