export type UserRole = 'admin' | 'mentor' | 'participant';

export type Mentor = {
  id: string;
  name: string;
  division: string;
  position: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  division: string | null;
  position: string | null;
  mentor_id: string | null;
  mentor_name: string | null;
  nim_nik?: string | null;
  phone?: string | null;
  institution?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Logbook = {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  title: string;
  category: string;
  raw_description: string;
  ai_description: string | null;
  final_description: string;
  output: string | null;
  obstacles: string | null;
  work_location: 'kantor' | 'lapangan';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
  profiles?: Profile;
};

export type Attachment = {
  id: string;
  logbook_id: string;
  file_url: string;
  file_path: string;
  mime_type: string;
  file_size_kb: number | null;
  caption: string | null;
  created_at: string;
};
