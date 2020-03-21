/**
 */
class Game {

  static games = new Map();
  static count = 0;
  /** @type {Map<string, SocketIO.Socket>} */
  players = new Map();
  rounds = [];
  name;

  /**
   *
   * @param {SocketIO.Namespace} nsp
   * @param {SocketIO.Socket} master
   */
  constructor(master) {
    this.master = master;
    this.init();
  }

  init = () => {
    const name = `game${++Game.count}`;
    Game.games.set(name, this);
    this.name = name;

    this.addMasterListeners();
    this.sendSummary();
  };

  /**
   * @param {SocketIO.Socket} player
   */
  addPlayer = player => {
    player.join(this.name, (err) => {
      if (err) throw err;
      this.players.set(player.id, player);
      player.on('disconnect', () => this.onDisconnection(player.id));
      player.on('pick', value => this.pick(player.id, value));

      this.sendSummary();
    });
  };

  onDisconnection = id => {
    this.players.delete(id);

    this.sendSummary();
  };

  addMasterListeners = () => {
    this.master.on('stop', this.close);
    this.master.on('startRound', this.newRound);
    this.master.on('stopRound', this.reveal);
  };

  removeMasterListeners = () => {
    this.master.removeListener('stop', this.close);
    this.master.removeListener('startRound', this.newRound);
    this.master.removeListener('stopRound', this.reveal);
  };

  close = () => {
    this.players.forEach(player => {
      player.leave(this.name, err => {
        if (err) throw err;

        player.emit('end');
      });
    });

    this.master.emit('end');
    this.removeMasterListeners();
    Game.games.delete(this.name);
  };

  sendSummary = () => {
    this.master.emit('summary', this.getSummary());
    this.master.in(this.name).emit('roundUpdate', this.getSummary(true));
  };

  getSummary = (hideMoves = false) => ({
    name: this.name,
    players: [...this.players.keys()],
    rounds: this.rounds.map(round => ({
      ...round,
      moves: hideMoves && round.running ? this.hideMoves(round.moves) : round.moves,
    }))
  });

  getCurrentRound = () => {
    const current = this.rounds.length && this.rounds[this.rounds.length -1];

    return !!current && current.running
      ? current
      : null;
  };

  newRound = () => {
    const current = this.getCurrentRound();

    if (!!current) {
      return;
    }

    this.rounds.push({
      moves: {},
      running: true,
    });

    this.sendSummary();
  };

  reveal = () => {
    const current = this.getCurrentRound();

    if (!current) {
      return;
    }

    current.running = false;

    this.sendSummary();
  }

  hideMoves = moves => Object.keys(moves).reduce((p, n) => ({ ...p, [n]: null}), {});

  pick = (id, value) => {
    const current = this.getCurrentRound();

    if (!current || !!current.moves[id]) {
      return;
    }

    current.moves[id] = value;

    const playersWhoPicked = Object.keys(current.moves);
    if ([...this.players.keys()].every(p => playersWhoPicked.includes(p))) {
      this.reveal();
    } else {
      this.sendSummary();
    }
  };

}

module.exports = Game;
