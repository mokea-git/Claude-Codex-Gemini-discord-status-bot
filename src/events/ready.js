const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Set initial bot status
    client.user.setActivity('AI Usage Tracking', { type: ActivityType.Watching });
  },
};
