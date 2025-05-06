const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType
  } = require('discord.js');
  const { gql } = require('graphql-tag');
  
  const endpoint = 'https://graphql.anilist.co';
  
  const searchQuery = gql`
    query ($search: String) {
      Page(perPage: 10) {
        media(search: $search, type: ANIME) {
          id
          title {
            romaji
            english
          }
        }
      }
    }
  `;
  
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
      }
    }
  `;
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('searchanime')
      .setDescription('Searches for anime and lets you pick from a list')
      .addStringOption(option =>
        option.setName('title')
          .setDescription('The anime title to search for')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      const title = interaction.options.getString('title');
      await interaction.deferReply();
  
      try {
        const { request } = await import('graphql-request');
        const response = await request(endpoint, searchQuery, { search: title });
        const results = response.Page.media;
  
        if (!results.length) {
          return interaction.editReply('No anime found with that title.');
        }
  
        const options = results.map(anime => ({
          label: anime.title.romaji || anime.title.english,
          value: anime.id.toString(),
        }));
  
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('anime_select')
          .setPlaceholder('Select an anime...')
          .addOptions(options);
  
        const row = new ActionRowBuilder().addComponents(selectMenu);
  
        const reply = await interaction.editReply({
          content: 'Select an anime from the list:',
          components: [row]
        });
  
        const collector = reply.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 30_000,
          max: 1
        });
  
        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: "This menu isn't for you!", ephemeral: true });
          }
  
          const animeId = parseInt(i.values[0]);
          const detail = await request(endpoint, detailQuery, { id: animeId });
  
          const anime = detail.Media;
          const stripHtml = (html) => html.replace(/<\/?[^>]+(>|$)/g, "");
          const cleanDescription = anime.description
          ? stripHtml(anime.description)
          : "No description available.";
          const embed = new EmbedBuilder()
            .setTitle(anime.title.romaji || anime.title.english)
            .setThumbnail(anime.coverImage.large)
            .setDescription(
              cleanDescription > 400
                ? cleanDescription.slice(0, 400) + '...'
                : cleanDescription || 'No description available.'
            )
            .addFields(
              { name: 'Episodes', value: anime.episodes?.toString() || 'Unknown', inline: true },
              { name: 'Status', value: anime.status || 'Unknown', inline: true },
              { name: 'Format', value: anime.format || 'Unknown', inline: true },
              { name: 'Start Year', value: anime.startDate.year?.toString() || 'Unknown', inline: true },
              { name: 'Score', value: `${anime.averageScore || 'N/A'}/100`, inline: true },
            )
            .setColor('Blurple');
  
          await i.update({
            content: 'Here is the anime you selected:',
            embeds: [embed],
            components: []
          });
        });
  
        collector.on('end', collected => {
          if (collected.size === 0) {
            interaction.editReply({
              content: 'No selection made in time.',
              components: []
            });
          }
        });
  
      } catch (error) {
        console.error(error);
        interaction.editReply('Something went wrong while searching.');
      }
    }
  };