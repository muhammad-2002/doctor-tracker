const { Schema, model } = require('mongoose');
const searchable = require('./searchable');

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    // Denormalised counter kept in sync by the patient routes. Avoids a $lookup/$group on every list view.
    patientCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

doctorSchema.plugin(searchable);
doctorSchema.index({ specialization: 1, createdAt: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1 });
doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ patientCount: -1 });

module.exports = model('Doctor', doctorSchema);
