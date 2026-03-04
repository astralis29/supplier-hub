export const runtime = "nodejs";

export async function GET() {

  return Response.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

}