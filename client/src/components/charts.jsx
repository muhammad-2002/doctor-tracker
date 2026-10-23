'use client';
import { memo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { shortDay } from '@/lib/format';

export const PALETTE = ['#2F4BD8', '#F0436B', '#14A383', '#F2A33A', '#7A5AF8', '#64748B'];
const tick = { fontSize: 12, fill: '#64748B' };

function Tip({ active, payload, label, labelFmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-mist-200 bg-white px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-slate-900">{labelFmt ? labelFmt(label) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <b className="text-slate-900">{p.value}</b>
        </p>
      ))}
    </div>
  );
}

/** The dashboard's signature chart: sharp linear segments read like a heart-rate trace. */
export const PulseChart = memo(function PulseChart({ data }) {
  const light = { fontSize: 12, fill: '#9FB6BD' };
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0436B" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#F0436B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDay} tick={light} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis allowDecimals={false} tick={light} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip labelFmt={shortDay} />} cursor={{ stroke: 'rgba(255,255,255,.25)' }} />
        <Area type="linear" dataKey="patients" name="New patients" stroke="#F0436B" strokeWidth={2.5} fill="url(#pulseFill)" dot={false} activeDot={{ r: 4 }} />
        <Area type="linear" dataKey="doctors" name="New doctors" stroke="#8FB4FF" strokeWidth={2} fill="none" dot={false} activeDot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export const HBar = memo(function HBar({ data, dataKey, nameKey = 'name', color = PALETTE[0], label }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#EEF2F6" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey={nameKey} width={118} tick={tick} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip />} cursor={{ fill: '#F6F8FB' }} />
        <Bar dataKey={dataKey} name={label} fill={color} radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export const Donut = memo(function Donut({ data }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={74} paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} /><span className="truncate text-slate-600">{d.name}</span></span>
            <span className="text-slate-500">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
