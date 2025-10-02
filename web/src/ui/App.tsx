import React, { useEffect, useState } from 'react';
import { getToken, setTokens, clearTokens, api } from './api';
import { Servers } from './Servers';
import { Nodes } from './Nodes';


type View = 'login' | 'servers' | 'nodes';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('Str0ngPass!');
  const [org, setOrg] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (getToken()) {
      api.me().then((me: any) => {
        setOrg(me.org);
        setView('servers');
      }).catch(() => clearTokens());
    }
  }, []);

  const signin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const r: any = await api.login(email, password);
      setTokens(r.access, r.refresh);
      const me: any = await api.me();
      setOrg(me.org);
      setView('servers');
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  };

  const signout = () => {
    clearTokens();
    setOrg(null);
    setView('login');
  };

  if (view === 'login') {
    return (
      <div style={{ padding: 24 }}>
        <h1>Login</h1>
        <form onSubmit={signin} style={{ display: 'grid', gap: 8, maxWidth: 400 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="password" />
          <button type="submit">Sign in</button>
        </form>
        {msg && <div style={{ color: 'red' }}>{msg}</div>}
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>GameServer Admin Panel</h1>
        <div>
          {org && <span style={{ marginRight: 8 }}>Org: {org.slice(0, 10)}…</span>}
          <button onClick={signout}>Sign out</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setView('servers')}>Servers</button>
        <button onClick={() => setView('nodes')}>Nodes</button>
      </div>

      {view === 'servers' && <Servers />}
      {view === 'nodes' && <Nodes />}
    </div>
  );
}
