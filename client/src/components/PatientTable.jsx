'use client';
import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { fmtDate } from '@/lib/format';
import { Avatar, Badge, EmptyState, Skeleton, StatusBadge } from './ui';

const COLS_WITH_DOCTOR = 'md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_110px_minmax(0,1.3fr)_104px_72px]';
const COLS = 'md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_110px_104px_72px]';

const Row = memo(function Row({ p, showDoctor, onEdit, onDelete, grid }) {
  return (
    <li className={clsx('flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:grid md:gap-4', grid)}>
      <div className="flex w-full min-w-0 items-center gap-3 md:w-auto">
        <Avatar name={p.name} />
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{p.name}</p>
          <p className="text-xs text-slate-500">{p.age} yrs · {p.gender} · {p.phone}</p>
        </div>
      </div>
      <div className="min-w-0"><Badge tone="cobalt">{p.condition}</Badge></div>
      <div><StatusBadge status={p.status} /></div>
      {showDoctor && <p className="min-w-0 truncate text-sm text-slate-600">{p.doctor?.name ?? '—'}</p>}
      <p className="text-sm text-slate-500">{fmtDate(p.createdAt)}</p>
      <div className="ml-auto flex justify-end gap-1">
        {onEdit && <button onClick={() => onEdit(p)} aria-label={`Edit ${p.name}`} className="rounded-md p-1.5 text-slate-400 hover:bg-mist-100 hover:text-cobalt-600"><Pencil className="h-4 w-4" /></button>}
        <button onClick={() => onDelete(p)} aria-label={`Delete ${p.name}`} className="rounded-md p-1.5 text-slate-400 hover:bg-pulse-50 hover:text-pulse-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    </li>
  );
});

export default function PatientTable({ patients, loading, showDoctor, onEdit, onDelete, empty }) {
  const grid = showDoctor ? COLS_WITH_DOCTOR : COLS;
  const heads = showDoctor ? ['Patient', 'Condition', 'Status', 'Doctor', 'Added', ''] : ['Patient', 'Condition', 'Status', 'Added', ''];
  if (loading) {
    return <ul className="divide-y divide-mist-100">{Array.from({ length: 6 }, (_, i) => <li key={i} className="flex items-center gap-3 px-4 py-4"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-48" /></li>)}</ul>;
  }
  if (!patients?.length) return empty || <EmptyState title="No patients found" />;
  return (
    <>
      <div className={clsx('hidden gap-4 border-b border-mist-200 bg-mist-50 px-4 py-2.5 text-xs font-medium text-slate-500 md:grid', grid)}>
        {heads.map((h, i) => <span key={i}>{h}</span>)}
      </div>
      <ul className="divide-y divide-mist-100">
        {patients.map((p) => <Row key={p._id} p={p} grid={grid} showDoctor={showDoctor} onEdit={onEdit} onDelete={onDelete} />)}
      </ul>
    </>
  );
}
