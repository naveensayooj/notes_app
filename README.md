# Notes App

Notes are managed with React Context and persisted by JSON Server in `db.json`.

## Run the app

Start the API and Vite app in separate terminals from this directory:

```sh
npm run server
npm run dev
```

JSON Server listens on `http://localhost:3001`; the app runs on the URL printed by Vite. Override the API URL with `VITE_API_URL` if needed.

## Notes API

JSON Server exposes these standard collection routes:

- `GET /notes`
- `POST /notes`
- `PUT /notes/:id`
- `PATCH /notes/:id`
- `DELETE /notes/:id`

Each note contains `id`, `title`, `content`, `color`, `tags`, `archived`, `stock`, `createdAt`, and `updatedAt`. Changes are written to `db.json` and remain available after restarting the app.
