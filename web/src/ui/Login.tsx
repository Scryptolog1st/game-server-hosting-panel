import React, { useState } from 'react';
import { api, setTokens } from './api';

export function Login({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('Str0ngPass!');
  const [err, setErr] = useState<string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const r = await api.login(email, password);
      setTokens(r.access, r.refresh);
      onLoggedIn();
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={submit} style={{ display:'grid', gap:12, maxWidth:360 }}>
      <h2>Login</h2>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />
      <button type="submit">Sign in</button>
      {err && <div style={{ color:'red' }}>{err}</div>}
    </form>
  );
}
