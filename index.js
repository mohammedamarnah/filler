const Discord = require('discord.js');
const Redis = require("redis");
const Filler = require("./filler.js");

const bot = new Discord.Client();
const client = Redis.createClient();

const TOKEN = process.env.DISCORD_TOKEN;

const available_commands = {
  "new_game": "initializes a new game.",
  "end_game [id]": "ends a running game.",
  "move [id] [move]": "applies a move to a running game.",
  "leaderboard": "shows the leaderboard.",
  "help": "lists all commands that you can use."
};

const size = [8, 8];
const shapes = ['B', 'R', 'G', 'Y', 'P', 'b'];

function printAvailableCommands(msg) {
  let result = "Here are some commands that you can use:\n";
  for (command in available_commands) {
    result += `\`!filler ${command}\` - ${available_commands[command]}\n`;
  }
  msg.reply(result);
}

function new_game(msg) {
  client.incr("last_game_id", (err, res) => {
    if (!err) {
      let game = new Filler(res, size, shapes);
      game.generate_board();
      game.save_redis(client, msg, true);
      delete game;
    }
  });
}

function apply_move(msg, json_game, move) {
  let game = new Filler();
  game.parse_json(json_game);
  game.apply_move(move, msg)
  game.save_redis(client, msg);
  delete game;
}

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
  if (msg.content.startsWith("!filler")) {
    let command = msg.content.split(" ");
    switch(command[1]) {
      case "new_game":
        new_game(msg);
        break;
      case "move":
        client.hget("games", command[2], (err, res) => {
          if (err || !res) {
            msg.reply("There are no running games with that id. Create a new game using '!filler new_game'.");
            return;
          }
          apply_move(msg, res, command[3]);
        });
        break;
      case "end_game":
        client.hdel("games", command[2], (err, res) => {
          if (err || !res) {
            msg.reply("There are no running games with that id. Please provide a game id to end.");
            return;
          }
          msg.reply(`game with id ${command[2]} ended successfully.`);
        });
        break;
      case "leaderboard":
        break;
      case "help":
        printAvailableCommands(msg);
        break;
      default:
        msg.reply(`Command '${command[1]}' not found.\nTry '!filler help' for all possible commands.`);
    }
  }
});

