import { ApiDoc } from './docGenerator';

export type ExportFormat = 'json' | 'openapi' | 'markdown';

export function formatAsJson(doc: ApiDoc): string {
  return JSON.stringify(doc, null, 2);
}

export function formatAsOpenApi(doc: ApiDoc): object {
  const paths: Record<string, unknown> = {};

  for (const route of doc.routes) {
    const path = route.path.replace(/:([a-zA-Z_]+)/g, '{$1}');
    if (!paths[path]) paths[path] = {};

    const method = route.method.toLowerCase();
    (paths[path] as Record<string, unknown>)[method] = {
      summary: `${route.method} ${route.path}`,
      parameters: route.path.includes(':') ? extractPathParams(route.path) : [],
      requestBody: route.requestSchema
        ? {
            content: {
              'application/json': {
                schema: route.requestSchema,
              },
            },
          }
        : undefined,
      responses: {
        '200': {
          description: 'Successful response',
          content: route.responseSchema
            ? {
                'application/json': {
                  schema: route.responseSchema,
                },
              }
            : undefined,
        },
      },
    };
  }

  return {
    openapi: '3.0.0',
    info: { title: 'API Documentation', version: '1.0.0' },
    paths,
  };
}

export function formatAsMarkdown(doc: ApiDoc): string {
  const lines: string[] = ['# API Documentation', ''];

  for (const route of doc.routes) {
    lines.push(`## \`${route.method} ${route.path}\``);
    lines.push('');
    if (route.requestSchema) {
      lines.push('**Request Body:**');
      lines.push('```json');
      lines.push(JSON.stringify(route.requestSchema, null, 2));
      lines.push('```');
      lines.push('');
    }
    if (route.responseSchema) {
      lines.push('**Response:**');
      lines.push('```json');
      lines.push(JSON.stringify(route.responseSchema, null, 2));
      lines.push('```');
      lines.push('');
    }
  }

  return lines.join('\n');
}

function extractPathParams(path: string): object[] {
  const matches = path.match(/:([a-zA-Z_]+)/g) || [];
  return matches.map((m) => ({
    name: m.slice(1),
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
}

export function exportDoc(doc: ApiDoc, format: ExportFormat): string {
  switch (format) {
    case 'json':
      return formatAsJson(doc);
    case 'openapi':
      return JSON.stringify(formatAsOpenApi(doc), null, 2);
    case 'markdown':
      return formatAsMarkdown(doc);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
