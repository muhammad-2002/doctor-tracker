const { Schema, model } = require('mongoose');
const searchable = require('./searchable');

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phone: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Stable', 'Critical', 'Recovering', 'Discharged'], default: 'Stable' },
    notes: { type: String, trim: true, default: '' },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  },
  { timestamps: true }
);

patientSchema.plugin(searchable);
patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ condition: 1, createdAt: -1 });
patientSchema.index({ status: 1, createdAt: -1 });
patientSchema.index({ createdAt: -1 });

module.exports = model('Patient', patientSchema);
