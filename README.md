<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Country Currency & Exchange API

RESTful API that fetches country data and USD exchange rates from external sources, caches them in MySQL, and exposes CRUD and status endpoints. Generates a summary PNG image after each refresh.

### Tech
- NestJS (TypeScript), TypeORM, MySQL
- Axios for HTTP, class-validator/transformer for validation
- node-canvas for image generation

### Setup
1) Install deps
```bash
pnpm install
```

2) Create `.env` from `.env.example`
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=hng_countries
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
