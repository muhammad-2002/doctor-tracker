'use client';
import { useState } from 'react';
import { Button, Input, Select, Textarea } from './ui';

const STATUSES = ['Stable', 'Recovering', 'Critical', 'Discharged'];

/** Shared by "Add patient" (doctor page) and "Edit patient" (patients page). Pass `doctors` to show the doctor picker. */
export default function PatientForm({ initial, doctors, conditions = [], pending, errors = {}, onSubmit, onCancel, submitLabel }) {
  const [v, setV] = useState({
    name: initial?.name ?? '', age: initial?.age ?? '', gender: initial?.gender ?? 'Male', phone: initial?.phone ?? '',
    condition: initial?.condition ?? '', status: initial?.status ?? 'Stable', notes: initial?.notes ?? '',
    doctor: initial?.doctor?._id ?? '',
  });
  const bind = (k) => ({ value: v[k], onChange: (e) => setV((s) => ({ ...s, [k]: e.target.value })), error: errors[k]?.[0] });
  return (
    <form onSubmit={(e) => { e.preventDefault(); const { doctor, ...rest } = v; onSubmit(doctors ? { ...rest, doctor } : rest); }} className="space-y-4" noValidate>
      <Input label="Full name" autoFocus {...bind('name')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Age" type="number" min="0" max="120" {...bind('age')} />
        <Select label="Gender" {...bind('gender')}>{['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}</Select>
        <Select label="Status" {...bind('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone" type="tel" placeholder="+8801712345678" {...bind('phone')} />
        <Input label="Condition" list="condition-options" placeholder="e.g. Hypertension" {...bind('condition')} />
      </div>
      <datalist id="condition-options">{conditions.map((c) => <option key={c} value={c} />)}</datalist>
      {doctors && (
        <Select label="Assigned doctor" {...bind('doctor')}>
          {doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </Select>
      )}
      <Textarea label="Notes (optional)" {...bind('notes')} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={pending}>{submitLabel}</Button>
      </div>
    </form>
  );
}
