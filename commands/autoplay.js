const { MessageEmbed } = require("discord.js");
module.exports = {
  name: "autoplay",
  description: "autoplay music",
  async execute(message, args) {
    const { channel } = message.member.voice;
    const serverQueue = message.client.queue.get(message.guild.id);
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.reply("There is nothing playing.").catch(console.error);
    if (!channel) return message.reply("You need to join a voice channel first!").catch(console.error);
    message.client.autoplay = true;
    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message.reply(`You must be in the same channel as ${message.client.user}`).catch(console.error);
    const embed = new MessageEmbed().setColor("GRAY").setDescription("AutoPlay is now enabled");
    message.channel.send(embed);
  }
};
