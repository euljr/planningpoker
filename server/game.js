class Game {

  static games = new Map();
  static count = 0;
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
    const name = `/game${++Game.count}`;
    Game.games.set(name, this);
    this.nsp = this.master.server.of(name);
    this.name = name;
    this.players = new Set();
    this.rounds = [];

    this.addListeners();
    this.sendSummary();
  };

  addListeners = () => {
    this.master.on('stop', this.close);
    this.nsp.on('connection', this.onConnection);

    this.master.on('startRound', this.newRound);
    this.master.on('stopRound', this.reveal);
  };

  getCurrentRound = () => {
    const current = this.rounds.length && this.rounds[this.rounds.length -1];

    return !!current && current.running
      ? current
      : null;
  };

  newRound = () => {
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

  sendSummary = () => {
    this.master.emit('summary', this.getSummary());
    this.nsp.emit('roundUpdate', this.getSummary(true));
  };

  getSummary = (hideMoves = false) => ({
    name: this.name,
    players: [...this.players],
    rounds: this.rounds.map(round => ({
      ...round,
      moves: hideMoves && round.running ? this.hideMoves(round.moves) : round.moves,
    }))
  });

  hideMoves = moves => Object.keys(moves).reduce((p, n) => ({ ...p, [n]: null}), {});

  close = () => {
    Object.entries(this.nsp.sockets).forEach(player => {
      player.disconnect();
    });
  };

  onConnection = player => {
    this.players.add(player.id);
    player.on('disconnect', () => this.onDisconnection(player.id));
    player.on('pick', value => this.pick(player.id, value));

    this.sendSummary();
  };

  pick = (id, value) => {
    const current = this.getCurrentRound();
    console.log(current, id, value)

    if (!current || !!current.moves[id]) {
      return;
    }

    current.moves[id] = value;

    const playersWhoPicked = Object.keys(current.moves);
    if ([...this.players].every(p => playersWhoPicked.includes(p))) {
      this.reveal();
    } else {
      this.sendSummary();
    }
  };

  onDisconnection = id => {
    this.players.delete(id);

    this.sendSummary();
  };


}

module.exports = Game;
