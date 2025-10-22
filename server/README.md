# Eco Monitor – Server


## Run
```bash
cp .env.example .env
# adjust MONGODB_URI if needed
npm install
npm run dev
```

Manual fetch:
```bash
curl -X POST http://localhost:4000/api/aq/fetch -H "x-admin-token: test"
```

List:
```
http://localhost:4000/api/aq?limit=20
```
