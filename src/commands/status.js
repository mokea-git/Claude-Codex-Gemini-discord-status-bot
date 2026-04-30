const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const APIUsageTracker = require('../utils/apiUsage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show AI API usage status for Claude, Gemini, and Codex'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const usageData = await APIUsageTracker.getAllUsage();

      // Create embed with usage information
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🤖 AI API Usage Status')
        .setDescription('Current usage metrics for all AI services')
        .setTimestamp()
        .setFooter({ text: 'Last updated' });

      // Add fields from usage data
      const fields = APIUsageTracker.formatUsageForEmbed(usageData);
      fields.forEach(field => embed.addField(field.name, field.value, field.inline));

      // Create button row (Component V2)
      const buttonRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('refresh_status')
            .setLabel('🔄 Refresh')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('detailed_view')
            .setLabel('📊 Detailed View')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('export_data')
            .setLabel('💾 Export Data')
            .setStyle(ButtonStyle.Success),
        );

      // Create select menu (Component V2)
      const selectRow = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('service_select')
            .setPlaceholder('Select a service for details...')
            .addOptions(
              {
                label: 'Claude',
                value: 'claude',
                description: 'View Claude usage details',
                emoji: '🤖',
              },
              {
                label: 'Gemini',
                value: 'gemini',
                description: 'View Gemini usage details',
                emoji: '✨',
              },
              {
                label: 'Codex',
                value: 'codex',
                description: 'View Codex usage details',
                emoji: '💻',
              },
            ),
        );

      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow, selectRow],
      });

      // Handle button interactions
      const filter = i => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on('collect', async i => {
        if (i.customId === 'refresh_status') {
          await i.deferUpdate();
          const newUsageData = await APIUsageTracker.getAllUsage();
          const newEmbed = EmbedBuilder.from(embed)
            .setTimestamp();
          await i.editReply({
            embeds: [newEmbed],
            components: [buttonRow, selectRow],
          });
        } else if (i.customId === 'detailed_view') {
          await i.deferReply({ ephemeral: true });
          const detailedEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('📊 Detailed Usage Report')
            .setDescription('Comprehensive breakdown of all services')
            .addFields(
              {
                name: '🤖 Claude Details',
                value: usageData.claude
                  ? `**Input Tokens**: ${usageData.claude.tokens_used}\n**Context Tokens**: ${usageData.claude.context_tokens}\n**Output Tokens**: ${usageData.claude.output_tokens}\n**Total Requests**: ${usageData.claude.requests}\n**Usage**: ${usageData.claude.usage_percentage}%`
                  : 'No data available',
                inline: false,
              },
              {
                name: '✨ Gemini Details',
                value: usageData.gemini
                  ? `**Total Tokens**: ${usageData.gemini.tokens_used}\n**Requests**: ${usageData.gemini.requests}\n**Usage**: ${usageData.gemini.usage_percentage}%`
                  : 'No data available',
                inline: false,
              },
              {
                name: '💻 Codex Details',
                value: usageData.codex
                  ? `**Total Tokens**: ${usageData.codex.tokens_used}\n**Requests**: ${usageData.codex.requests}\n**Usage**: ${usageData.codex.usage_percentage}%`
                  : 'No data available',
                inline: false,
              },
            )
            .setTimestamp();

          await i.editReply({ embeds: [detailedEmbed] });
        } else if (i.customId === 'service_select') {
          const selected = i.values[0];
          await i.deferReply({ ephemeral: true });

          let serviceEmbed;
          if (selected === 'claude' && usageData.claude) {
            serviceEmbed = new EmbedBuilder()
              .setColor(0x0099ff)
              .setTitle('🤖 Claude Usage')
              .addFields(
                { name: 'Total Tokens', value: `\`${usageData.claude.tokens_used}\``, inline: true },
                { name: 'Context Tokens', value: `\`${usageData.claude.context_tokens}\``, inline: true },
                { name: 'Output Tokens', value: `\`${usageData.claude.output_tokens}\``, inline: true },
                { name: 'Requests', value: `\`${usageData.claude.requests}\``, inline: true },
                { name: 'Usage Percentage', value: `\`${usageData.claude.usage_percentage}%\``, inline: true },
              );
          } else if (selected === 'gemini' && usageData.gemini) {
            serviceEmbed = new EmbedBuilder()
              .setColor(0xffaa00)
              .setTitle('✨ Gemini Usage')
              .addFields(
                { name: 'Total Tokens', value: `\`${usageData.gemini.tokens_used}\``, inline: true },
                { name: 'Requests', value: `\`${usageData.gemini.requests}\``, inline: true },
                { name: 'Usage Percentage', value: `\`${usageData.gemini.usage_percentage}%\``, inline: true },
              );
          } else if (selected === 'codex' && usageData.codex) {
            serviceEmbed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle('💻 Codex Usage')
              .addFields(
                { name: 'Total Tokens', value: `\`${usageData.codex.tokens_used}\``, inline: true },
                { name: 'Requests', value: `\`${usageData.codex.requests}\``, inline: true },
                { name: 'Usage Percentage', value: `\`${usageData.codex.usage_percentage}%\``, inline: true },
              );
          }

          if (serviceEmbed) {
            await i.editReply({ embeds: [serviceEmbed] });
          }
        }
      });

      collector.on('end', () => {
        // Components will expire after 1 minute
      });
    } catch (error) {
      console.error('Error executing status command:', error);
      await interaction.editReply('❌ An error occurred while fetching API usage data.');
    }
  },
};
