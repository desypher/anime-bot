const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { gql } = require("graphql-tag");
const WatchParty = require("../database/WatchParty");

const endpoint = "https://graphql.anilist.co";

const query = gql`
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      title {
        romaji
      }
      coverImage {
        large
      }
      description(asHtml: false)
      episodes
    }
  }
`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("next")
    .setDefaultMemberPermissions("0")
    .setDescription("Advances to the next episode in the watch party"),

  async execute(interaction) {
    const allowedRoleId = process.env.WATCH_PARTY_HOST_ROLE_ID;

    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: "❌ Only Watch Party Hosts can use this command.",
        ephemeral: true,
      });
    }
    const party = await WatchParty.findOne({ guildId: interaction.guildId });

    if (!party) {
      return interaction.reply({
        content: "No anime is currently set. Use `/setanime` first.",
        ephemeral: true,
      });
    }

    try {
      const { request } = await import("graphql-request");
      const response = await request(endpoint, query, { id: party.animeId });
      const anime = response.Media;

      const totalEpisodes = anime.episodes || null;
      const nextEpisode = party.currentEpisode + 1;

      if (totalEpisodes && nextEpisode > totalEpisodes) {
        return interaction.reply({
          content: `You've reached the end of **${anime.title.romaji}**! 🎉`,
          ephemeral: false,
        });
      }

      party.currentEpisode = nextEpisode;
      await party.save();

      const embed = new EmbedBuilder()
        .setTitle(`${anime.title.romaji} - Episode ${nextEpisode}`)
        .setDescription(`Now watching episode **${nextEpisode}**!`)
        .setThumbnail(anime.coverImage.large)
        .addFields(
          {
            name: "Total Episodes",
            value: totalEpisodes?.toString() || "Unknown",
            inline: true,
          },
          {
            name: "Current Episode",
            value: nextEpisode.toString(),
            inline: true,
          }
        )
        .setColor("Orange");

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Could not fetch anime data from AniList.",
        ephemeral: true,
      });
    }
  },
};
