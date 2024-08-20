const { Events } = require("discord.js");

// Cooldown settings
const COOLDOWN_TIME = 60000;
let lastReset = Date.now();

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {

    if (message.author.bot) return;

    const fish = "you know what that means";
    const yippee = "yippee";
    // console.log("reset " + lastReset)
    // console.log("date.now " + Date.now())
    if (Date.now() - lastReset > COOLDOWN_TIME) {
      // console.log("buh")
      // Reset the timer
      lastReset = Date.now();

      if (message.content.toLowerCase().includes(fish.toLowerCase())) {
        await message.reply(
          "https://cdn.discordapp.com/attachments/851596893678731267/1231435106242269285/YouKnowWhatThatMeansFRC.gif?ex=66c4ab90&is=66c35a10&hm=5df2dea8dfa3a057298f443afabf534717e8c9e06422449db3661d5701116cec&"
        );
      }
      if (message.content.toLowerCase().includes(yippee.toLowerCase())) {
        await message.reply(
          "https://media.discordapp.net/attachments/1228490698932752454/1266526296549363755/Yippee1.gif?ex=66c51c08&is=66c3ca88&hm=30a3ea9d4c2a6e05b0853e9c3e18dc829b5fb6ffe6890bc4ad6096dbe7d6330e&=&width=128&height=128"
        );
      }
    }
  },
};
