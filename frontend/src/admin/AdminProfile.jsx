import { useState } from 'react';
import { api } from '../api';

export default function AdminProfile() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [msg, setMsg] = useState('');
  async function save(e) {
    e.preventDefault();
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      setMsg('Password updated');
      setCurrent('');
      setNew('');
    } catch (err) {
      setMsg(err.message);
    }
  }
  return (
    <form onSubmit={save} className="max-w-md card space-y-3 p-5">
      <h1 className="font-display text-3xl">Profile</h1>
      <input className="input" type="password" required placeholder="Current password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
      <input className="input" type="password" required minLength={10} placeholder="New password (10+ chars)" value={newPassword} onChange={(e) => setNew(e.target.value)} />
      <button className="btn-primary">Change password</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
