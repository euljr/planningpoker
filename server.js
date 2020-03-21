const { createServer } = require('http');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const Game = require('./server/game');

const server = createServer((req, res) => handle(req, res));
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('new', () => {
    new Game(socket);
  });

  socket.on('join', room => {
    if (Game.games.has(room)) {
      Game.games.get(room).addPlayer(socket);
    }
  });
});

app.prepare().then(() => {
  server.listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
