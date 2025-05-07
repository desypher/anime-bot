const WatchParty = require("../../database/helpers/watchparties");

module.exports = {
  customId: "cancel_party_select",

  async execute(interaction) {
    const selectedId = interaction.values[0];
    const guildId = interaction.guildId;

    try {
      const party = await WatchParty.deleteParty(selectedId);

      if (!party) {
        return interaction.update({
          content: "❌ Could not find or delete the watch party.",
          components: [],
        });
      }

      await interaction.update({
        content: `✅ Canceled watch party for **${party.animeTitle}** on **${party.day}** at **${party.time}**.`,
        components: [],
      });
    } catch (err) {
      console.error(err);
      await interaction.update({
        content: "❌ An error occurred while canceling the party.",
        components: [],
      });
    }
  },
};
