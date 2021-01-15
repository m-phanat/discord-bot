const { canModifyQueue } = require('../util/Utils')

module.exports = {
  name: 'clear',
  description: 'Clear song from the queue',
  execute(message, args) {
    const queue = message.client.queue.get(message.guild.id)
    if (!queue) return message.channel.send('There is no queue.').catch(console.error)
    if (!canModifyQueue(message.member)) return

    //if (!args.length) return message.reply(`Usage: ${message.client.prefix}remove <Queue Number>`)
    //if (isNaN(args[0])) return message.reply(`Usage: ${message.client.prefix}remove <Queue Number>`)
    console.log(queue.songs)
    queue.songs.length = 0
    queue.textChannel.send(`${message.author} ❌ clear songs from the queue.`)
  }
}
