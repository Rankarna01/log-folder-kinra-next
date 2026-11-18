export type Profile = {
  id: string;
  email: string;
  name: string;
  division: string | null;
  position: string | null;
  mentor_name: string | null;
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
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
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
