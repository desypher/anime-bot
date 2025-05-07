const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const watchParty = require("../database/helpers/watchparties");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pauseparty")
    .setDescription("Pause the current watch party"),
  async execute(interaction) {
    // Fetch all watch parties
    const parties = await watchParty.getPartiesByGuild(interaction.guildId);

    if (parties.length === 0) {
      return interaction.reply({
        content: "❌ No watch parties available.",
        ephemeral: true,
      });
    }

    // Create a select menu for the user to choose a party
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_watch_party")
      .setPlaceholder("Select a watch party to pause/resume")
      .setMinValues(1)
      .setMaxValues(1);

    // Populate the options with the available watch parties
    parties.forEach((party) => {
      selectMenu.addOptions({
        label: party.animeTitle,
        value: party.id.toString(), // Assuming party.id is a unique identifier
      });
    });

    // Send the select menu
    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: "Please select a watch party to pause or resume.",
      components: [row],
      ephemeral: true,
    });
  },
};
