// server/src/services/openmeteoService.js
import axios from 'axios';

const BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const DEFAULT_PARAMS = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
  'carbon_monoxide',
];

export async function fetchOpenMeteoAQ({ lat, lon, parameters = DEFAULT_PARAMS }) {
  const params = new URLSearchParams();
  params.set('latitude', String(lat));
  params.set('longitude', String(lon));
  params.set('timezone', 'UTC');
  params.set('hourly', parameters.join(','));

  const fd = Number(process.env.FORECAST_DAYS ?? 0); 
  const pd = Number(process.env.PAST_DAYS ?? 10);
  params.set('forecast_days', String(fd));
  if (pd > 0) params.set('past_days', String(pd));

  const url = `${BASE_URL}?${params.toString()}`;
  const { data } = await axios.get(url, { timeout: 15000 });
  return data;
}

export function mapToRecords(data, city = 'Unknown') {
  const hourly = data?.hourly || {};
  const times = hourly.time || [];
  const records = [];
  const coords = { latitude: data?.latitude, longitude: data?.longitude };

  const paramKeys = Object.keys(hourly).filter(k => k !== 'time');
  for (let i = 0; i < times.length; i++) {
    const date = new Date(times[i] + 'Z');
    for (const param of paramKeys) {
      const arr = hourly[param] || [];
      const val = arr[i];
      if (val === null || val === undefined) continue;
      records.push({
        city,
        parameter: param,
        value: val,
        unit: 'µg/m³',
        dateUtc: date,
        coordinates: coords,
        raw: { time: times[i], value: val, lat: coords.latitude, lon: coords.longitude },
      });
    }
  }
  return records;
}
