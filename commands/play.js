const { play } = require('../include/play')
const ytdl = require('ytdl-core')
const YouTubeAPI = require('simple-youtube-api')
const scdl = require('soundcloud-downloader').default
const https = require('https')
const {
  YOUTUBE_API_KEY,
  SOUNDCLOUD_CLIENT_ID,
  DEFAULT_VOLUME,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET
} = require('../util/Utils')
const youtube = new YouTubeAPI(YOUTUBE_API_KEY)
const { MessageEmbed } = require('discord.js')
const spotifyUri = require('spotify-uri')
const axios = require('axios')

module.exports = {
  name: 'play',
  cooldown: 3,
  aliases: ['p'],
  description: 'Plays audio from YouTube or Soundcloud',
  async execute(message, args) {
    const { channel } = message.member.voice

    const serverQueue = message.client.queue.get(message.guild.id)
    if (!channel) return message.reply('You need to join a voice channel first!').catch(console.error)
    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message.reply(`You must be in the same channel as ${message.client.user}`).catch(console.error)

    if (!args.length)
      return message
        .reply(`Usage: ${message.client.prefix}play <YouTube URL | Video Name | Soundcloud URL>`)
        .catch(console.error)

    const permissions = channel.permissionsFor(message.client.user)
    if (!permissions.has('CONNECT')) return message.reply('Cannot connect to voice channel, missing permissions')
    if (!permissions.has('SPEAK'))
      return message.reply('I cannot speak in this voice channel, make sure I have the proper permissions!')

    const search = args.join(' ')
    const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi
    const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi
    const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/
    const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/
    const spotifyRegex = /((http|https)\:\/\/(open\.)*(spotify\.com\/)(track|album|playlist))/gi
    const url = args[0]
    const urlValid = videoPattern.test(args[0])

    // Start the playlist if playlist url was provided
    if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
      return message.client.commands.get('playlist').execute(message, args)
    } else if (scdl.isValidUrl(url) && url.includes('/sets/')) {
      return message.client.commands.get('playlist').execute(message, args)
    }

    if (mobileScRegex.test(url)) {
      try {
        https.get(url, function (res) {
          if (res.statusCode == '302') {
            return message.client.commands.get('play').execute(message, [res.headers.location])
          } else {
            return message.reply('No content could be found at that url.').catch(console.error)
          }
        })
      } catch (error) {
        console.error(error)
        return message.reply(error.message).catch(console.error)
      }
      return message.reply('Following url redirection...').catch(console.error)
    }

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: DEFAULT_VOLUME || 100,
      playing: true
    }

    let songInfo = null
    let song = null

    if (urlValid) {
      try {
        songInfo = await ytdl.getInfo(url)
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds
        }
        let items = songInfo.related_videos.filter((item) => item.length_seconds < 600)
        let item = items[Math.floor(Math.random() * items.length)]
        // console.log(items, items);
        message.client.autoplayID = item && item.id ? item.id : ''
        creatQueue(song)
      } catch (error) {
        console.error(error)
        return message.reply(error.message).catch(console.error)
      }
    } else if (scRegex.test(url)) {
      try {
        const trackInfo = await scdl.getInfo(url, SOUNDCLOUD_CLIENT_ID)
        song = {
          title: trackInfo.title,
          url: trackInfo.permalink_url,
          duration: Math.ceil(trackInfo.duration / 1000)
        }
        creatQueue(song)
      } catch (error) {
        console.error(error)
        return message.reply(error.message).catch(console.error)
      }
    } else if (spotifyRegex.test(url)) {
      async function playSpotifyTrack(spotify_track_id, uri) {
        const spotify_track_response = await axios.get(
          `https://api.spotify.com/v1/tracks/${spotify_track_id}?access_token=${spotify_access_token}`
        )
        // console.log('spotify_track_response.data', spotify_track_response.data)

        const spotify_track_name = spotify_track_response.data.name
        const spotify_artists_names = spotify_track_response.data.artists.map((artist) => artist.name).join(', ')
        const spotify_track_name_by_artists = `${spotify_track_name} by ${spotify_artists_names}`

        // console.log(search)
        const results = await youtube.searchVideos(spotify_track_name_by_artists, 1)
        songInfo = await ytdl.getInfo(results[0].url)
        let items = songInfo.related_videos.filter((item) => item.length_seconds < 600)
        let item = items[Math.floor(Math.random() * items.length)]
        // console.log(items, items);
        message.client.autoplayID = item && item.id ? item.id : ''

        song = {
          title: spotify_track_name_by_artists,
          url: songInfo.videoDetails.video_url,
          spotify_url: uri,
          duration: songInfo.videoDetails.lengthSeconds
        }
        creatQueue(song)
      }

      let parsed_uri_data
      try {
        parsed_uri_data = spotifyUri.parse(url)
      } catch (error) {
        console.error(error)
      }
      console.log('parsed_data', parsed_uri_data)

      if (!parsed_uri_data) {
        /* nothing could be parsed from the input */
        let m = new MessageEmbed().setColor('RED').setDescription(`I don't think that was a valid spotify url!`)
        message.channel.send(m)
        return
      }

      const spotify_access_token = await get_spotify_access_token()

      if (parsed_uri_data.type === 'playlist' || parsed_uri_data.type === 'album') {
        // await playSpotifyTracks(parsed_uri_data.id, parsed_uri_data.type)
      } else if (parsed_uri_data.type === 'track') {
        try {
          await playSpotifyTrack(parsed_uri_data.id, parsed_uri_data.uri)
        } catch (error) {
          console.error(error)
          return message.reply(error.message).catch(console.error)
        }
      } else {
        /* the parsed uri is not for a track or playlist */
        let m = new MessageEmbed().setColor('RED').setDescription(`I can only play spotify song/track urls!`)
        message.channel.send(m)
        return
      }
      return
    } else {
      try {
        const results = await youtube.searchVideos(search, 1)
        songInfo = await ytdl.getInfo(results[0].url)
        let items = songInfo.related_videos.filter((item) => item.length_seconds < 600)
        let item = items[Math.floor(Math.random() * items.length)]
        // console.log(items, items);
        message.client.autoplayID = item && item.id ? item.id : ''

        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds
        }
        creatQueue(song)
      } catch (error) {
        console.error(error)
        // return message.reply(error.message).catch(console.error)
      }
    }

    async function creatQueue(song) {
      if (serverQueue) {
        serverQueue.songs.push(song)

        const embed = new MessageEmbed().setColor('PURPLE').setDescription(`${song.title} has been added to the queue!`)
        return message.channel.send(embed).catch(console.error)
      }

      queueConstruct.songs.push(song)
      message.client.queue.set(message.guild.id, queueConstruct)

      try {
        queueConstruct.connection = await channel.join()
        await queueConstruct.connection.voice.setSelfDeaf(false)
        play(queueConstruct.songs[0], message)
      } catch (error) {
        console.error(error)
        message.client.queue.delete(message.guild.id)
        await channel.leave()
        return message.channel.send(`Could not join the channel: ${error}`).catch(console.error)
      }
    }
  }
}

//---------------------------------------------------------------------------------------------------------------//

async function get_spotify_access_token() {
  const base64_encoded_authorization = new Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
    `base64`
  )

  const spotify_auth_response = await axios({
    url: 'https://accounts.spotify.com/api/token?grant_type=client_credentials',
    method: 'POST',
    headers: {
      Authorization: `Basic ${base64_encoded_authorization}`,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  return spotify_auth_response.data.access_token
}
