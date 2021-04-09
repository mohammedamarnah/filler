const { exec } = require('child_process');

module.exports = class Filler {
  // TODO: get/generate game `id` when
  // initializing a new game.
  constructor(id = -1, size = [], shapes = []) {
    this.id = id;
    this.size = size;
    this.shapes = shapes;
    this.board = [];
    this.turn = 0;
    this.player_indices = {
      0: [[size[0] - 1, 0]],
      1: [[0, size[1] - 1]]
    };
    this.last_move = '';
  }

  get raw_board() {
    if (this.board) {
      return this.board;
    }
    return [];
  }

  get pretty_board() {
    let board_str = ""
    for (let i = 0; i < this.size[0]; i++) {
      for (let j = 0; j < this.size[1]; j++) {
        board_str += this.board[i][j];
        board_str += "\t";
      }
      board_str += "\n";
    }
    return board_str;
  }

  get is_game_finished() {
    return [... new Set(this.board.flat())].length == 2;
  }

  get legal_moves() {
    let indices = this.player_indices[this.turn];
    let dirs = [
      [+1, 0],
      [-1, 0],
      [0, +1],
      [0, -1]
    ];
    let moves = []
    let moves_indices = []
    for (let i = 0; i < indices.length; i++) {
      let index = indices[i];
      for (let j = 0; j < dirs.length; j++) {
        let dir = dirs[j];
        let new_x = index[0] + dir[0];
        let new_y = index[1] + dir[1];

        if (new_x < 0 || new_x >= this.size[0] ||
          new_y < 0 || new_y >= this.size[1] ||
          moves.includes(this.board[new_x][new_y]) ||
          this.board[new_x][new_y] == this.last_move) {
          continue;
        }

        moves.push(this.board[new_x][new_y]);
        moves_indices.push([new_x, new_y]);
      }
    }
    return [moves, moves_indices]
  }

  get winner() {
    if (this.player_indices[0] > this.player_indices[1])
      return 0;
    return 1;
  }

  // Temporary function to save the idea of it
  // and move to the construct_image logic.
  fill_square_submatrices(n) {
    let temp_board = this.board;
    for (let row = 0; row <= this.size[0] - n; row += n) {
      for (let col = 0; col <= this.size[1] - n; col += n) {
        let el = Math.floor(Math.random() * this.shapes.length);
        for (let i = row; i < row + n; i++) {
          for (let j = col; j < col + n; j++) {
            temp_board[i][j] = this.shapes[el];
          }
        }
      }
    }
    return temp_board;
  }

  generate_board() {
    for (let i = 0; i < this.size[0]; i++) {
      let row = []
      for (let j = 0; j < this.size[1]; j++) {
        let el = Math.floor(Math.random() * this.shapes.length);
        row.push(this.shapes[el]);
      }
      this.board.push(row);
    }
  }

  parse_json(saved_game) {
    let game = JSON.parse(saved_game);
    this.board = game['board'];
    this.size = game['size'];
    this.shapes = game['shapes'];
    this.turn = game['turn'];
    this.player_indices = game['player_indices'];
    this.last_move = game['last_move'];
  }

  to_json() {
    let game = {
      id: this.id,
      board: this.board,
      size: this.size,
      shapes: this.shapes,
      turn: this.turn,
      player_indices: this.player_indices,
      last_move: this.last_move
    }
    return JSON.stringify(game);
  }

  apply_move(move, msg) {
    let moves = this.legal_moves[0];
    let indices = this.legal_moves[1];

    if (!moves.includes(move)) {
      msg.channel.send("Invalid move");
      return;
    }

    let index = indices.find((x) => { return this.board[x[0]][x[1]] == move });
    let current_indices = this.player_indices[this.turn];
    for (let i = 0; i < current_indices.length; i++) {
      let idx = current_indices[i];
      this.board[idx[0]][idx[1]] = move;
    }

    this.player_indices[this.turn].push(index);
    this.turn ^= 1;
    this.last_move = move;
  }

  send_update(msg, first_time = false) {
    msg.channel.send("", {files: [`${this.id}.png`]})
    .then(_ => {
      if (first_time) {
        msg.channel.send(`Your game id is ${this.id}`);
        msg.channel.send("Play your move by sending `!filler move [id] [move]`")
      }
      if (this.is_game_finished) {
        msg.channel.send(`Game Finished! Player ${this.winner} wins!`);
      } else {
        msg.channel.send(`Player 0: ${this.player_indices[0].length} blocks.`);
        msg.channel.send(`Player 1: ${this.player_indices[1].length} blocks.`);
        msg.channel.send(`Player Turn: ${this.turn}\nChoose one of the following:\n${this.legal_moves[0]}`);
      }
    })
    .catch(console.error);
  }

  save_redis(client, msg, first_time = false) {
    client.hset("games", this.id, this.to_json(), (err, res) => {
      if (err) {
        console.error(err);
        return;
      }
      let cmd = `python3 image_construct.py \'${this.to_json()}\'`;
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }
        this.send_update(msg, first_time);
      });
    });
  }
}
