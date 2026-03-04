export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

export async function GET() {

  try {

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("rss_sources")
      .select("*")
      .limit(1);

    if (error) {
      return Response.json({
        success: false,
        error: error.message
      });
    }

    return Response.json({
      success: true,
      rowsReturned: data?.length
    });

  } catch (err) {

    return Response.json({
      success: false,
      error: String(err)
    });

  }
}