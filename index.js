const fs = require('fs')
const Discord = require('discord.js')
const Client = require('./client/Client')
const { token, prefix } = require('./config.json')

const client = new Client()
client.commands = new Discord.Collection()

const load = (dirs) => {
  const commandFiles = fs.readdirSync(`./commands/${dirs}`).filter((file) => file.endsWith('.js'))
  for (const file of commandFiles) {
    const command = require(`./commands/${dirs}/${file}`)
    client.commands.set(command.name, command)
  }
}

;['music', 'old'].forEach((x) => load(x))

client.once('ready', () => {
  console.log('Ready!')
  client.user.setPresence({
    status: 'online', //You can show online, idle....
    game: {
      name: 'Using .help', //The message shown
      type: 'STREAMING' //PLAYING: WATCHING: LISTENING: STREAMING:
    }
  })
  client.user.setActivity('with the music')
})

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return

  //   const serverQueue = queue.1get(message.guild.id)

  const args = message.content.slice(prefix.length).trim().split(/ +/)
  const commandName = args.shift().toLowerCase()

  const command =
    client.commands.get(commandName) || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName))

  if (!command) return
  try {
    command.execute(message, args)
  } catch (error) {
    console.error(error)
    message.reply('there was an error trying to execute that command!')
  }
})

client.on('voiceStateUpdate', (oldState, newState) => {
  // check if someone connects or disconnects
  if (oldState.channelID === null || typeof oldState.channelID == 'undefined') return
  // check if the bot is disconnecting
  if (newState.id !== client.user.id) return
  // clear the queue
  return client.queue.delete(oldState.guild.id)
})

client.on('disconnect', function (message) {
  console.log(`Bot DISCONNECTED at ${new Date().toISOString()}`)
  console.log('Attempting reconnect...')
  const serverQueue = message.client.queue.get(message.guild.id)
  serverQueue.connection.dispatcher.end()
  serverQueue.songs.shift()
  message.client.isAutoPlay = false
  // client.connect()
  // if (bot.connected == true) {
  //   console.log('Reconnected to Discord')
  // } else {
  //   console.log('Reconnect failed...')
  // }
})

client.login(token)
;('use strict')

// [START gae_node_request_example]
const express = require('express')

const app = express()

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!').end()
})

// Start the server
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})
// [END gae_node_request_example]

module.exports = app
