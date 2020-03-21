import io from 'socket.io-client';
import { useEffect, useState } from 'react';

const socket = new io();

const IndexPage = () => {
  const [summary, setSummary] = useState('');
  const [hasGame, setHasGame] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    socket.on('summary', summary => {
      setSummary(summary);
      setLink(`http://${window.location.host}/game?room=${summary.name}`);

      if (!!summary.name) {
        setHasGame(true);
      }
    });

    socket.on('end', () => {
      setHasGame(false);
    });

  }, []);

  const newGame = () => socket.emit('new');
  const stopGame = () => socket.emit('stop');
  const startRound = () => socket.emit('startRound', summary.name);
  const stopRound = () => socket.emit('stopRound', summary.name);

  const roundRunning = hasGame && !!summary.rounds.length && summary.rounds[summary.rounds.length - 1].running;

  return (
    <>
      {!hasGame && <button onClick={newGame}>New!</button>}
      {hasGame && <button onClick={stopGame}>Stop!</button>}
      {hasGame && !roundRunning && <button onClick={startRound}>Start round!</button>}
      {hasGame && roundRunning && <button onClick={stopRound}>Stop round!</button>}
      <pre>{JSON.stringify(summary, null, 2)}</pre>
      {hasGame && <a href={`/game?room=${summary.name}`}>Game</a>}
      {hasGame && <p>{link}</p>}
    </>
  );
};

export default IndexPage;
