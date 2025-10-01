import React, { useEffect, useState } from 'react';
import { api } from './api';

type Server = {
  id: string;
  name: string;
  gameId: string;
  status: string;
};

export function Servers() {
  const [list, setList] = useState<Server[]>([]);
  const [name, setName] = useState('My CS2 Server');
  const [gameId, setGameId] = useState('cs2');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const data = await api.listServers();
      setList(data);
    } catch (e: any) { setMessage(e.message); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.createServer({ name, gameId });
      setName('');
      await load();
    } catch (e: any) { setMessage(e.message); }
  };

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h2>Servers</h2>
      <form onSubmit={create} style={{ display:'flex', gap:8 }}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Server name" />
        <input value={gameId} onChange={e=>setGameId(e.target.value)} placeholder="gameId (e.g., cs2)" />
        <button type="submit">Create</button>
      </form>
      {message && <div style={{ color:'red' }}>{message}</div>}
      <table border={1} cellPadding={6} style={{ borderCollapse:'collapse' }}>
        <thead><tr><th>Name</th><th>Game</th><th>Status</th><th>ID</th></tr></thead>
        <tbody>
          {list.map(s=> (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.gameId}</td>
              <td>{s.status}</td>
              <td style={{ fontFamily:'monospace' }}>{s.id}</td>
            </tr>
          ))}
          {list.length===0 && <tr><td colSpan={4}>No servers yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
