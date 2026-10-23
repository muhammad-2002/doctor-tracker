require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const int = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => new Date(Date.now() - n * 864e5 - int(0, 864e5 - 1));
const phone = () => '+8801' + int(3, 9) + String(int(0, 99999999)).padStart(8, '0');

const first = ['Aisha', 'Rahim', 'Nusrat', 'Imran', 'Farhana', 'Tanvir', 'Sadia', 'Kamal', 'Mehjabin', 'Arif', 'Lamia', 'Zubair', 'Nadia', 'Sabbir', 'Tasnim', 'Rafiq'];
const last = ['Rahman', 'Khan', 'Chowdhury', 'Ahmed', 'Hossain', 'Islam', 'Sarker', 'Akter', 'Mia', 'Karim', 'Siddique', 'Begum'];
const specs = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Oncology', 'Endocrinology', 'Gynecology'];
const hospitals = ['Square Hospital', 'United Hospital', 'Evercare Hospital', 'Labaid Hospital', 'Popular Medical Centre'];
const conditions = ['Hypertension', 'Type 2 diabetes', 'Asthma', 'Migraine', 'Fracture', 'Anemia', 'Arthritis', 'Eczema', 'Thyroid disorder', 'Pneumonia'];
const statuses = ['Stable', 'Stable', 'Stable', 'Recovering', 'Recovering', 'Critical', 'Discharged'];
const name = () => `${pick(first)} ${pick(last)}`;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User.deleteMany(), Doctor.deleteMany(), Patient.deleteMany()]);
  await Promise.all([User.init(), Doctor.init(), Patient.init()]); // make sure indexes exist

  await User.create({ name: 'Admin', email: 'admin@doctortracker.com', password: 'Admin@123' });

  const doctors = await Doctor.create(
    Array.from({ length: 14 }, (_, i) => {
      const n = 'Dr. ' + name();
      return {
        name: n,
        specialization: specs[i % specs.length],
        hospital: pick(hospitals),
        phone: phone(),
        email: `${n.toLowerCase().replace(/[^a-z]+/g, '.')}${i}@hospital.test`,
        createdAt: daysAgo(int(20, 120)),
      };
    })
  );

  // Weighted so a few doctors are busier than the rest, which makes the charts more interesting.
  const weighted = doctors.flatMap((d, i) => Array(Math.max(1, 6 - Math.floor(i / 2))).fill(d));
  const patients = await Patient.create(
    Array.from({ length: 220 }, () => ({
      name: name(),
      age: int(2, 88),
      gender: pick(['Male', 'Female', 'Female', 'Male', 'Other']),
      phone: phone(),
      condition: pick(conditions),
      status: pick(statuses),
      notes: '',
      doctor: pick(weighted)._id,
      createdAt: daysAgo(int(0, 59)),
    }))
  );

  const counts = patients.reduce((m, p) => m.set(String(p.doctor), (m.get(String(p.doctor)) || 0) + 1), new Map());
  await Doctor.bulkWrite([...counts].map(([id, n]) => ({ updateOne: { filter: { _id: id }, update: { $set: { patientCount: n } } } })));

  console.log(`Seeded ${doctors.length} doctors and ${patients.length} patients.`);
  console.log('Login: admin@doctortracker.com / Admin@123');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
