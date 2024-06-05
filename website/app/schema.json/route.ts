import schema from '@chainfile/schema';

export async function GET() {
  return Response.json(schema);
}
