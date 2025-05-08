# Discord Anime Watch Party Bot (Terebi)

This is a bot I made to create watch parties on Discord, it can also recommend anime and stuff. :D

The primary database is MongoDB but have since added support for MySQL, all you have to supply your `.env` file with necessary values.

## Installation

1. Create a `.env` in the base directory and replace the values with your own. If you are using MongoDB then you can leave the MySQL details as `""`.

```
BOT_TOKEN=bot_token
MONGO_URI=mongo_db_uri
CLIENT_ID=bot_client
GUILD_ID=server_id
WATCH_PARTY_CHANNEL_ID=voice_channel_id
WATCH_PARTY_HOST_ROLE_ID=role_id
WATCH_PARTY_ROLE_ID=role_id
WATCH_PARTY_TEXT_CHANNEL_ID=text_channel_id
MYSQL_HOST=mysql_host
MYSQL_USERNAME=mysql_username
MYSQL_PASSWORD=mysql_password
MYSQL_DATABASE=mysql_database
```

2. Run `npm install` in your terminal
3. Run `node deploy-commands.js` to deploy the slash commands
4. Run `node index.js` to run the bot
5. Have fun!

## Commands

- `/setupparty [day] [time] [duration] [title] [episode] [repeat] [season (optional)]` - Use this to create watch parties, automatically adds an event to the server. Repeat will be checked by a cron and added ever week on the same day. The current episode will be auto incremented.
- `/pause` - Use this to select a watch party to pause or resume it, this will prevent the cron from creating a repeat event.
- `/cancelparty` - Cancels the selected watch party.
- `/listparties` - Displays all active watch parties.
- `/current` - Shows the current anime being watched.
- `/searchanime [title]` - Searches for an anime then gives you a list to select from to give more details.
- `/searchgenre [genre]` - Gives you 5 recommendations from an autocomplete list of genres.
- `/recommend` - Gives you 5 random recommendations from high rated animes.
- `/character [name]` - Search for a character to get details on them.
- `/setepisode [number]` - Sets the current anime episode number (kinda useless at the moment)
- `/setanime [title]` - Sets the current anime of the bot (also useless but it does override the presence of the bot)
- `/next` - Increments the episode number of the current anime (also also useless right now)

## Using

- [AniList API](https://docs.anilist.co/)
- [discord.js](https://discord.js.org/)
- [MongoDB](https://www.mongodb.com/)
- [MySQL](https://www.mysql.com/)

## License

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## Support

[![Buy Me a Coffee](https://img.shields.io/badge/buy_me_a_coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/desypher)
