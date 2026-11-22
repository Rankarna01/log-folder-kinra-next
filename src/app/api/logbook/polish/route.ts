import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MAX_CHARS = 2000;
const MODEL = 'claude-haiku-5-5';

const SYSTEM = `Kamu merapikan deskripsi logbook harian peserta magang KINRA dalam Bahasa Indonesia.
Aturan:
- Perbaiki tata bahasa, ejaan, dan susunan kalimat agar rapi dan formal-sederhana.
- Pertahankan semua fakta, angka, nama, dan istilah teknis. Jangan menambah kegiatan baru.
- Keluarkan HANYA teks hasil rapikan, tanpa penjelasan, judul, atau tanda kutip.`;

/** Merapikan teks deskripsi logbook memakai LLM. Kunci ANTHROPIC_API_KEY hanya di server. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sesi berakhir. Silakan masuk kembali.' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Fitur rapikan AI belum dikonfigurasi di server.' }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'Teks kosong, tidak ada yang bisa dirapikan.' }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `Teks terlalu panjang (maks. ${MAX_CHARS} karakter).` }, { status: 400 });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Layanan rapikan AI sedang tidak tersedia. Coba lagi nanti.' }, { status: 502 });
  }

  const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const polished = json.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';
  if (!polished) {
    return NextResponse.json({ error: 'Hasil rapikan kosong. Coba lagi.' }, { status: 502 });
  }

  return NextResponse.json({ text: polished });
}
