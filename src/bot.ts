/// <reference path="/Users/joostjansen/Code/1. in_progress/jjbot/node_modules/discord.js/typings/index.d.ts" />

require("dotenv").config();

import {
    Channel,
    Client,
    DMChannel,
    Guild,
    Message,
    NewsChannel,
    TextChannel,
    VoiceChannel,
    VoiceConnection,
} from "discord.js";
import { URL } from "url";
import ytdl from "ytdl-core";

// TYPES ⌨️

type QueueContract = {
    textChannel: TextChannel | DMChannel | NewsChannel;
    voiceChannel: VoiceChannel;
    connection: VoiceConnection | null;
    songs: YTDLSong[];
    volume: number;
    playing: boolean;
};

type YTDLSong = {
    title: string | null;
    url: string | null;
};

// SETUP

const client: Client = new Client();
const songQueue: Map<string, QueueContract> = new Map<string, QueueContract>();

client.login(process.env.BOT_TOKEN);

// HOOKS

client.on("ready", () => {
    if (client && client.user) {
        console.log(`Logged in as ${client.user.tag}!`);
    }
});

client.on("message", async (msg) => {
    // don't let the bot talk to itself
    if (msg.author.bot) return;

    // say hi when user mentions bot
    if (client.user && msg.mentions.has(client.user)) msg.reply("Hi!");

    // handle commands
    if (!msg.content.startsWith("!")) return;

    if (msg.content.startsWith("!play")) {
        play(msg);
        return;
    } else if (msg.content.startsWith("!queue")) {
        queue(msg);
        return;
    } else if (msg.content.startsWith("!pause")) {
        pause(msg);
        return;
    } else if (msg.content.startsWith("!skip")) {
        skip(msg);
        return;
    } else if (msg.content.startsWith("!volume")) {
        setVolume(msg);
        return;
    } else if (msg.content.startsWith("!stop")) {
        stop(msg);
        return;
    } else {
        msg.reply("That is not a valid command");
        return;
    }
});

// FUNCTIONS

async function play(message: Message) {
    const [_, url] = message.content.split(" ");

    if (!message.member || !message.guild) return;

    // verify url validity
    try {
        new URL(url);
    } catch (error) {
        message.reply("You did not give me a valid url.");
    }

    // verify if user is in voice channel for bot to join
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.reply(
            "You need to be in a voice channel to play music."
        );

    // verify if bot has permissions
    const permissions = voiceChannel.permissionsFor(message.client.user!);
    if (
        !permissions ||
        !permissions.has("CONNECT") ||
        !permissions.has("SPEAK")
    )
        return message.reply(
            "I don't have the right permissions to join and speak in your voice channel."
        );

    // get song info from youtube url
    let songInfo: ytdl.videoInfo = await ytdl.getInfo(url);

    const song: YTDLSong = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    // set up a queue contract for the discord api
    const queueContract: QueueContract = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 1,
        playing: true,
    };
    queueContract.songs.push(song);

    // add the contract with the song to the queue
    songQueue.set(message.guild.id, queueContract);

    // try to connect to a voicechannel and play the first song in the queue
    try {
        var connection = await voiceChannel.join();

        queueContract.connection = connection;

        const channelQueue = songQueue.get(message.guild.id);

        if (channelQueue) {
            if (!song || !song.url) {
                channelQueue.voiceChannel.leave();
                songQueue.delete(message.guild.id);
                return;
            }
            if (channelQueue.connection) {
                const dispatcher = channelQueue.connection
                    .play(ytdl(song.url))
                    .on("finish", () => {
                        channelQueue.songs.shift();
                        play(message);
                    })
                    .on("error", (error) => console.error(error));
                dispatcher.setVolumeLogarithmic(channelQueue.volume / 5);
                console.log(`Start playing: **${song.title}**`);
                channelQueue.textChannel.send(
                    `Start playing: **${song.title}**`
                );
            }
        }
    } catch (err) {
        if (err instanceof Error) {
            console.error(err);
            songQueue.delete(message.guild.id);
            return message.channel.send(err.message);
        }
    }
}

function queue(msg: Message) {
    msg.reply("This functionality is not yet implemented.");

    // if there is already a queue, add song request to the queue
    // if (queueItem) {
    //     queueItem.songs.push(song);
    //     console.log(queueItem.songs);
    //     return message.reply("Your song has been added to the queue!");
    // }
}

function pause(msg: Message) {
    msg.reply("This functionality is not yet implemented.");
}

function skip(msg: Message) {
    msg.reply("This functionality is not yet implemented.");
}

function setVolume(msg: Message) {
    msg.reply("This functionality is not yet implemented.");
}

function stop(msg: Message) {
    msg.reply("This functionality is not yet implemented.");
}
