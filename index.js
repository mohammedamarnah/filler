const Discord = require('discord.js');
const Redis = require("redis");
const Filler = require("./filler.js");

const bot = new Discord.Client();
// const client = Redis.createClient();

const TOKEN = 'ODI3NTU0NzgxNTgwNjIzOTMy.YGcucw.ClzsHRSxtlw-eWVnvV-JbQCBhuA';

const available_commands = {
  "new_game": "initializes a new game.",
  "end_game": "ends a running game.",
  "leaderboard": "shows the leaderboard.",
  "help": "lists all commands that you can use."
};

const size = [6, 6];
const shapes = ['*', '-', '^', '#', '@', '!'];
let global_game = "";

function printAvailableCommands(msg) {
  let result = "Here are some commands that you can use:\n";
  for (command in available_commands) {
    result += `!filler ${command} - ${available_commands[command]}\n`;
  }
  msg.reply(result);
}

function new_game(msg) {
  let game = new Filler(size, shapes);
  game.generate_board();
  global_game = game.to_json();
  game.send_update(msg);
  delete game;
}

function apply_move(msg, move) {
  let game = new Filler();
  game.parse_json(global_game);
  game.apply_move(move, msg);
  global_game = game.to_json();
  game.send_update(msg);
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
        if (global_game === "") {
          msg.reply("There are no running games. Create a new game using '!filler new_game'.");
          return;
        }
        apply_move(msg, command[2]);
        break;
      case "help":
        printAvailableCommands(msg);
        break;
      default:
        msg.reply(`Command '${command[1]}' not found.\nTry '!filler help' for all possible commands.`);
    }
  }
});

