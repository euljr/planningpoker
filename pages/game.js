import io from 'socket.io-client';
import { useEffect, useState } from 'react';

const socket = new io('/game1');

const IndexPage = () => {
  const [summary, setSummary] = useState('');

  useEffect(() => {
    socket.on('message', console.log);
    socket.on('disconnect', () => console.log('disconnected'));
    socket.on('roundUpdate', summary => {
      setSummary(summary);
    });
  }, []);

  const pick = value => () => socket.emit('pick', value);

  return (
    <>
      <div>Hello, World!</div>
      <div>
        <button onClick={pick(1)}>1</button>
        <button onClick={pick(2)}>2</button>
        <button onClick={pick(3)}>3</button>
        <button onClick={pick(5)}>5</button>
        <button onClick={pick(8)}>8</button>
      </div>
      <pre>{JSON.stringify(summary, null, 2)}</pre>
    </>
  );
};

export default IndexPage;
