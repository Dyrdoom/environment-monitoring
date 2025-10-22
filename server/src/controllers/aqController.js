import AQSample from '../models/AQSample.js';
import { parsePagination, parseDateRange } from '../utils/query.js';
import { fetchOpenMeteoAQ, mapToRecords } from '../services/openmeteoService.js';

export async function list(req, res, next) {
  try {
    const { parameter, city } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const dateFilter = parseDateRange(req.query);
    const filter = { ...dateFilter };
    if (parameter) filter.parameter = parameter;
    if (city) filter.city = city;

    const [items, total] = await Promise.all([
      AQSample.find(filter).sort({ dateUtc: -1 }).skip(skip).limit(limit),
      AQSample.countDocuments(filter),
    ]);
    res.json({ page, limit, total, items });
  } catch (err) {
    next(err);
  }
}

export async function fetchFromApi(req, res, next) {
  try {
    const token = req.header('x-admin-token');
    if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const lat = Number(process.env.LAT || 50.9077);
    const lon = Number(process.env.LON || 34.7981);
    const parameters = (process.env.AQ_PARAMETERS || 'pm2_5,pm10').split(',').map(s => s.trim());

    const data = await fetchOpenMeteoAQ({ lat, lon, parameters });
    const city = process.env.CITY_NAME || 'Sumy';
    const records = mapToRecords(data, city);

    const ops = records.map((rec) => ({
      updateOne: {
        filter: { city: rec.city, parameter: rec.parameter, dateUtc: rec.dateUtc },
        update: {
          $setOnInsert: {
            city: rec.city,
            parameter: rec.parameter,
            dateUtc: rec.dateUtc,
          },
          $set: {
            value: rec.value,
            unit: rec.unit,
            coordinates: rec.coordinates,
            source: rec.source ?? 'Open-Meteo Air Quality',
            raw: rec.raw,
          },
        },
        upsert: true,
      }
    }));

    const bulkRes = ops.length ? await AQSample.bulkWrite(ops, { ordered: false }) : {
      upsertedCount: 0, matchedCount: 0, modifiedCount: 0
    };

    const inserted = bulkRes.upsertedCount ?? 0;
    const matched = bulkRes.matchedCount ?? 0;
    const modified = bulkRes.modifiedCount ?? 0;

    res.json({ ok: true, fetched: records.length, inserted, matched, modified, city, parameters });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const doc = await AQSample.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const doc = await AQSample.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Duplicate sample' });
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const doc = await AQSample.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const doc = await AQSample.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
