require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
} = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const CurrentAnime = require("./database/CurrentAnime");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const currentAnime = await CurrentAnime.findOne();
  if (currentAnime) {
    client.user.setPresence({
      activities: [
        { name: currentAnime.animeTitle, type: ActivityType.Watching },
      ],
    });
  } else {
    client.user.setPresence({
      activities: [{ name: "anime", type: ActivityType.Watching }],
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error executing this command!",
      ephemeral: true,
    });
  }
});

client.login(process.env.BOT_TOKEN);
