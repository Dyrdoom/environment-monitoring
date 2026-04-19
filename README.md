# Environment Monitoring System

A web application designed to collect, store, and analyze environmental data

## Key Features

- **Automated Data Collection:** Periodically fetches air quality data using `node-cron`.
- **API Integration:** Integrated with the Open-Meteo API for real-time environmental metrics.
- **Damage Calculator:** Built-in tool to calculate ecological damage costs.
- **Data Visualization:** Interactive dashboard for viewing historical data.

## Tech Stack

- **Frontend:** React, Vite, Axios
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB

## Quick Start

### 1. Server Setup

```bash
cd server
npm install
# Configure your .env file (PORT, MONGO_URI)
npm run dev
```

### 2. Client Setup

```bash
cd client
npm install
# Configure your .env file (VITE_API_URL)
npm run dev
```

## API Endpoints

- `GET /api/aq` — Fetch air quality samples  
- `POST /api/damage/calculate` — Perform damage calculations  
- `GET /api/damage/history` — View calculation history  
