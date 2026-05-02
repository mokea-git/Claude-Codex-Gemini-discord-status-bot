const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const APIUsageTracker = require('../utils/apiUsage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-oauth')
    .setDescription('Configure OAuth tokens and API keys for services'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Create a select menu to choose which service to configure
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('oauth_service_select')
      .setPlaceholder('Select a service to configure...')
      .addOptions(
        {
          label: 'Claude (Anthropic)',
          value: 'claude',
          description: 'Configure Claude OAuth token or API key',
          emoji: '🤖',
        },
        {
          label: 'OpenAI (Codex)',
          value: 'openai',
          description: 'Configure OpenAI/Codex OAuth token or API key',
          emoji: '💻',
        },
        {
          label: 'Google (Gemini)',
          value: 'gemini',
          description: 'Configure Google API key',
          emoji: '✨',
        }
      );

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    // Get current auth status
    const authStatus = APIUsageTracker.getAuthStatus();

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('⚙️ OAuth Configuration')
      .setDescription('Select a service to configure its authentication credentials')
      .addFields(
        {
          name: '🤖 Claude',
          value: `Status: ${authStatus.claude.oauth ? '🔐 OAuth' : authStatus.claude.api_key ? '🔑 API Key' : '❌ Not configured'}\nConfigure Anthropic Claude OAuth token or API key`,
          inline: false,
        },
        {
          name: '💻 OpenAI',
          value: `Status: ${authStatus.codex.oauth ? '🔐 OAuth' : authStatus.codex.api_key ? '🔑 API Key' : '❌ Not configured'}\nConfigure OpenAI/Codex OAuth token or API key`,
          inline: false,
        },
        {
          name: '✨ Gemini',
          value: `Status: ${authStatus.gemini.api_key ? '🔑 API Key' : '❌ Not configured'}\nConfigure Google Generative AI API key`,
          inline: false,
        }
      )
      .setFooter({ text: 'Click on a service to edit its credentials' });

    await interaction.editReply({
      embeds: [embed],
      components: [selectRow],
    });

    // Create a collector for the select menu
    const filter = i => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async i => {
      if (i.customId === 'oauth_service_select') {
        const service = i.values[0];
        await showConfigModal(i, service);
      }
    });

    collector.on('end', () => {
      // Component will expire after 5 minutes
    });
  },
};

/**
 * Show modal for entering OAuth token/API key
 */
async function showConfigModal(interaction, service) {
  const modal = new ModalBuilder()
    .setCustomId(`oauth_modal_${service}`)
    .setTitle(`Configure ${getServiceName(service)}`);

  const config = getServiceConfig(service);

  const tokenInput = new TextInputBuilder()
    .setCustomId(config.customId)
    .setLabel(config.label)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(config.placeholder)
    .setMaxLength(500)
    .setRequired(false); // Optional since they might want to clear it

  const actionRow = new ActionRowBuilder().addComponents(tokenInput);
  modal.addComponents(actionRow);

  // Show modal
  await interaction.showModal(modal);

  // Wait for modal submission
  try {
    const submitted = await interaction.awaitModalSubmit({
      time: 300000, // 5 minutes
      filter: i => i.customId === `oauth_modal_${service}`,
    });

    const tokenValue = submitted.fields.getTextInputValue(config.customId).trim();

    // Update environment variable
    if (tokenValue) {
      process.env[config.envKey] = tokenValue;
    } else {
      delete process.env[config.envKey];
    }

    // Send confirmation
    const successEmbed = new EmbedBuilder()
      .setColor(tokenValue ? 0x00ff00 : 0xffaa00)
      .setTitle(tokenValue ? '✅ Configuration Updated' : '⚠️ Credential Cleared')
      .setDescription(
        tokenValue
          ? `${getServiceName(service)} credentials have been configured`
          : `${getServiceName(service)} credentials have been cleared`
      )
      .addFields({
        name: 'Service',
        value: `${getServiceEmoji(service)} ${getServiceName(service)}`,
        inline: true,
      });

    if (tokenValue) {
      successEmbed.addFields({
        name: 'Token Preview',
        value: `\`${tokenValue.slice(0, 25)}...\``,
        inline: true,
      });
    }

    successEmbed.setFooter({ text: 'Changes take effect immediately' });

    await submitted.reply({
      embeds: [successEmbed],
      ephemeral: true,
    });
  } catch (error) {
    console.error('Modal submission error:', error);
  }
}

/**
 * Get service name
 */
function getServiceName(service) {
  switch (service) {
    case 'claude':
      return 'Claude (Anthropic)';
    case 'openai':
      return 'OpenAI (Codex)';
    case 'gemini':
      return 'Google (Gemini)';
    default:
      return service;
  }
}

/**
 * Get service emoji
 */
function getServiceEmoji(service) {
  switch (service) {
    case 'claude':
      return '🤖';
    case 'openai':
      return '💻';
    case 'gemini':
      return '✨';
    default:
      return '❓';
  }
}

/**
 * Get service configuration
 */
function getServiceConfig(service) {
  switch (service) {
    case 'claude':
      return {
        label: 'Claude OAuth Token or API Key',
        placeholder: 'sk-ant-... or claude-oauth-...',
        customId: 'claude_credentials',
        envKey: 'ANTHROPIC_API_KEY', // Will be CLAUDE_CODE_OAUTH_TOKEN if starts with claude-oauth-
      };
    case 'openai':
      return {
        label: 'OpenAI OAuth Token or API Key',
        placeholder: 'sk-... or openai-oauth-...',
        customId: 'openai_credentials',
        envKey: 'CODEX_API_KEY', // Will be OPENAI_OAUTH_TOKEN if starts with openai-oauth-
      };
    case 'gemini':
      return {
        label: 'Google API Key',
        placeholder: 'AIzaSy...',
        customId: 'gemini_credentials',
        envKey: 'GOOGLE_API_KEY',
      };
    default:
      return {};
  }
}
