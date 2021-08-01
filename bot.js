//@ts-check

require('dotenv').config()

const ytdl = require('ytdl-core')
const Discord = require('discord.js');

const client = new Discord.Client();
const queue = new Map()

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {

  // don't let the bot reply to itself
  if (msg.author.bot)
    return

  // handle commands
  if (!msg.content.startsWith('!'))
    return

  const serverQueue = queue.get(msg.guild.id)

  if (msg.content.startsWith('!play')) {
    parse(msg, serverQueue)
    return
  } else if (msg.content.startsWith('!pause')) {
    pause(msg, serverQueue)
    return
  } else if (msg.content.startsWith('!skip')) {
    skip(msg, serverQueue)
    return
  } else if (msg.content.startsWith('!stop')) {
    play(msg, serverQueue)
    return
  } else {
    msg.reply('That is not a valid command')
  }

  if (msg.mentions.has(client.user))
    msg.reply('Hi!')
});

/**
 * Play sound of youtube video passed in message.
 * @param {Discord.Message} message
 * @param {Map} serverQueue
 */
async function parse(message, serverQueue) {
  const [command, url] = message.content.split(" ");

  try {
    new URL(url)
  } catch (error) {
    message.reply('You did not give me a valid url.')
  }

  const voiceChannel = message.member.voice.channel;
  const permissions = voiceChannel.permissionsFor(message.client.user);

  if (!permissions.has("CONNECT") || !permissions.has("SPEAK"))
    return message.reply("I don't have the right permissions to join and speak in your voice channel.");

  if (!voiceChannel)
    return message.reply("You need to be in a voice channel to play music.");

  const songInfo = await ytdl.getInfo(url);
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
  };

  if (!serverQueue) {

  } else {
    serverQueue.songs.push(song)
    console.log(serverQueue.songs)
    return message.reply('Your song has been added to the queue!')
  }

  const queueContract = {
    textChannel: message.channel,
    voiceChannel: voiceChannel,
    connection: null,
    songs: [],
    volume: 5,
    playing: true,
  };

  queue.set(message.guild.id, queueContract);
  queueContract.songs.push(song);

  try {
    var connection = await voiceChannel.join();
    queueContract.connection = connection;
    play(message.guild, queueContract.songs[0]);
  } catch (err) {
    console.log(err);
    queue.delete(message.guild.id);
    return message.channel.send(err);
  }
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
