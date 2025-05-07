const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const WatchParty = require("../database/helpers/watchparties");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cancelparty")
    .setDefaultMemberPermissions("0")
    .setDescription("Cancel a scheduled watch party"),

  async execute(interaction) {
    const allowedRoleId = process.env.WATCH_PARTY_HOST_ROLE_ID;

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ Only Watch Party Hosts can use this command.",
        ephemeral: true,
      });
    }
    const guildId = interaction.guildId;
    const parties = await WatchParty.getPartyByGuild(guildId);

    if (!parties.length) {
      return interaction.reply(
        "😕 There are no scheduled watch parties to cancel."
      );
    }

    const options = parties.map((party) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(`${party.animeTitle} - ${party.day} at ${party.time}`)
        .setValue((party.id || party._id).toString())
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("cancel_party_select")
      .setPlaceholder("Select a party to cancel")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: "🗑️ Select a watch party to cancel:",
      components: [row],
      ephemeral: true,
    });
  },
};
