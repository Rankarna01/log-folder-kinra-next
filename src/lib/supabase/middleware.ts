import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { homeForRole, roleFromEmail } from '@/lib/auth/roles';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register');
  const isAdminArea = path === '/admin' || path.startsWith('/admin/');
  const isMentorArea = path === '/mentor' || path.startsWith('/mentor/');
  // Halaman khusus peserta magang
  const isParticipantArea = ['/dashboard', '/logbook', '/reports'].some(
    (p) => path === p || path.startsWith(p + '/')
  );

  // Route API memeriksa sesinya sendiri dan membalas JSON, bukan redirect.
  if (!user && !isAuthPage && path !== '/' && !path.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Role hanya dicari bila memang dibutuhkan untuk keputusan redirect.
  if (user && (isAuthPage || isAdminArea || isMentorArea || isParticipantArea)) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = prof?.role ?? roleFromEmail(user.email);
    const home = homeForRole(role);

    const redirectTo = (pathname: string) => {
      const url = request.nextUrl.clone();
      url.pathname = pathname;
      url.search = '';
      const res = NextResponse.redirect(url);
      // Bawa cookie sesi yang mungkin baru di-refresh.
      supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
      return res;
    };

    if (isAuthPage) return redirectTo(home);
    if (isAdminArea && role !== 'admin') return redirectTo(home);
    if (isParticipantArea && role !== 'participant') return redirectTo(home);
    if (isMentorArea && role !== 'mentor') return redirectTo(home);
  }

  return supabaseResponse;
}
