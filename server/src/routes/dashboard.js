const router = require('express').Router();
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { protect, restrictTo } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');

router.use(protect, restrictTo('admin'));

const dayKey = (d) => d.toISOString().slice(0, 10);

/** Zero-fills missing days so the chart x-axis is continuous. */
function fillDays(rows, since, days) {
  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = dayKey(d);
    return { date: key, count: byDay.get(key) || 0 };
  });
}

router.get('/stats', asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 180);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const perDay = [
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
  ];

  // Independent queries run in parallel; each one is index-backed or a single-pass aggregation.
  const [
    totalDoctors, totalPatients, newPatients, newDoctors,
    topDoctors, patientRows, doctorRows, byCondition, byStatus, bySpecialization, recentPatients,
  ] = await Promise.all([
    Doctor.estimatedDocumentCount(),
    Patient.estimatedDocumentCount(),
    Patient.countDocuments({ createdAt: { $gte: since } }),
    Doctor.countDocuments({ createdAt: { $gte: since } }),
    Doctor.find().sort({ patientCount: -1, _id: 1 }).limit(8).select('name specialization patientCount').lean(),
    Patient.aggregate(perDay),
    Doctor.aggregate(perDay),
    Patient.aggregate([{ $group: { _id: '$condition', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 }]),
    Patient.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Doctor.aggregate([
      { $group: { _id: '$specialization', doctors: { $sum: 1 }, patients: { $sum: '$patientCount' } } },
      { $sort: { patients: -1 } }, { $limit: 6 },
    ]),
    Patient.find().sort({ createdAt: -1 }).limit(6).select('name condition status createdAt doctor').populate('doctor', 'name').lean(),
  ]);

  const patientSeries = fillDays(patientRows, since, days);
  const doctorSeries = fillDays(doctorRows, since, days);
  const registrations = patientSeries.map((p, i) => ({ date: p.date, patients: p.count, doctors: doctorSeries[i].count }));

  res.json({
    days,
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      newPatients,
      newDoctors,
      avgPatientsPerDoctor: totalDoctors ? +(totalPatients / totalDoctors).toFixed(1) : 0,
    },
    patientsPerDoctor: topDoctors,
    registrations: registrations,
    byCondition: byCondition.map((c) => ({ name: c._id, value: c.count })),
    byStatus: byStatus.map((s) => ({ name: s._id, value: s.count })),
    bySpecialization: bySpecialization.map((s) => ({ name: s._id, doctors: s.doctors, patients: s.patients })),
    recentPatients,
  });
}));

module.exports = router;
