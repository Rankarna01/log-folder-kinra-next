import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { homeForRole, roleFromEmail } from '@/lib/auth/roles';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  redirect(homeForRole(prof?.role ?? roleFromEmail(user.email)));
}
