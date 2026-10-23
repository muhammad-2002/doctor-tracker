const router = require('express').Router();
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const S = require('../validators/schemas');
const { AppError, asyncHandler } = require('../utils/errors');
const { prefix, dateRange, paginate } = require('../utils/query');

router.use(protect, restrictTo('admin'));

// Filter dropdown data. Declared before '/:id' so "meta" is not treated as an id.
router.get('/meta', asyncHandler(async (_req, res) => {
  const [specializations, hospitals, doctors] = await Promise.all([
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
    Doctor.find().select('name').sort({ nameLower: 1 }).limit(500).lean(),
  ]);
  res.json({ specializations: specializations.sort(), hospitals: hospitals.sort(), doctors });
}));

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { nameLower: 1, _id: 1 },
  patients: { patientCount: -1, _id: 1 },
};

router.get('/', validate(S.doctorQuery, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, search, specialization, hospital, from, to, sort } = req.valid.query;
  const filter = {};
  if (search) {
    const p = prefix(search);
    filter.$or = [{ nameLower: p }, { nameTokens: p }, { email: p }];
  }
  if (specialization) filter.specialization = specialization;
  if (hospital) filter.hospital = hospital;
  const range = dateRange(from, to);
  if (range) filter.createdAt = range;
  res.json(await paginate(Doctor, filter, { page, limit, sort: SORTS[sort] }));
}));

router.post('/', validate(S.doctorBody), asyncHandler(async (req, res) => {
  res.status(201).json(await Doctor.create(req.valid.body));
}));

router.get('/:id', validate(S.idParams, 'params'), asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.valid.params.id).lean();
  if (!doctor) throw new AppError('Doctor not found', 404);
  res.json(doctor);
}));

// ---- Patients nested under a doctor ----
router.get('/:id/patients', validate(S.idParams, 'params'), validate(S.doctorPatientsQuery, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, search } = req.valid.query;
  const filter = { doctor: req.valid.params.id };
  if (search) {
    const p = prefix(search);
    filter.$or = [{ nameLower: p }, { nameTokens: p }, { phone: p }];
  }
  res.json(await paginate(Patient, filter, { page, limit, sort: { createdAt: -1, _id: -1 } }));
}));

router.post('/:id/patients', validate(S.idParams, 'params'), validate(S.patientBody), asyncHandler(async (req, res) => {
  const { id } = req.valid.params;
  if (!(await Doctor.exists({ _id: id }))) throw new AppError('Doctor not found', 404);
  const patient = await Patient.create({ ...req.valid.body, doctor: id });
  await Doctor.updateOne({ _id: id }, { $inc: { patientCount: 1 } });
  res.status(201).json(patient);
}));

router.delete('/:id/patients/:patientId', validate(S.doctorPatientParams, 'params'), asyncHandler(async (req, res) => {
  const { id, patientId } = req.valid.params;
  const removed = await Patient.findOneAndDelete({ _id: patientId, doctor: id });
  if (!removed) throw new AppError('Patient not found for this doctor', 404);
  await Doctor.updateOne({ _id: id }, { $inc: { patientCount: -1 } });
  res.status(204).end();
}));

module.exports = router;
