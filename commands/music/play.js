const { Util, MessageEmbed } = require('discord.js')
const config = require('../../config.json')
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
        var link = await youtube.getVideoByID(videos[0].id)
        handleVideo(`https://www.youtube.com/watch?v=${link.id}`)
      }
      async function handleVideo(url) {
        const songInfo = await ytdl.getInfo(url)
        const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url
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
          return message.channel.send(`${song.title} has been added to the queue!`)
        }
      }

      function play(song) {
        const queue = message.client.queue
        const guild = message.guild
        const serverQueue = queue.get(message.guild.id)

        if (!song) {
          // serverQueue.voiceChannel.leave();
          queue.delete(guild.id)
          return
        }

        // let npmin = Math.floor(song.time / 60)
        // let npsec = song.time - npmin * 60
        // let np = `${npmin}:${npsec}`.split(' ')

        const dispatcher = serverQueue.connection
          .play(ytdl(song.url, { highWaterMark: 1 << 20, quality: 'highestaudio' }))
          .on('finish', () => {
            serverQueue.songs.shift()
            play(serverQueue.songs[0])
          })
          .on('error', (error) => console.error(error))
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)

        const embed = new MessageEmbed()
          .setColor('GREEN')
          .setTitle('Now Playing\n')
          .setThumbnail(song.thumbnail)
          .setTimestamp()
          .setDescription(`🎵 Now playing:\n **${song.title}** 🎵\n`)
          .setFooter(message.member.displayName, message.author.displayAvatarURL())
        serverQueue.textChannel.send(embed)
      }
    } catch (error) {
      console.log(error)
      message.channel.send(error.message)
    }
  }
}
