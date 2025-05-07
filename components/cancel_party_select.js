const WatchParty = require("../database/helpers/watchparties");

module.exports = {
  customId: "cancel_party_select",

  async execute(interaction) {
    const selectedId = interaction.values[0];

    try {
      const parties = await WatchParty.getPartiesByGuild(interaction.guildId);
      const party = parties.find(
        (p) => (p.id || p._id).toString() === selectedId
      );

      if (!party) {
        return interaction.update({
          content: "❌ Could not find that watch party.",
          components: [],
        });
      }

      await WatchParty.deleteParty(selectedId);

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
