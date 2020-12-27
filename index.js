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
})

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return

  //   const serverQueue = queue.get(message.guild.id)

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

client.login(token)
