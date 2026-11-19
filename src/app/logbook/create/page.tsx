import { redirect } from 'next/navigation';

// Tambah logbook sekarang dilakukan dari kalender (modal).
export default function CreateLogbookRedirect() {
  redirect('/logbook');
}
