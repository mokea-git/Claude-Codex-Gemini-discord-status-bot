# Claude-Codex-Gemini Discord Status Bot

A Discord bot that displays real-time API usage statistics for Claude, Gemini, and Codex AI services with Discord.js Component V2 (buttons and select menus).

## Features

✨ **Real-time Usage Tracking**
- Claude API usage (including context window tracking)
- Gemini API usage
- Codex API usage

🎮 **Component V2 Interaction**
- Refresh button to update usage data
- Detailed view button for comprehensive breakdown
- Export data button (ready for implementation)
- Service selection dropdown menu

📊 **Rich Embeds**
- Beautiful formatted usage statistics
- Color-coded by service
- Detailed breakdown views

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/mokea-git/Claude-Codex-Gemini-discord-status-bot.git
cd Claude-Codex-Gemini-discord-status-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_api_key_here
CODEX_API_KEY=your_codex_api_key_here
```

4. **Deploy slash commands**
```bash
npm run deploy
```

5. **Start the bot**
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Usage

In Discord, use the slash command:
```
/status
```

This will display:
- Current usage for all three AI services
- Interactive buttons to:
  - 🔄 Refresh the data
  - 📊 View detailed breakdown
  - 💾 Export usage data
- Dropdown menu to view individual service details

## Project Structure

```
src/
├── index.js                 # Main bot entry point
├── commands/
│   └── status.js           # Status slash command with Component V2
├── events/
│   ├── ready.js            # Bot ready event
│   └── interactionCreate.js # Interaction handler
└── utils/
    └── apiUsage.js         # API usage tracking logic
```

## API Integration

The bot integrates with:
- **Claude (Anthropic)**: Tracks input tokens, output tokens, and context window usage
- **Gemini (Google)**: Tracks total tokens and request count
- **Codex (OpenAI)**: Tracks total tokens and request count

### Setting up API Tracking

Each service requires proper API setup:

1. **Claude API**: Set `ANTHROPIC_API_KEY` in `.env`
2. **Gemini API**: Set `GOOGLE_API_KEY` in `.env`
3. **Codex API**: Set `CODEX_API_KEY` in `.env`

## Component V2 Features

The bot uses Discord.js Component V2:
- **ActionRowBuilder**: Organizes buttons and select menus
- **ButtonBuilder**: Interactive buttons with custom IDs
- **StringSelectMenuBuilder**: Dropdown menus for service selection

### Components in the `/status` command:

1. **Button Row**: Refresh, Detailed View, Export Data
2. **Select Menu Row**: Choose Claude, Gemini, or Codex for details

## Error Handling

The bot includes error handling for:
- Missing API keys
- Failed API requests
- Invalid interactions
- Expired components (60-second timeout)

## Troubleshooting

### Bot doesn't respond
- Verify `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` are correct
- Ensure bot has permission to send messages
- Run `npm run deploy` to register slash commands

### API usage shows mock data
- Ensure API keys are set in `.env`
- Verify API endpoints are accessible
- Check console for error messages

## Future Enhancements

- [ ] Historical usage tracking
- [ ] Graphical charts for usage trends
- [ ] Multi-guild support with per-guild settings
- [ ] Export data to CSV/JSON
- [ ] Usage alerts and thresholds
- [ ] Database integration for persistent storage

## License

This project is licensed under the MIT License.

## Support

For issues or feature requests, please open an issue on GitHub.

---

**Last Updated**: April 30, 2026
