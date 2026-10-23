'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Calendar, Mail, Phone, Plus } from 'lucide-react';
import PatientForm from '@/components/PatientForm';
import PatientTable from '@/components/PatientTable';
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, ErrorState, Modal, Pagination, SearchInput, Skeleton } from '@/components/ui';
import { useListParams } from '@/lib/hooks';
import { useAddPatient, useDeletePatient, useDoctor, useDoctorPatients, usePatientMeta } from '@/lib/queries';
import { fmtDate } from '@/lib/format';

const Detail = ({ icon: Icon, children }) => (
  <p className="flex items-center gap-2 text-sm text-slate-600"><Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />{children}</p>
);

export default function DoctorDetailPage() {
  const { id } = useParams();
  const doctor = useDoctor(id);
  const { params, set } = useListParams();
  const patients = useDoctorPatients(id, params);
  const meta = usePatientMeta();
  const add = useAddPatient(id);
  const del = useDeletePatient({ doctorId: id });
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const closeAdd = () => { setAdding(false); add.reset(); };

  if (doctor.isError) {
    return doctor.error.status === 404 || doctor.error.status === 400
      ? <EmptyState title="Doctor not found" message="This doctor may have been removed." action={<Link href="/doctors" className="btn btn-secondary">Back to doctors</Link>} />
      : <ErrorState error={doctor.error} onRetry={doctor.refetch} />;
  }
  const d = doctor.data;

  return (
    <>
      <Link href="/doctors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" aria-hidden /> All doctors</Link>

      <section className="card mb-6 p-5">
        {!d ? <Skeleton className="h-20" /> : (
          <div className="flex flex-wrap items-start gap-5">
            <Avatar name={d.name} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold">{d.name}</h1>
              <div className="mt-1"><Badge tone="cobalt">{d.specialization}</Badge></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Detail icon={Building2}>{d.hospital}</Detail>
                <Detail icon={Phone}><a href={`tel:${d.phone}`} className="hover:underline">{d.phone}</a></Detail>
                <Detail icon={Mail}><a href={`mailto:${d.email}`} className="truncate hover:underline">{d.email}</a></Detail>
                <Detail icon={Calendar}>Joined {fmtDate(d.createdAt)}</Detail>
              </div>
            </div>
            <div className="rounded-lg bg-mist-50 px-5 py-3 text-center">
              <p className="font-display text-3xl font-bold text-petrol-950">{d.patientCount}</p>
              <p className="text-xs text-slate-500">patients</p>
            </div>
          </div>
        )}
      </section>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Patients</h2>
        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          <div className="w-full sm:w-64"><SearchInput placeholder="Search patients" onChange={(search) => set({ search })} /></div>
          <Button onClick={() => setAdding(true)} className="shrink-0"><Plus className="h-4 w-4" aria-hidden /> Add patient</Button>
        </div>
      </div>

      <section className="card overflow-hidden">
        {patients.isError ? <ErrorState error={patients.error} onRetry={patients.refetch} /> : (
          <PatientTable
            patients={patients.data?.items}
            loading={patients.isPending}
            onDelete={setToDelete}
            empty={
              <EmptyState
                title={params.search ? 'No patients match your search' : 'No patients yet'}
                message={params.search ? 'Check the spelling or try fewer letters.' : 'Add the first patient under this doctor.'}
                action={!params.search && <Button onClick={() => setAdding(true)}>Add patient</Button>}
              />
            }
          />
        )}
        {patients.data && <Pagination pagination={patients.data.pagination} fetching={patients.isFetching} onPage={(page) => set({ page })} />}
      </section>

      <Modal open={adding} onClose={closeAdd} title={`Add a patient for ${d?.name ?? 'this doctor'}`} size="lg">
        <PatientForm
          conditions={meta.data?.conditions}
          pending={add.isPending}
          errors={add.error?.errors}
          submitLabel="Add patient"
          onCancel={closeAdd}
          onSubmit={(values) => add.mutate(values, { onSuccess: closeAdd })}
        />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        loading={del.isPending}
        title="Delete this patient?"
        message={`${toDelete?.name} will be removed from ${d?.name ?? 'this doctor'}'s list. This can't be undone.`}
        onConfirm={() => del.mutate(toDelete._id, { onSuccess: () => setToDelete(null) })}
      />
    </>
  );
}
