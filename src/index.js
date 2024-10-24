const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome to your AI Assistant!'));

bot.on('message', (ctx) => {


    ctx.reply('Napisałeś mi: ' + ctx.message.text);

})

bot.launch();

console.log('Bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
