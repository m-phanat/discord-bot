const { Util, MessageEmbed } = require('discord.js')
const config = require('../../config.json')
const axios = require('axios')
const YouTube = require('simple-youtube-api')
const youtube = new YouTube(config.youtube.key)
const ytdl = require('ytdl-core')

module.exports = {
  name: 'play',
  aliases: ['p'],
  description: 'Play a song in your channel!',
  async execute(message) {
    try {
      const args = message.content.split(' ')
      const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : ''
      const queue = message.client.queue
      const serverQueue = message.client.queue.get(message.guild.id)
      var related_videos_id = ''

      if (!args[0]) return message.channel.send('**Please Enter Song Name Or Link!**')

      const voiceChannel = message.member.voice.channel
      if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music!')
      const permissions = voiceChannel.permissionsFor(message.client.user)
      if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send('I need the permissions to join and speak in your voice channel!')
      }

      if (message.member.voice.channel) {
        await message.member.voice.channel.join()
      }

      if (url.includes('youtube')) {
        handleVideo(url)
      } else {
        console.log(args.slice(1).join(' '))
        var videos = await youtube.searchVideos(args.slice(1).join(' '), 10)
        handleVideo(`https://www.youtube.com/watch?v=${videos[0].id}`)
      }

      async function handleVideo(url) {
        const songInfo = await ytdl.getInfo(url)

        related_videos_id = songInfo.related_videos[0].id
        const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          time: songInfo.videoDetails.lengthSeconds
        }

        if (!serverQueue) {
          const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
          }

          queue.set(message.guild.id, queueContruct)

          queueContruct.songs.push(song)

          try {
            var connection = await voiceChannel.join()
            queueContruct.connection = connection
            play(queueContruct.songs[0])
          } catch (err) {
            console.log(err)
            queue.delete(message.guild.id)
            return message.channel.send(err)
          }
        } else {
          serverQueue.songs.push(song)
          const embed = new MessageEmbed()
            .setColor('PURPLE')
            .setDescription(`${song.title} has been added to the queue!`)
          return message.channel.send(embed)
        }
      }

      async function play(song) {
        const queue = message.client.queue
        const guild = message.guild
        const serverQueue = queue.get(message.guild.id)

        if (!song) {
          // serverQueue.voiceChannel.leave();
          console.log('empty queue')
          if (message.client.isAutoPlay) {
            handleVideo(`https://www.youtube.com/watch?v=${related_videos_id}`)
          } else {
            queue.delete(guild.id)
          }

          return
        }
        let npmin = Math.floor(song.time / 60)
        let npsec = song.time - npmin * 60
        let np = `${npmin}:${npsec}`.split(' ')
        let send = ''

        const dispatcher = serverQueue.connection
          .play(ytdl(song.url, { highWaterMark: 1 << 20, quality: 'highestaudio' }))
          .on('finish', () => {
            try {
              message.channel.messages
                .fetch(send.id)
                .then((message) => console.log(message.delete()))
                .catch(console.error)
            } catch (error) {
              message.channel.send(error.message)
            }

            serverQueue.songs.shift()
            play(serverQueue.songs[0])
          })
          .on('error', (error) => console.error(error))
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)

        const embed = new MessageEmbed()
          .setColor('GREEN')
          .setTitle('Now playing')
          .setDescription(`[${song.title}](${song.url})`)

        send = await serverQueue.textChannel.send(embed)
        console.log(send.id)
      }
    } catch (error) {
      console.log(error)
      message.channel.send(error.message)
    }
  }
}
