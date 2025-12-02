import mongoose from 'mongoose';

const damageCalcSchema = new mongoose.Schema({
  sourceId: { type: String, default: 'synthetic' },
  pollutant: { type: String, required: true },
  massExcess: { 
    type: Number, 
    required: true, 
    min: [0, 'Маса має бути невід\'ємною'] 
  },
  baseRate: { type: Number, required: true, min: 0 },
  kT: { type: Number, required: true, min: 0 },
  kR: { type: Number, required: true, min: 0 },
  kOther: [{ type: Number, min: 0 }],
  
  calculationPassport: {
    inputUnit: { type: String, default: 't' },
    conversionFactor: { type: Number, default: 1 },
    originalMass: { type: Number }
  },

  total: { type: Number, required: true },
  dateCalculated: { type: Date, default: Date.now }
});

export default mongoose.model('DamageCalc', damageCalcSchema);