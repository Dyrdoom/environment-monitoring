import mongoose from 'mongoose';

const SampleSchema = new mongoose.Schema({
  city: { type: String, index: true, required: true },
  parameter: { type: String, index: true, required: true }, // pm2_5, pm10, ozone
  value: { type: Number, required: true },
  unit: { type: String, default: 'µg/m³' },
  dateUtc: { type: Date, index: true, required: true },
  coordinates: { latitude: Number, longitude: Number },
  source: { type: String, default: 'Open-Meteo Air Quality' },
  raw: { type: Object },
}, { timestamps: true });

SampleSchema.index({ city: 1, parameter: 1, dateUtc: 1 }, { unique: true });

export default mongoose.model('AQSample', SampleSchema);
