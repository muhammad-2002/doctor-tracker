'use client';
import { useState } from 'react';
import { Activity, Stethoscope, UserPlus, Users } from 'lucide-react';
import clsx from 'clsx';
import { Avatar, Badge, ErrorState, PageHeader, Skeleton, StatusBadge } from '@/components/ui';
import { Donut, HBar, PALETTE, PulseChart } from '@/components/charts';
import { useDashboard, useMe } from '@/lib/queries';
import { fmtDate } from '@/lib/format';

const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days']];
const STATUS_COLOR = { Stable: '#14A383', Recovering: '#2F4BD8', Critical: '#F0436B', Discharged: '#94A3B8' };

function Stat({ icon: Icon, label, value, note }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cobalt-50 text-cobalt-600"><Icon className="h-5 w-5" aria-hidden /></span>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-display text-2xl font-bold text-petrol-950">{value}</p>
        {note && <p className="text-xs text-slate-500">{note}</p>}
      </div>
    </div>
  );
}

const Panel = ({ title, subtitle, children, className }) => (
  <section className={clsx('card p-5', className)}>
    <h2 className="text-base font-semibold">{title}</h2>
    {subtitle && <p className="mb-4 text-sm text-slate-500">{subtitle}</p>}
    {!subtitle && <div className="mb-4" />}
    {children}
  </section>
);

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const me = useMe();
  const { data, isPending, isError, error, refetch, isFetching } = useDashboard(days);

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  const t = data?.totals;
  const statusTotal = data?.byStatus.reduce((a, s) => a + s.value, 0) || 1;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${me.data?.user.name.split(' ')[0] ?? ''}`}
        subtitle="Here is how your doctors and patients are doing."
        actions={
          <div role="group" aria-label="Time range" className="inline-flex rounded-lg border border-mist-300 bg-white p-0.5">
            {RANGES.map(([d, label]) => (
              <button key={d} onClick={() => setDays(d)} aria-pressed={days === d}
                className={clsx('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', days === d ? 'bg-petrol-900 text-white' : 'text-slate-600 hover:bg-mist-100')}>
                {label}
              </button>
            ))}
          </div>
        }
      />

      {isPending ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-80" />
          <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
        </div>
      ) : (
        <div className={clsx('space-y-4 transition-opacity', isFetching && 'opacity-70')}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Stethoscope} label="Total doctors" value={t.doctors} note={`${t.newDoctors} joined in the last ${days} days`} />
            <Stat icon={Users} label="Total patients" value={t.patients} note={`${t.newPatients} registered in the last ${days} days`} />
            <Stat icon={Activity} label="Patients per doctor" value={t.avgPatientsPerDoctor} note="Average across all doctors" />
            <Stat icon={UserPlus} label={`New patients (${days}d)`} value={t.newPatients} note={`About ${(t.newPatients / days).toFixed(1)} per day`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-xl bg-petrol-900 p-5 shadow-card lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Registrations</h2>
                  <p className="text-sm text-petrol-300">New patients and doctors per day</p>
                </div>
                <div className="flex gap-3 text-xs text-petrol-300">
                  <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-pulse-500" />Patients</span>
                  <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#8FB4FF]" />Doctors</span>
                </div>
              </div>
              <PulseChart data={data.registrations} />
            </section>

            <Panel title="Patient status" subtitle="Current condition of all patients">
              <div className="flex h-3 overflow-hidden rounded-full bg-mist-100">
                {data.byStatus.map((s) => <div key={s.name} title={s.name} style={{ width: `${(s.value / statusTotal) * 100}%`, background: STATUS_COLOR[s.name] }} />)}
              </div>
              <ul className="mt-5 space-y-3">
                {data.byStatus.map((s) => (
                  <li key={s.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLOR[s.name] }} />{s.name}</span>
                    <span className="font-medium text-slate-900">{s.value} <span className="font-normal text-slate-400">({Math.round((s.value / statusTotal) * 100)}%)</span></span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Patients per doctor" subtitle="The eight busiest doctors">
              <HBar data={data.patientsPerDoctor} dataKey="patientCount" label="Patients" />
            </Panel>
            <Panel title="Patients by specialization" subtitle="Where patient demand is highest">
              <HBar data={data.bySpecialization} dataKey="patients" label="Patients" color={PALETTE[2]} />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Common conditions" subtitle="Top six across all patients"><Donut data={data.byCondition} /></Panel>
            <Panel title="Recently registered" className="lg:col-span-2">
              <ul className="divide-y divide-mist-100">
                {data.recentPatients.map((p) => (
                  <li key={p._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <Avatar name={p.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">{p.doctor?.name} · {fmtDate(p.createdAt)}</p>
                    </div>
                    <Badge tone="cobalt">{p.condition}</Badge>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
