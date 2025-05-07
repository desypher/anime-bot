const watchParty = require("../database/helpers/watchparties");

module.exports = {
  async execute(interaction) {
    // Handle the select menu interaction
    if (interaction.isStringSelectMenu()) {
      const selectedPartyId = interaction.values[0]; // The ID of the selected party
      try {
        // Fetch the selected watch party
        const party = await watchParty.getPartyById(selectedPartyId);

        if (!party) {
          return interaction.update({
            content: "❌ Watch party not found.",
            ephemeral: true,
          });
        }

        // Toggle the paused state
        const newPausedState = !party.paused;

        // Update the paused state in the database
        await watchParty.updateParty(selectedPartyId, {
          paused: newPausedState,
        });

        // Respond to the user
        await interaction.update({
          content: `✅ Watch party for **${party.animeTitle}** is now ${
            newPausedState ? "paused" : "resumed"
          }.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        await interaction.update({
          content: "❌ An error occurred while pausing the watch party.",
          components: [],
        });
      }
    }
  },
};
