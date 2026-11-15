import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Lookup() {
  const [orderNumber, setOrderNumber] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  return (
    <form
      className="mx-auto max-w-md px-4 py-16"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/order/${orderNumber.trim().toUpperCase()}?token=${encodeURIComponent(token.trim())}`);
      }}
    >
      <h1 className="font-display text-3xl">Track order</h1>
      <p className="mt-2 text-sm text-slate-600">Use the Order ID and private token from your confirmation page or email.</p>
      <label className="label mt-6">Order ID</label>
      <input className="input" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
      <label className="label mt-3">Private token</label>
      <input className="input" required value={token} onChange={(e) => setToken(e.target.value)} />
      <button className="btn-primary mt-5 w-full">View order</button>
    </form>
  );
}
