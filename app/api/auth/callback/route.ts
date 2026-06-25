import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Honour an explicit ?next= only when it's not the generic /upload default
  // (e.g. proxy redirected the user away from a specific protected page)
  const explicitNext = searchParams.get("next");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If the user was heading somewhere specific (not just /upload), honour it
      if (explicitNext && explicitNext !== "/upload") {
        return NextResponse.redirect(`${origin}${explicitNext}`);
      }

      // Otherwise decide based on whether they have existing sessions:
      // returning user → show their styles; new user → upload flow
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (count && count > 0) {
          return NextResponse.redirect(`${origin}/session/latest`);
        }
      }

      return NextResponse.redirect(`${origin}/upload`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
