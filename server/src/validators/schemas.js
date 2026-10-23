const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const text = (min, max, label) =>
  z.string({ required_error: `${label} is required` }).trim().min(min, `${label} is required`).max(max);
const phone = z.string().trim().regex(/^[+\d][\d\s\-()]{6,19}$/, 'Enter a valid phone number');
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional();

const STATUSES = ['Stable', 'Critical', 'Recovering', 'Discharged'];
const paging = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(60).optional(),
};

const patientBody = z.object({
  name: text(2, 80, 'Name'),
  age: z.coerce.number({ invalid_type_error: 'Age must be a number' }).int().min(0).max(120),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone,
  condition: text(2, 80, 'Condition'),
  status: z.enum(STATUSES).default('Stable'),
  notes: z.string().trim().max(500).optional().default(''),
});

module.exports = {
  STATUSES,
  idParams: z.object({ id: objectId }),
  doctorPatientParams: z.object({ id: objectId, patientId: objectId }),
  loginBody: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),
  doctorBody: z.object({
    name: text(2, 80, 'Name'),
    specialization: text(2, 80, 'Specialization'),
    hospital: text(2, 120, 'Hospital'),
    phone,
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
  }),
  patientBody,
  patientUpdateBody: patientBody.extend({ doctor: objectId.optional() }),
  doctorQuery: z.object({
    ...paging,
    specialization: z.string().trim().max(80).optional(),
    hospital: z.string().trim().max(120).optional(),
    from: day,
    to: day,
    sort: z.enum(['newest', 'oldest', 'name', 'patients']).default('newest'),
  }),
  patientQuery: z.object({
    ...paging,
    condition: z.string().trim().max(80).optional(),
    status: z.enum(STATUSES).optional(),
    doctor: objectId.optional(),
    from: day,
    to: day,
    sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
  }),
  doctorPatientsQuery: z.object({ ...paging }),
};
