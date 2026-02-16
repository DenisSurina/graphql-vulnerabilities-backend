# The Book Nook - Backend

GraphQL API for an online bookstore built to demonstrate common GraphQL security vulnerabilities.

## Tech stack

- Node.js + Express
- Apollo Server 5 (GraphQL)
- MariaDB (Docker)
- JWT authentication

## Getting started

### 1. Database

```bash
docker compose up -d
```

Starts a MariaDB container on port 3307. Runs `init-db.sql` automatically on first startup.

### 2. Server

```bash
npm install
npm run dev
```

Runs on `http://localhost:4000/`.

### 3. Environment variables

A `.env` file with defaults is included:

```
PORT=4000
DB_HOST=localhost
DB_PORT=3307
DB_USER=appuser
DB_PASSWORD=apppass
DB_NAME=graphql_vuln
JWT_SECRET=secret123
```

## Project structure

```
src/
  server.js       - entry point
  app.js          - Apollo Server config
  db.js           - MySQL connection pool
  auth.js         - JWT sign/verify
  schema/
    typeDefs.js   - GraphQL schema
    resolvers.js  - resolvers
```

## Disclaimer

This application has intentionally built-in vulnerabilities for educational purposes. Do not use in production.
