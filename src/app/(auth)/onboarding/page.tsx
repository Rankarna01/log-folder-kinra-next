'use client';

import { useRouter } from 'next/navigation';
import { ProfileSetupForm } from '@/components/onboarding/ProfileSetupForm';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="kc-card kc-onboard">
      <p className="kc-eyebrow">Langkah 2 dari 2</p>
      <h1 className="kc-onboard-title">Lengkapi profil peserta</h1>
      <p className="kc-muted kc-small kc-onboard-lead">Pilih mentor pembimbing dari daftar yang sudah didaftarkan admin.</p>
      <ProfileSetupForm
        onDone={() => {
          router.replace('/dashboard');
          router.refresh();
        }}
      />
    </div>
  );
}
