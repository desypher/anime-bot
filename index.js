require("dotenv").config();
const initializeWatchPartyCron = require("./crons/eventRepeater");
const {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
  MessageFlags,
} = require("discord.js");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const CurrentAnime = require("./database/helpers/currentAnime");
const db = require("./db");
const { isValidTimeZone } = require("./utils/validateTimeZone");

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
  console.log(`✅ Logged in as ${client.user.tag}`);
  initializeWatchPartyCron(client);
  console.log("⏳ Cron started");
  console.log(
    `Current timezone detected as ${
      Intl.DateTimeFormat().resolvedOptions().timeZone
    }`
  );
  if (process.env.TIMEZONE) {
    console.log(`🔄 Updating timezone to ${process.env.TIMEZONE}`);
    if (!isValidTimeZone(process.env.TIMEZONE)) {
      console.error(
        `❌ Invalid timezone: ${process.env.TIMEZONE}. Please set a valid timezone.`
      );
    } else {
      process.env.TZ = process.env.TIMEZONE;
      console.log(
        `🕒 Timezone set to ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
      );
    }
  }
  await db.initDatabases();

  const currentAnime = await CurrentAnime.getCurrent(process.env.GUILD_ID);
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
  console.log(
    `✅ ${process.env.BOT_NAME || "Terebi"} has successfully started!`
  );
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.isStringSelectMenu()) {
    try {
      const handler = require(`./components/${interaction.customId}.js`);
      await handler.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error handling your selection!",
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
    return;
  }
});

client.login(process.env.BOT_TOKEN);
