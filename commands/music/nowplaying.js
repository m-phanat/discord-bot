const { MessageEmbed } = require('discord.js')
module.exports = {
  name: 'nowplaying',
  description: 'Get the song that is playing.',
  aliases: ['np'],
  execute(message) {
    const serverQueue = message.client.queue.get(message.guild.id)
    if (!serverQueue) return message.channel.send('There is nothing playing.')
    const embed = new MessageEmbed()
      .setColor('BLUE')
      .setTitle(`Now Playing \n ${serverQueue.songs[0].title}\n`)
      .setThumbnail(serverQueue.songs[0].thumbnail)
      .setTimestamp()
      .setFooter(message.member.displayName, message.author.displayAvatarURL())

    serverQueue.textChannel.send(embed)
  }
}
