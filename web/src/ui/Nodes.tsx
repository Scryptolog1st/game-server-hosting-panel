import React, { useEffect, useState } from 'react';
import { api } from './api';

type NodeRow = {
  id: string;
  name: string;
  hostname: string;
  status: string;
  lastSeenAt?: string | null;
};

export function Nodes() {
  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [msg, setMsg] = useState('');
  const [tokenInfo, setTokenInfo] = useState<{ token: string; expiresAt: string } | null>(null);

  const load = async () => {
    setMsg('');
    try {
      const ns = await api.listNodes();
      setNodes(ns);
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  };

  useEffect(() => { load(); }, []);

  const createToken = async () => {
    setMsg('');
    try {
      const r = await api.createEnrollToken(60); // 60 minutes
      setTokenInfo({ token: r.token, expiresAt: r.expiresAt });
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>Nodes</h2>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={load}>Refresh</button>
        <button onClick={createToken}>Create enrollment token (60m)</button>
      </div>

      {msg && <div style={{ color: 'red' }}>{msg}</div>}

      {tokenInfo && (
        <div style={{ border: '1px solid #ccc', padding: 12 }}>
          <div><b>Token:</b> <code>{tokenInfo.token}</code></div>
          <div><b>Expires:</b> {new Date(tokenInfo.expiresAt).toLocaleString()}</div>
          <details style={{ marginTop: 8 }}>
            <summary>Show Linux enroll example</summary>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {`# On the node:
export PANEL_URL=http://<panel-host>:8080
export ENROLL_TOKEN=${tokenInfo.token}
export NODE_NAME=node-01
export NODE_HOSTNAME=$(hostname -I | awk '{print $1}')
# run your agent with these env vars`}
            </pre>
          </details>
        </div>
      )}

      <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Hostname</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map(n => (
            <tr key={n.id}>
              <td>{n.name}</td>
              <td>{n.hostname}</td>
              <td>{n.status}</td>
              <td>{n.lastSeenAt ? new Date(n.lastSeenAt).toLocaleString() : <i>never</i>}</td>
              <td style={{ fontFamily: 'monospace' }}>{n.id}</td>
            </tr>
          ))}
          {nodes.length === 0 && <tr><td colSpan={5}><i>No nodes yet</i></td></tr>}
        </tbody>
      </table>
    </div>
  );
}
