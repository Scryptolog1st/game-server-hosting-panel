import React, { useEffect, useState } from 'react';
import { Login } from './Login';
import { api, clearTokens } from './api';
import { Servers } from './Servers';

export function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<{ userId: string; orgId: string } | null>(null);

  const tryMe = async () => {
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => { tryMe(); }, []);

  if (!ready) return <div style={{ padding:24 }}>Loading…</div>;

  if (!user) return (
    <div style={{ padding:24 }}>
      <Login onLoggedIn={tryMe} />
    </div>
  );

  return (
    <div style={{ padding:24, display:'grid', gap:16 }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1>GameServer Admin Panel</h1>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span>Org: {user.orgId.slice(0,8)}…</span>
          <button onClick={()=>{ clearTokens(); setUser(null); }}>Sign out</button>
        </div>
      </header>
      <Servers />
    </div>
  );
}
