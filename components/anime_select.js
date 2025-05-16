const {
  EmbedBuilder,
  MessageFlags,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { gql } = require("graphql-tag");
const { fetchFromAniList } = require("../utils/anilist");
const { stripHtml } = require("../utils/stripHtml");

const detailQuery = gql`
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      coverImage {
        large
      }
      episodes
      status
      startDate {
        year
      }
      format
      averageScore
      trailer {
        id
        site
      }
    }
  }
`;

module.exports = {
  customId: "anime_select",

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.user.id !== interaction.message.interaction.user.id) {
      return interaction.reply({
        content: "This menu isn't for you!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const animeId = parseInt(interaction.values[0]);
    const detail = await fetchFromAniList(detailQuery, { id: animeId });
    const anime = detail.Media;

    const cleanDescription = anime.description
      ? stripHtml(anime.description)
      : "No description available.";

    const embed = new EmbedBuilder()
      .setTitle(anime.title.romaji || anime.title.english)
      .setThumbnail(anime.coverImage.large)
      .setDescription(
        cleanDescription.length > 400
          ? cleanDescription.slice(0, 400) + "..."
          : cleanDescription
      )
      .addFields(
        {
          name: "Episodes",
          value: anime.episodes?.toString() || "Unknown",
          inline: true,
        },
        { name: "Status", value: anime.status || "Unknown", inline: true },
        { name: "Format", value: anime.format || "Unknown", inline: true },
        {
          name: "Start Year",
          value: anime.startDate.year?.toString() || "Unknown",
          inline: true,
        },
        {
          name: "Score",
          value: `${anime.averageScore || "N/A"}/100`,
          inline: true,
        }
      )
      .setColor("Random");

    const trailerSite = anime.trailer?.site;
    let trailerUrl = null;
    if (trailerSite === "youtube") {
      const trailerId = anime.trailer?.id;
      if (trailerId) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailerId}`;
      } else {
        trailerUrl = null;
      }
    } else if (trailerSite === "dailymotion") {
      const trailerId = anime.trailer?.id;
      if (trailerId) {
        trailerUrl = `https://www.dailymotion.com/video/${trailerId}`;
      } else {
        trailerUrl = null;
      }
    }

    const infoButton = new ButtonBuilder()
      .setCustomId("post_button")
      .setLabel("Post to Channel")
      .setStyle(ButtonStyle.Primary);

    const trailerButton = new ButtonBuilder()
      .setLabel("Watch Trailer")
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(infoButton);

    if (trailerUrl != null && trailerUrl != "") {
      trailerButton.setURL(trailerUrl);
      row.addComponents(trailerButton);
    }

    await interaction.update({
      content: "Here is the anime you selected:",
      embeds: [embed],
      components: [row],
    });

    const filter = (i) =>
      i.customId === "post_button" && i.user.id === interaction.user.id;

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });
    const publicRow = new ActionRowBuilder();
    if (trailerUrl != null && trailerUrl != "") {
      publicRow.addComponents(trailerButton);
    }

    collector.on("collect", async (i) => {
      if (i.customId === "post_button") {
        await i.deferUpdate();
        await interaction.channel.send({
          content: `<@${i.user.id}> shared this anime with you! 📺`,
          embeds: [embed],
          components: [publicRow],
        });
      }
    });
  },
};
