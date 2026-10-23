'use client';
import { useState } from 'react';
import { Button, Input } from './ui';

export default function DoctorForm({ meta, pending, errors = {}, onSubmit, onCancel }) {
  const [v, setV] = useState({ name: '', specialization: '', hospital: '', phone: '', email: '' });
  const bind = (k) => ({ value: v[k], onChange: (e) => setV((s) => ({ ...s, [k]: e.target.value })), error: errors[k]?.[0], required: true });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} className="space-y-4" noValidate>
      <Input label="Full name" placeholder="Dr. Aisha Rahman" autoFocus {...bind('name')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Specialization" list="spec-options" placeholder="Cardiology" {...bind('specialization')} />
        <Input label="Hospital" list="hospital-options" placeholder="Square Hospital" {...bind('hospital')} />
      </div>
      <datalist id="spec-options">{meta?.specializations?.map((s) => <option key={s} value={s} />)}</datalist>
      <datalist id="hospital-options">{meta?.hospitals?.map((s) => <option key={s} value={s} />)}</datalist>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone" type="tel" placeholder="+8801712345678" {...bind('phone')} />
        <Input label="Email" type="email" placeholder="name@hospital.com" {...bind('email')} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={pending}>Add doctor</Button>
      </div>
    </form>
  );
}
