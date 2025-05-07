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

## Using

- [AniList API](https://docs.anilist.co/)
- [discord.js](https://discord.js.org/)
- [MongoDB](https://www.mongodb.com/)
- [MySQL](https://www.mysql.com/)

## License

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
