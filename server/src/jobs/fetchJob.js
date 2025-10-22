import cron from 'node-cron';
import { fetchFromApi } from '../controllers/aqController.js';

export default function startFetchJob() {
  const schedule = process.env.CRON_SCHEDULE;
  if (!schedule) {
    console.log('ℹCRON_SCHEDULE not set – skipping background fetch job');
    return;
  }
  cron.schedule(schedule, async () => {
    try {
      await fetchFromApi(
        { header: () => process.env.ADMIN_TOKEN },
        { json: (x) => console.log('Fetch job:', x) },
        (e) => e && console.error('Fetch job error:', e)
      );
    } catch (err) {
      console.error('Fetch job fatal error:', err);
    }
  });
  console.log(`⏱️ Fetch job scheduled with CRON: ${schedule}`);
}
