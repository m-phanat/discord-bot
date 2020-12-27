module.exports = {
  name: 'disconnect',
  description: 'leave this channel',
  aliases: ['d'],
  async execute(message) {
    const serverQueue = message.client.queue.get(message.guild.id)
    if (!message.member.voice.channel)
      return message.channel.send('You have to be in a voice channel to stop the music!')
    if (!serverQueue) return
    serverQueue.songs = []
    message.client.isAutoPlay = false
    serverQueue.connection.dispatcher.end()
    const { channel } = message.member.voice
    await channel.leave()
  }
}
