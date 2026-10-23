'use client';
import { forwardRef, memo, useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, Search, X } from 'lucide-react';
import clsx from 'clsx';
import { useDebounce } from '@/lib/hooks';
import { initials } from '@/lib/format';

export function Button({ variant = 'primary', size, loading, className, children, ...props }) {
  return (
    <button {...props} disabled={props.disabled || loading} className={clsx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

function FieldShell({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="mt-1 flex items-center gap-1 text-xs text-pulse-600">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden /> {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, className, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      <input ref={ref} aria-invalid={!!error} {...props} className={clsx('field', error && 'field-error', className)} />
    </FieldShell>
  );
});

export function Textarea({ label, error, ...props }) {
  return (
    <FieldShell label={label} error={error}>
      <textarea rows={3} aria-invalid={!!error} {...props} className={clsx('field resize-none', error && 'field-error')} />
    </FieldShell>
  );
}

/** With `label` it is a form field; without, a compact filter select (use aria-label). */
export function Select({ label, error, children, className, ...props }) {
  const el = (
    <select {...props} className={clsx('field pr-8', error && 'field-error', className)}>
      {children}
    </select>
  );
  return label ? <FieldShell label={label} error={error}>{el}</FieldShell> : el;
}

export function SearchInput({ onChange, placeholder = 'Search' }) {
  const [text, setText] = useState('');
  const debounced = useDebounce(text, 350);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field pl-9"
      />
    </div>
  );
}

export function DateRange({ from, to, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="date" aria-label="Added from" value={from || ''} max={to || undefined} onChange={(e) => onChange({ from: e.target.value })} className="field" />
      <span className="text-xs text-slate-400">to</span>
      <input type="date" aria-label="Added to" value={to || ''} min={from || undefined} onChange={(e) => onChange({ to: e.target.value })} className="field" />
    </div>
  );
}

export function FilterBar({ children, active, onClear, columns = 'lg:grid-cols-4' }) {
  return (
    <div className="card mb-4 p-3 sm:p-4">
      <div className={clsx('grid gap-3 sm:grid-cols-2', columns)}>{children}</div>
      {active && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-3.5 w-3.5" aria-hidden /> Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

const TONES = {
  neutral: 'bg-mist-100 text-slate-600',
  cobalt: 'bg-cobalt-50 text-cobalt-700',
  mint: 'bg-mint-50 text-mint-600',
  pulse: 'bg-pulse-50 text-pulse-600',
};
export function Badge({ tone = 'neutral', children }) {
  return <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', TONES[tone])}>{children}</span>;
}
const STATUS_TONE = { Stable: 'mint', Critical: 'pulse', Recovering: 'cobalt', Discharged: 'neutral' };
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || 'neutral'}>{status}</Badge>;

const AVATAR = ['bg-cobalt-100 text-cobalt-700', 'bg-mint-50 text-mint-600', 'bg-pulse-100 text-pulse-600', 'bg-petrol-300/40 text-petrol-800', 'bg-amber-100 text-amber-700'];
export const Avatar = memo(function Avatar({ name, size = 'md' }) {
  const tone = AVATAR[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length];
  return (
    <span aria-hidden className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', tone, size === 'lg' ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-xs')}>
      {initials(name)}
    </span>
  );
});

export const Skeleton = ({ className }) => <div className={clsx('skeleton', className)} />;

export function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-mist-100 text-slate-400">
        <Inbox className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <EmptyState
      title="We couldn't load this"
      message={error?.message}
      action={<Button variant="secondary" onClick={onRetry}>Try again</Button>}
    />
  );
}

export function Pagination({ pagination, onPage, fetching }) {
  if (!pagination || pagination.total === 0) return null;
  const { page, pages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const window = [];
  for (let p = Math.max(1, page - 1); p <= Math.min(pages, page + 1); p++) window.push(p);
  const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors';
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-mist-200 px-4 py-3">
      <p className="text-sm text-slate-500">
        Showing <b className="text-slate-700">{start}–{end}</b> of <b className="text-slate-700">{total}</b>
        {fetching && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" aria-label="Loading" />}
      </p>
      <div className="flex items-center gap-1">
        <button className={clsx(btn, 'hover:bg-mist-100 disabled:opacity-40')} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {window[0] > 1 && <span className="px-1 text-slate-400">…</span>}
        {window.map((p) => (
          <button key={p} onClick={() => onPage(p)} aria-current={p === page ? 'page' : undefined}
            className={clsx(btn, p === page ? 'bg-cobalt-600 font-medium text-white' : 'hover:bg-mist-100')}>
            {p}
          </button>
        ))}
        {window[window.length - 1] < pages && <span className="px-1 text-slate-400">…</span>}
        <button className={clsx(btn, 'hover:bg-mist-100 disabled:opacity-40')} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

export function Modal({ open, onClose, title, size = 'md', children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-petrol-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title}
        className={clsx('relative z-10 flex max-h-[92vh] w-full animate-pop flex-col rounded-t-2xl bg-white shadow-pop sm:rounded-2xl', size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between border-b border-mist-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-400 hover:bg-mist-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, loading, title, message, confirmLabel = 'Delete' }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
