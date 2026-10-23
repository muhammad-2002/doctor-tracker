'use client';
import { memo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import clsx from 'clsx';
import DoctorForm from '@/components/DoctorForm';
import { Avatar, Badge, Button, DateRange, EmptyState, ErrorState, FilterBar, Modal, PageHeader, Pagination, SearchInput, Select, Skeleton } from '@/components/ui';
import { useListParams } from '@/lib/hooks';
import { useCreateDoctor, useDoctorMeta, useDoctors } from '@/lib/queries';

const GRID = 'md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.3fr)_90px]';

const DoctorRow = memo(function DoctorRow({ d }) {
  return (
    <li>
      <Link href={`/doctors/${d._id}`} className={clsx('flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors hover:bg-mist-50 md:grid md:gap-4', GRID)}>
        <div className="flex w-full min-w-0 items-center gap-3 md:w-auto">
          <Avatar name={d.name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{d.name}</p>
            <p className="truncate text-xs text-slate-500">{d.email}</p>
          </div>
        </div>
        <div><Badge tone="cobalt">{d.specialization}</Badge></div>
        <p className="min-w-0 truncate text-sm text-slate-600">{d.hospital}</p>
        <p className="text-sm text-slate-500">{d.phone}</p>
        <p className="ml-auto flex items-center gap-1 text-sm font-medium text-slate-900 md:ml-0">
          {d.patientCount} <span className="font-normal text-slate-500">patients</span>
          <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
        </p>
      </Link>
    </li>
  );
});

export default function DoctorsPage() {
  const { params, set, reset, resetKey } = useListParams({ sort: 'newest' });
  const { data, isPending, isFetching, isError, error, refetch } = useDoctors(params);
  const meta = useDoctorMeta();
  const create = useCreateDoctor();
  const [creating, setCreating] = useState(false);
  const active = params.search || params.specialization || params.hospital || params.from || params.to;

  const close = () => { setCreating(false); create.reset(); };

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle="Browse doctors and open one to see their patients."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden /> Add doctor</Button>}
      />

      <FilterBar active={active} onClear={reset} columns="lg:grid-cols-[1.3fr_1fr_1fr_auto_auto]">
        <SearchInput key={resetKey} placeholder="Search by name or email" onChange={(search) => set({ search })} />
        <Select aria-label="Specialization" value={params.specialization || ''} onChange={(e) => set({ specialization: e.target.value })}>
          <option value="">All specializations</option>
          {meta.data?.specializations.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select aria-label="Hospital" value={params.hospital || ''} onChange={(e) => set({ hospital: e.target.value })}>
          <option value="">All hospitals</option>
          {meta.data?.hospitals.map((h) => <option key={h}>{h}</option>)}
        </Select>
        <DateRange from={params.from} to={params.to} onChange={set} />
        <Select aria-label="Sort by" value={params.sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="patients">Most patients</option>
        </Select>
      </FilterBar>

      <section className="card overflow-hidden">
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isPending ? (
          <ul className="divide-y divide-mist-100">
            {Array.from({ length: 8 }, (_, i) => <li key={i} className="flex items-center gap-3 px-4 py-4"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-56" /></li>)}
          </ul>
        ) : data.items.length === 0 ? (
          <EmptyState
            title={active ? 'No doctors match these filters' : 'No doctors yet'}
            message={active ? 'Try a different search or clear the filters.' : 'Add your first doctor to start assigning patients.'}
            action={active ? <Button variant="secondary" onClick={reset}>Clear filters</Button> : <Button onClick={() => setCreating(true)}>Add doctor</Button>}
          />
        ) : (
          <>
            <div className={clsx('hidden gap-4 border-b border-mist-200 bg-mist-50 px-4 py-2.5 text-xs font-medium text-slate-500 md:grid', GRID)}>
              <span>Doctor</span><span>Specialization</span><span>Hospital</span><span>Phone</span><span>Patients</span>
            </div>
            <ul className={clsx('divide-y divide-mist-100 transition-opacity', isFetching && 'opacity-60')}>
              {data.items.map((d) => <DoctorRow key={d._id} d={d} />)}
            </ul>
          </>
        )}
        {data && <Pagination pagination={data.pagination} fetching={isFetching} onPage={(page) => set({ page })} />}
      </section>

      <Modal open={creating} onClose={close} title="Add a doctor">
        <DoctorForm
          meta={meta.data}
          pending={create.isPending}
          errors={create.error?.errors}
          onCancel={close}
          onSubmit={(values) => create.mutate(values, { onSuccess: close })}
        />
      </Modal>
    </>
  );
}
