const { MessageEmbed } = require('discord.js')

module.exports = {
  name: 'disconnect',
  aliases: ['d'],
  description: 'disconnect',
  async execute(message) {
    const { channel } = message.member.voice

    const serverQueue = message.client.queue.get(message.guild.id)
    if (!channel) return message.reply('You need to join a voice channel first!').catch(console.error)
    if (serverQueue && channel !== message.guild.me.voice.channel) return message.react('🖐').catch(console.error)

    try {
      serverQueue.songs = []
      serverQueue.connection.dispatcher.end()
    } catch (e) {
      console.log(e)
    }
    message.client.autoplayID = ''
    message.client.autoplay = false
    message.react('🖐').catch(console.error)
    await channel.leave()
  }
}
