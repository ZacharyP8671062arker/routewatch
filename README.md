# routewatch

Lightweight Express/Fastify middleware that generates live API route documentation as traffic flows through.

## Installation

```bash
npm install routewatch
```

## Usage

### Express

```typescript
import express from "express";
import { routewatch } from "routewatch";

const app = express();

app.use(routewatch());

app.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id });
});

app.listen(3000);
```

Once running, visit `http://localhost:3000/_routewatch` to view your live API documentation. Routes are discovered and documented automatically as requests flow through the middleware.

### Fastify

```typescript
import Fastify from "fastify";
import { routewatchPlugin } from "routewatch";

const app = Fastify();

await app.register(routewatchPlugin);

app.get("/users/:id", async (request, reply) => {
  return { id: request.params.id };
});

await app.listen({ port: 3000 });
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | `string` | `/_routewatch` | URL path for the docs UI |
| `title` | `string` | `"API Docs"` | Title shown in the docs UI |
| `exclude` | `string[]` | `[]` | Route patterns to exclude |

## License

MIT