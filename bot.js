require('dotenv').config()

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.author.bot)
    return

  if (msg.mentions.has(client.user))
    msg.reply('Hi!')
});

client.login(process.env.BOT_TOKEN);