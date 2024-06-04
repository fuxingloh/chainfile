import schema from 'chainfile/schema.json';

export async function GET() {
  return Response.json(schema);
}
