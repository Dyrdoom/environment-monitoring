import DamageCalc from '../models/DamageCalc.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '../data/damageReferences.json');

// Допоміжна функція для читання конфігу
const getConfig = async () => {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {}; // Повертаємо пустий об'єкт якщо файл не знайдено
  }
};

// 1. Отримати всі розрахунки
export const getCalculations = async (req, res, next) => {
  try {
    const items = await DamageCalc.find().sort({ dateCalculated: -1 }).limit(100);
    res.json(items);
  } catch (e) {
    next(e);
  }
};

// 2. Отримати поточну конфігурацію
export const getConfigData = async (req, res, next) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (e) {
    next(e);
  }
};

// 3. Оновити конфігурацію
export const updateConfigData = async (req, res, next) => {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Config updated' });
  } catch (e) {
    next(e);
  }
};

// 4. Створити розрахунок (з нормалізацією)
export const createCalculation = async (req, res, next) => {
  try {
    const { pollutant, massInput, unit, baseRate, kT, kR, kOther, sourceId } = req.body;

    // Нормалізація: переводимо все в тонни (t)
    let massExcess = parseFloat(massInput);
    let conversionFactor = 1;

    if (unit === 'kg') {
      conversionFactor = 0.001;
      massExcess = massExcess * conversionFactor;
    } else if (unit === 'mg_m3') { 
       // Прикладне переведення, якщо вхідні дані це концентрація, потрібен об'єм викиду.
       // Для спрощення задачі вважаємо, що це пряме переведення маси, 
       // або user в UI вже ввів "т".
       // Якщо це концентрація, треба питати об'єм (V).
       // Поки залишимо просту конвертацію маси.
       conversionFactor = 0.000000001; // мг -> т (дуже умовно без об'єму)
    }

    // Валідація невід'ємності
    if (massExcess < 0) throw new Error('Mass must be >= 0');

    // Формула: Mass * Base * Kt * Kr * K...
    const kOtherProd = (kOther || []).reduce((acc, val) => acc * val, 1);
    const total = massExcess * baseRate * kT * kR * kOtherProd;

    const newCalc = new DamageCalc({
      sourceId,
      pollutant,
      massExcess,
      baseRate,
      kT,
      kR,
      kOther: kOther || [],
      total,
      calculationPassport: {
        inputUnit: unit,
        conversionFactor,
        originalMass: massInput
      }
    });

    await newCalc.save();
    res.json(newCalc);
  } catch (e) {
    next(e);
  }
};

// 5. Генерація синтетичних даних
export const generateSyntheticData = async (req, res, next) => {
  try {
    const count = req.body.count || 10;
    const pollutantsList = ['SO2', 'NOx', 'CO', 'PM10', 'VOC'];
    const config = await getConfig();

    const random = (min, max) => Math.random() * (max - min) + min;

    const createdItems = [];

    for (let i = 0; i < count; i++) {
      const pollutant = pollutantsList[Math.floor(Math.random() * pollutantsList.length)];
      
      // Діапазони з завдання
      const massExcess = random(0.01, 50); // т/рік
      
      // Беремо базу з конфігу або генеруємо
      const refData = config.pollutants?.[pollutant] || {};
      const baseRate = refData.baseRate || random(0.01, 50);
      const kT = refData.kT || random(0.5, 5);
      
      const kR = random(0.5, 5);
      const kSeasonal = random(0.5, 5); // K

      const total = massExcess * baseRate * kT * kR * kSeasonal;

      createdItems.push({
        sourceId: `synth_${Date.now()}_${i}`,
        pollutant,
        massExcess,
        baseRate,
        kT,
        kR,
        kOther: [kSeasonal],
        total,
        calculationPassport: {
            inputUnit: 't',
            conversionFactor: 1,
            originalMass: massExcess
        }
      });
    }

    await DamageCalc.insertMany(createdItems);
    res.json({ message: `Generated ${count} records`, items: createdItems });
  } catch (e) {
    next(e);
  }
};

// 6. Видалення запису
export const deleteCalculation = async (req, res, next) => {
    try {
        await DamageCalc.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
}