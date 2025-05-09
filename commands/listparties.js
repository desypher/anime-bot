const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const WatchParty = require("../database/helpers/watchparties");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("listparties")
    .setDescription("List all scheduled watch parties in this server"),

  async execute(interaction) {
    await interaction.deferReply();

    const guildId = interaction.guildId;

    try {
      const parties = await WatchParty.getPartiesByGuild(guildId);
      if (!parties.length) {
        return interaction.editReply(
          "😕 No watch parties are currently scheduled."
        );
      }

      const embeds = parties.map((party) => {
        return new EmbedBuilder()
          .setTitle(party.animeTitle)
          .setDescription(
            `🎬 Episode ${party.currentEpisode}${
              party.season ? ` | ${party.season}` : ""
            }`
          )
          .addFields(
            { name: "📅 Day", value: party.day, inline: true },
            { name: "🕒 Time", value: party.time, inline: true },
            { name: "⏱ Duration", value: party.duration, inline: true },
            {
              name: "🔁 Repeats Weekly?",
              value: party.repeat ? "Yes" : "No",
              inline: true,
            }
          )
          .setThumbnail(party.coverImage)
          .setColor("Blue")
          .setFooter({ text: `Scheduled Watch Party` });
      });

      await interaction.editReply({ embeds });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: "❌ Failed to fetch watch parties.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
