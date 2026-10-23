'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/AppShell';
import { Button, Input } from '@/components/ui';
import { useLogin } from '@/lib/queries';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });
  const errors = login.error?.errors || {};

  const submit = (e) => {
    e.preventDefault();
    login.mutate(form, { onSuccess: () => { router.replace('/'); router.refresh(); } });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-petrol-900 p-12 lg:flex lg:flex-col lg:justify-between">
        <Logo light />
        <svg viewBox="0 0 600 160" className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-90" fill="none" aria-hidden>
          <path className="animate-draw" strokeDasharray="600" d="M0 90h130l20-60 36 120 30-90 20 30h70l24-50 30 100 28-80 16 20h196"
            stroke="#F0436B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight text-white">Every doctor and every patient, in one clear view.</h2>
          <p className="mt-3 max-w-sm text-petrol-300">Add doctors, assign patients, and see how your hospital network is moving.</p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use your administrator account to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Input label="Email" type="email" autoComplete="email" autoFocus value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email?.[0]} />
            <Input label="Password" type="password" autoComplete="current-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password?.[0]} />
            {login.error && !Object.keys(errors).length && (
              <p role="alert" className="rounded-lg bg-pulse-50 px-3 py-2 text-sm text-pulse-600">{login.error.message}</p>
            )}
            <Button type="submit" className="w-full" loading={login.isPending}>Sign in</Button>
          </form>

          <p className="mt-6 rounded-lg bg-mist-50 p-3 text-xs text-slate-500">
            Demo account after seeding: <button type="button" className="font-medium text-cobalt-600 hover:underline"
              onClick={() => setForm({ email: 'admin@doctortracker.com', password: 'Admin@123' })}>fill in credentials</button>
          </p>
        </div>
      </section>
    </div>
  );
}
