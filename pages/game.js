import io from 'socket.io-client';
import { useEffect, useState } from 'react';

/** @type {SocketIOClient.Socket} */
const socket = new io();

const IndexPage = () => {
  const [summary, setSummary] = useState('');
  const [hasGame, setHasGame] = useState(false);
  const [roomNotFound, setRoomNotFound] = useState(false);

  useEffect(() => {
    socket.on('roundUpdate', summary => {
      setSummary(summary);

      if (!!summary.name) {
        setHasGame(true);
      }
    });

    socket.on('end', () => {
      socket.removeAllListeners();
      socket.disconnect();
      setHasGame(false);
    });

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('room')) {
      socket.emit('join', urlParams.get('room'));
    } else {
      setRoomNotFound(true);
    }
  }, []);

  const pick = value => () => socket.emit('pick', value);

  if (roomNotFound) {
    return <p>Room not found!</p>;
  }

  const roundRunning = hasGame && !!summary.rounds.length && summary.rounds[summary.rounds.length - 1].running

  return (
    <>
      <div>Hello, World!</div>
      {roundRunning && (
        <div>
          <button onClick={pick(1)}>1</button>
          <button onClick={pick(2)}>2</button>
          <button onClick={pick(3)}>3</button>
          <button onClick={pick(5)}>5</button>
          <button onClick={pick(8)}>8</button>
        </div>
      )}
      <pre>{JSON.stringify(summary, null, 2)}</pre>
    </>
  );
};

export default IndexPage;
