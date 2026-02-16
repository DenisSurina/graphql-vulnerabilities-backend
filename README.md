# The Book Nook - Backend

GraphQL API za online knjižaru. Napravljen za seminar iz Tehnika sigurnog programiranja na TVZ-u.

## Tech stack

- Node.js + Express
- Apollo Server 5 (GraphQL)
- MariaDB (Docker)
- JWT autentifikacija

## Pokretanje

### 1. Baza podataka

```bash
docker compose up -d
```

Pokreće MariaDB kontejner na portu 3307. Automatski izvršava `init-db.sql` pri prvom pokretanju.

### 2. Backend

```bash
npm install
npm run dev
```

Server se pokreće na `http://localhost:4000/`.

### 3. Environment varijable

Već postoji `.env` s defaultnim vrijednostima. Ako treba nešto mijenjati:

```
PORT=4000
DB_HOST=localhost
DB_PORT=3307
DB_USER=appuser
DB_PASSWORD=apppass
DB_NAME=graphql_vuln
JWT_SECRET=secret123
```

## Struktura

```
src/
  server.js       - entry point
  app.js          - Apollo Server konfiguracija
  db.js           - MySQL connection pool
  auth.js         - JWT sign/verify
  schema/
    typeDefs.js   - GraphQL shema
    resolvers.js  - resolveri
```

## Napomena

Aplikacija ima namjerno ugrađene ranjivosti za potrebe seminara. Ne koristiti u produkciji.
