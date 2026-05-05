import { ApiDoc, RouteDoc } from '../core/docGenerator';

function renderSchema(schema: Record<string, unknown> | undefined, indent = 2): string {
  if (!schema) return 'N/A';
  return JSON.stringify(schema, null, indent);
}

function renderRouteHtml(route: RouteDoc): string {
  return `
  <div class="route">
    <h3><span class="method method-${route.method.toLowerCase()}">${route.method}</span> ${route.path}</h3>
    <p>Samples: ${route.sampleCount} &nbsp;|&nbsp; Last seen: ${route.lastSeen}</p>
    ${route.querySchema ? `<details><summary>Query Params</summary><pre>${renderSchema(route.querySchema)}</pre></details>` : ''}
    ${route.requestBodySchema ? `<details><summary>Request Body</summary><pre>${renderSchema(route.requestBodySchema)}</pre></details>` : ''}
    ${route.responseSchema ? `<details><summary>Response Body</summary><pre>${renderSchema(route.responseSchema)}</pre></details>` : ''}
  </div>`;
}

export function renderHtml(doc: ApiDoc): string {
  const routesHtml = doc.routes.map(renderRouteHtml).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>RouteWatch — Live API Docs</title>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #333; }
    .route { border: 1px solid #e0e0e0; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
    .method { padding: 2px 8px; border-radius: 4px; color: #fff; font-weight: bold; }
    .method-get { background: #61affe; }
    .method-post { background: #49cc90; }
    .method-put { background: #fca130; }
    .method-delete { background: #f93e3e; }
    .method-patch { background: #50e3c2; }
    pre { background: #f5f5f5; padding: 0.75rem; border-radius: 4px; overflow-x: auto; }
    details summary { cursor: pointer; font-weight: 600; margin: 0.5rem 0; }
  </style>
</head>
<body>
  <h1>RouteWatch — Live API Docs</h1>
  <p>Generated at: ${doc.generatedAt} &nbsp;|&nbsp; Total routes: ${doc.totalRoutes}</p>
  ${routesHtml}
</body>
</html>`;
}

export function renderJson(doc: ApiDoc): string {
  return JSON.stringify(doc, null, 2);
}
