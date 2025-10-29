# Country Currency & Exchange API

RESTful API that fetches country data and USD exchange rates from external sources, caches them in MySQL, and exposes CRUD and status endpoints. Generates a summary PNG image after each refresh.

### Tech
- NestJS (TypeScript), TypeORM, MySQL
- @nestjs/axios (HttpService), class-validator/transformer
- @napi-rs/canvas for image generation

### Setup
1) Install deps
```bash
pnpm install
```

2) Create `.env` in project root
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=hng_countries

# Required external APIs
COUNTRIES_API_URL=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_RATES_API_URL=https://open.er-api.com/v6/latest/USD
```

3) Start server
```bash
pnpm run start:dev
```

### Endpoints
- POST `/countries/refresh` → Fetch countries and exchange rates; upsert cache; generate `cache/summary.png`.
- GET `/countries` → List with filters/sorting: `?region=Africa`, `?currency=NGN`, `?sort=gdp_desc|gdp_asc|population_desc|population_asc|name_asc`.
- GET `/countries/:name` → Case-insensitive by name.
- DELETE `/countries/:name` → Delete by name.
- GET `/status` → `{ total_countries, last_refreshed_at }`.
- GET `/countries/image` → Serve `cache/summary.png` or `{ error: "Summary image not found" }`.

### Notes
- Only refresh route mutates DB.
- `estimated_gdp = population × random(1000–2000) ÷ exchange_rate`.
- If no currencies: `currency_code=null`, `exchange_rate=null`, `estimated_gdp=0`.
- If currency not in rates: `exchange_rate=null`, `estimated_gdp=null`.
- Upserts match by name (case-insensitive).
- External API failure returns 503 and leaves DB unchanged.

### Troubleshooting
- If refresh returns 503 with missing URLs, ensure `.env` contains `COUNTRIES_API_URL` and `EXCHANGE_RATES_API_URL` and restart the server.
- If image generation fails, ensure `@napi-rs/canvas` is installed (run `pnpm install`).
