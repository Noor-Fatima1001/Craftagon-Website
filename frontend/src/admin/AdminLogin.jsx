import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/auth/login', { email, password });
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form onSubmit={submit} className="mx-auto mt-24 max-w-sm rounded-2xl border p-6">
      <h1 className="font-display text-2xl">Admin sign in</h1>
      <input className="input mt-4" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input mt-3" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button className="btn-primary mt-4 w-full">Sign in</button>
    </form>
  );
}
