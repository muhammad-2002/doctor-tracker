'use client';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from './api';

// ---- Reads. keepPreviousData keeps the old page on screen while the next one loads (no flicker). ----
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me'), staleTime: 5 * 60_000, retry: false });
export const useDashboard = (days) =>
  useQuery({ queryKey: ['dashboard', days], queryFn: () => api.get('/dashboard/stats', { days }), placeholderData: keepPreviousData });
export const useDoctors = (params) =>
  useQuery({ queryKey: ['doctors', params], queryFn: () => api.get('/doctors', params), placeholderData: keepPreviousData });
export const useDoctor = (id) => useQuery({ queryKey: ['doctor', id], queryFn: () => api.get(`/doctors/${id}`), retry: false });
export const useDoctorMeta = () => useQuery({ queryKey: ['doctor-meta'], queryFn: () => api.get('/doctors/meta'), staleTime: 60_000 });
export const usePatientMeta = () => useQuery({ queryKey: ['patient-meta'], queryFn: () => api.get('/patients/meta'), staleTime: 60_000 });
export const useDoctorPatients = (id, params) =>
  useQuery({ queryKey: ['doctor-patients', id, params], queryFn: () => api.get(`/doctors/${id}/patients`, params), placeholderData: keepPreviousData });
export const usePatients = (params) =>
  useQuery({ queryKey: ['patients', params], queryFn: () => api.get('/patients', params), placeholderData: keepPreviousData });

// ---- Writes ----
const DOCTOR_KEYS = ['doctors', 'doctor-meta', 'dashboard'];
const PATIENT_KEYS = ['patients', 'patient-meta', 'doctors', 'doctor', 'doctor-patients', 'dashboard'];

function useApiMutation(mutationFn, { invalidate = [], success, onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
      if (success) toast.success(success);
      onSuccess?.(data, qc);
    },
    // Field-level errors are rendered by the form; everything else becomes a toast.
    onError: (err) => {
      if (!err.errors || !Object.keys(err.errors).length) toast.error(err.message);
    },
  });
}

export const useLogin = () => useApiMutation((body) => api.post('/auth/login', body));
export const useLogout = () => useApiMutation(() => api.post('/auth/logout'), { onSuccess: (_d, qc) => qc.clear() });
export const useCreateDoctor = () => useApiMutation((body) => api.post('/doctors', body), { invalidate: DOCTOR_KEYS, success: 'Doctor added' });
export const useAddPatient = (doctorId) =>
  useApiMutation((body) => api.post(`/doctors/${doctorId}/patients`, body), { invalidate: PATIENT_KEYS, success: 'Patient added' });
export const useUpdatePatient = () =>
  useApiMutation(({ id, body }) => api.put(`/patients/${id}`, body), { invalidate: PATIENT_KEYS, success: 'Patient updated' });
export const useDeletePatient = ({ doctorId } = {}) =>
  useApiMutation((id) => (doctorId ? api.del(`/doctors/${doctorId}/patients/${id}`) : api.del(`/patients/${id}`)), {
    invalidate: PATIENT_KEYS,
    success: 'Patient deleted',
  });
