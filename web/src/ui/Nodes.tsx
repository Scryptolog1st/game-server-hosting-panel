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

  const saveAgentUrl = async (nodeId: string, url: string) => {
    setMessage('');
    try {
      await api.updateNodeUrl(nodeId, url);
      await load();
    } catch (e: any) {
      setMessage(e.message);
    }
  };


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
            <th>Agent URL</th>
            <th>ID</th>
          </tr>
        </thead>

        <tbody>
          {nodes.map(n => (
            <NodeRowItem key={n.id} node={n} />
          ))}
          {nodes.length === 0 && <tr><td colSpan={6}><i>No nodes yet</i></td></tr>}
        </tbody>

      </table>
    </div>
  );
}
function NodeRowItem({ node }: { node: any }) {
  const [agentUrl, setAgentUrl] = React.useState(node.agentUrl ?? '');
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await api.updateNode(node.id, { agentUrl });
      setMsg('Saved');
    } catch (e: any) {
      setMsg(e.message || String(e));
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 1200);
    }
  };

  return (
    <tr>
      <td>{node.name}</td>
      <td>{node.hostname}</td>
      <td>{node.status}</td>
      <td>{node.lastSeenAt ? new Date(node.lastSeenAt).toLocaleString() : <i>never</i>}</td>
      <td style={{ minWidth: 360 }}>
        <input
          style={{ width: '100%' }}
          value={agentUrl}
          onChange={e => setAgentUrl(e.target.value)}
          placeholder="http://<node-ip>:9090"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={save} disabled={saving}>Save</button>
          {msg && <span style={{ color: msg === 'Saved' ? 'green' : 'red' }}>{msg}</span>}
        </div>
      </td>
      <td style={{ fontFamily: 'monospace' }}>{node.id}</td>
    </tr>
  );
}
