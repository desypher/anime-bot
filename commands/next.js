const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const { gql } = require("graphql-tag");
const currentAnime = require("../database/helpers/currentAnime");
const { fetchFromAniList } = require("../utils/anilist");

const query = gql`
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      title {
        romaji
      }
      coverImage {
        large
      }
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
        flags: MessageFlags.Ephemeral,
      });
    }
    const party = await currentAnime.getCurrent(interaction.guildId);

    if (!party) {
      return interaction.reply({
        content: "😕 No anime is currently set. Use `/setanime` first.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const response = await fetchFromAniList(query, { id: party.animeId });
      const anime = response.Media;

      const totalEpisodes = anime.episodes || null;
      const nextEpisode = party.currentEpisode + 1;

      if (totalEpisodes && nextEpisode > totalEpisodes) {
        return interaction.reply({
          content: `You've reached the end of **${anime.title.romaji}**! 🎉`,
          flags: 0,
        });
      }

      await currentAnime.setEpisode(interaction.guildId, nextEpisode);

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
        content: "❌ Could not fetch anime data from AniList.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
