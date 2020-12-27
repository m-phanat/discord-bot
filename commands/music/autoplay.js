const { Util, MessageEmbed } = require('discord.js')
const config = require('../../config.json')
const YouTube = require('simple-youtube-api')
const youtube = new YouTube(config.youtube.key)
const ytdl = require('ytdl-core')

module.exports = {
  name: 'autoplay',
  description: 'auto play a song in your channel!',
  async execute(message) {
    const channel = message.channel
    if (!channel) return
    message.client.isAutoPlay = true
    const embed = new MessageEmbed().setColor('GRAY').setDescription('AutoPlay is now enabled')
    channel.send(embed)
  }
}
