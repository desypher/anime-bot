const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const WatchParty = require('../database/WatchParty');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cancelparty')
    .setDescription('Cancel a scheduled watch party'),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const parties = await WatchParty.find({ guildId });

    if (!parties.length) {
      return interaction.reply('😕 There are no scheduled watch parties to cancel.');
    }

    const options = parties.map(party =>
      new StringSelectMenuOptionBuilder()
        .setLabel(`${party.animeTitle} - ${party.day} at ${party.time}`)
        .setValue(party._id.toString())
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('cancel_party_select')
      .setPlaceholder('Select a party to cancel')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: '🗑️ Select a watch party to cancel:',
      components: [row],
      ephemeral: true
    });
  }
};
