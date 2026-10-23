'use client';
import { useState } from 'react';
import PatientForm from '@/components/PatientForm';
import PatientTable from '@/components/PatientTable';
import { Button, ConfirmDialog, DateRange, EmptyState, ErrorState, FilterBar, Modal, PageHeader, Pagination, SearchInput, Select } from '@/components/ui';
import { useListParams } from '@/lib/hooks';
import { useDeletePatient, useDoctorMeta, usePatientMeta, usePatients, useUpdatePatient } from '@/lib/queries';
import clsx from 'clsx';

export default function PatientsPage() {
  const { params, set, reset, resetKey } = useListParams({ sort: 'newest' });
  const { data, isPending, isFetching, isError, error, refetch } = usePatients(params);
  const patientMeta = usePatientMeta();
  const doctorMeta = useDoctorMeta();
  const update = useUpdatePatient();
  const del = useDeletePatient();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const active = params.search || params.condition || params.status || params.doctor || params.from || params.to;

  const closeEdit = () => { setEditing(null); update.reset(); };

  return (
    <>
      <PageHeader title="Patients" subtitle="Search, filter and update every patient across all doctors." />

      <FilterBar active={active} onClear={reset} columns="lg:grid-cols-4">
        <div className="lg:col-span-2"><SearchInput key={resetKey} placeholder="Search by name or phone" onChange={(search) => set({ search })} /></div>
        <Select aria-label="Condition" value={params.condition || ''} onChange={(e) => set({ condition: e.target.value })}>
          <option value="">All conditions</option>
          {patientMeta.data?.conditions.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select aria-label="Status" value={params.status || ''} onChange={(e) => set({ status: e.target.value })}>
          <option value="">All statuses</option>
          {patientMeta.data?.statuses.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select aria-label="Doctor" value={params.doctor || ''} onChange={(e) => set({ doctor: e.target.value })}>
          <option value="">All doctors</option>
          {doctorMeta.data?.doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </Select>
        <DateRange from={params.from} to={params.to} onChange={set} />
        <Select aria-label="Sort by" value={params.sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </Select>
      </FilterBar>

      <section className="card overflow-hidden">
        {isError ? <ErrorState error={error} onRetry={refetch} /> : (
          <div className={clsx('transition-opacity', isFetching && !isPending && 'opacity-60')}>
            <PatientTable
              showDoctor
              patients={data?.items}
              loading={isPending}
              onEdit={(p) => setEditing(p)}
              onDelete={setToDelete}
              empty={
                <EmptyState
                  title={active ? 'No patients match these filters' : 'No patients yet'}
                  message={active ? 'Try a different search or clear the filters.' : 'Patients are added from a doctor’s page.'}
                  action={active && <Button variant="secondary" onClick={reset}>Clear filters</Button>}
                />
              }
            />
          </div>
        )}
        {data && <Pagination pagination={data.pagination} fetching={isFetching} onPage={(page) => set({ page })} />}
      </section>

      <Modal open={!!editing} onClose={closeEdit} title="Edit patient" size="lg">
        {editing && (
          <PatientForm
            initial={editing}
            doctors={doctorMeta.data?.doctors ?? []}
            conditions={patientMeta.data?.conditions}
            pending={update.isPending}
            errors={update.error?.errors}
            submitLabel="Save changes"
            onCancel={closeEdit}
            onSubmit={(body) => update.mutate({ id: editing._id, body }, { onSuccess: closeEdit })}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={del.isPending}
        title="Delete this patient?"
        message={`${toDelete?.name} will be permanently removed. This can't be undone.`}
        onConfirm={() => del.mutate(toDelete._id, { onSuccess: () => setToDelete(null) })}
      />
    </>
  );
}
