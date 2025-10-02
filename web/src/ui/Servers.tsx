import React, { useEffect, useState } from 'react';
import { api } from './api';

type Server = {
  id: string;
  name: string;
  gameId: string;
  status: string;
  nodeId?: string | null;
};

type NodeRow = {
  id: string;
  name: string;
  hostname: string;
  status: string;
};

export function Servers() {
  const [list, setList] = useState<Server[]>([]);
  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [name, setName] = useState('My CS2 Server');
  const [gameId, setGameId] = useState('cs2');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null); // serverId while action runs

  const load = async () => {
    try {
      const [servers, ns] = await Promise.all([api.listServers(), api.listNodes()]);
      setList(servers);
      setNodes(ns);
    } catch (e: any) {
      setMessage(e.message);
    }
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

  const assign = async (serverId: string, nodeId: string) => {
    setMessage('');
    try {
      if (!nodeId) return;
      await api.assignServer(serverId, nodeId);
      await load();
    } catch (e: any) { setMessage(e.message); }
  };

  const unassign = async (serverId: string) => {
    setMessage('');
    try {
      await api.unassignServer(serverId);
      await load();
    } catch (e: any) { setMessage(e.message); }
  };

  const act = async (serverId: string, action: 'start'|'stop'|'restart') => {
    setMessage('');
    setBusy(serverId);
    try {
      if (action === 'start') await api.startServer(serverId);
      if (action === 'stop') await api.stopServer(serverId);
      if (action === 'restart') await api.restartServer(serverId);
      await load();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>Servers</h2>
      <form onSubmit={create} style={{ display: 'flex', gap: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Server name" />
        <input value={gameId} onChange={e => setGameId(e.target.value)} placeholder="gameId (e.g., cs2)" />
        <button type="submit">Create</button>
      </form>
      {message && <div style={{ color: 'red' }}>{message}</div>}
      <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr><th>Name</th><th>Game</th><th>Status</th><th>Assigned Node</th><th>Actions</th><th>ID</th></tr>
        </thead>
        <tbody>
          {list.map(s => {
            const current = nodes.find(n => n.id === s.nodeId);
            const isBusy = busy === s.id;
            return (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.gameId}</td>
                <td>{s.status}</td>
                <td>{current ? `${current.name} (${current.hostname})` : <i>none</i>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <select defaultValue={s.nodeId ?? ''} onChange={(e) => assign(s.id, e.target.value)} disabled={isBusy}>
                    <option value="">-- choose node --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} · {n.hostname}</option>
                    ))}
                  </select>
                  {s.nodeId && (
                    <button onClick={() => unassign(s.id)} style={{ marginLeft: 8 }} disabled={isBusy}>
                      Unassign
                    </button>
                  )}
                  <div style={{ display: 'inline-flex', gap: 6, marginLeft: 12 }}>
                    <button onClick={() => act(s.id, 'start')} disabled={isBusy}>Start</button>
                    <button onClick={() => act(s.id, 'stop')} disabled={isBusy}>Stop</button>
                    <button onClick={() => act(s.id, 'restart')} disabled={isBusy}>Restart</button>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace' }}>{s.id}</td>
              </tr>
            );
          })}
          {list.length === 0 && <tr><td colSpan={6}>No servers yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
