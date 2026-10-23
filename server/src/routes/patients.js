const router = require('express').Router();
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const S = require('../validators/schemas');
const { AppError, asyncHandler } = require('../utils/errors');
const { prefix, dateRange, paginate } = require('../utils/query');

router.use(protect, restrictTo('admin'));

router.get('/meta', asyncHandler(async (_req, res) => {
  res.json({ conditions: (await Patient.distinct('condition')).sort(), statuses: S.STATUSES });
}));

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { nameLower: 1, _id: 1 },
};

router.get('/', validate(S.patientQuery, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, search, condition, status, doctor, from, to, sort } = req.valid.query;
  const filter = {};
  if (search) {
    const p = prefix(search);
    filter.$or = [{ nameLower: p }, { nameTokens: p }, { phone: p }];
  }
  if (condition) filter.condition = condition;
  if (status) filter.status = status;
  if (doctor) filter.doctor = doctor;
  const range = dateRange(from, to);
  if (range) filter.createdAt = range;
  res.json(await paginate(Patient, filter, { page, limit, sort: SORTS[sort], populate: { path: 'doctor', select: 'name specialization' } }));
}));

router.put('/:id', validate(S.idParams, 'params'), validate(S.patientUpdateBody), asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.valid.params.id);
  if (!patient) throw new AppError('Patient not found', 404);

  const { doctor: nextDoctor, ...fields } = req.valid.body;
  const prevDoctor = String(patient.doctor);
  const reassigned = nextDoctor && nextDoctor !== prevDoctor;
  if (reassigned && !(await Doctor.exists({ _id: nextDoctor }))) throw new AppError('Doctor not found', 404);

  patient.set(fields);
  if (reassigned) patient.doctor = nextDoctor;
  await patient.save(); // save() (not findOneAndUpdate) so validation + the search-field hook run

  if (reassigned) {
    await Promise.all([
      Doctor.updateOne({ _id: prevDoctor }, { $inc: { patientCount: -1 } }),
      Doctor.updateOne({ _id: nextDoctor }, { $inc: { patientCount: 1 } }),
    ]);
  }
  res.json(await patient.populate('doctor', 'name specialization'));
}));

router.delete('/:id', validate(S.idParams, 'params'), asyncHandler(async (req, res) => {
  const removed = await Patient.findByIdAndDelete(req.valid.params.id);
  if (!removed) throw new AppError('Patient not found', 404);
  await Doctor.updateOne({ _id: removed.doctor }, { $inc: { patientCount: -1 } });
  res.status(204).end();
}));

module.exports = router;
