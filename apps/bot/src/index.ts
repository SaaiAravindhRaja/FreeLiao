/**
 * FreeLiao Telegram Bot Entry Point
 */

import { bot } from './bot.js';
import { config } from './config.js';
import { authMiddleware } from './middleware/auth.js';

// Import and register commands
import { registerCommands } from './commands/index.js';
import { registerCallbacks } from './callbacks/index.js';

// Apply authentication middleware
bot.use(authMiddleware);

// Register all commands and callbacks
registerCommands(bot);
registerCallbacks(bot);

// Start the bot
async function main() {
  console.log('🤖 Starting FreeLiao bot...');
  console.log(`📍 Mode: ${config.botMode}`);

  if (config.botMode === 'webhook') {
    // Webhook mode - bot will be triggered by HTTP requests
    // This is handled by the Next.js API route
    console.log('🌐 Running in webhook mode');
    console.log('   Webhook URL should be configured in Telegram');
  } else {
    // Polling mode - good for development
    console.log('🔄 Running in polling mode');

    // Delete any existing webhook to ensure polling works
    await bot.api.deleteWebhook();

    // Start polling
    bot.start({
      onStart: (botInfo) => {
        console.log(`✅ Bot started as @${botInfo.username}`);
        console.log('📱 Send /start to the bot to get started');
      },
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bot...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down bot...');
  bot.stop();
  process.exit(0);
});

// Run
main().catch((error) => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});

// Export bot for webhook handler
export { bot };
