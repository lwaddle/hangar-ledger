-- Import sessions table (tracks each import job)
create table import_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  source_type text not null check (source_type in ('csv_template', 'airplane_manager')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  original_filename text,
  storage_path text,
  total_records int not null default 0,
  processed_records int not null default 0,
  failed_records int not null default 0,
  error_message text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

-- Import logs table (tracks individual record import results)
create table import_logs (
  id uuid primary key default gen_random_uuid(),
  import_session_id uuid not null references import_sessions(id) on delete cascade,
  row_number int not null,
  status text not null check (status in ('success', 'error', 'skipped')),
  entity_type text not null,
  entity_id uuid,
  source_data jsonb,
  error_message text,
  created_at timestamptz default now()
);

-- Indexes
create index import_sessions_user_id_idx on import_sessions(user_id);
create index import_sessions_status_idx on import_sessions(status);
create index import_logs_session_id_idx on import_logs(import_session_id);
create index import_logs_status_idx on import_logs(status);

-- Apply updated_at trigger to import_sessions
create trigger import_sessions_updated_at before update on import_sessions
  for each row execute function update_updated_at();

-- Enable RLS
alter table import_sessions enable row level security;
alter table import_logs enable row level security;

-- RLS Policies for import_sessions
create policy "Users can view own import sessions"
  on import_sessions for select using (user_id = auth.uid());

create policy "Users can insert own import sessions"
  on import_sessions for insert with check (user_id = auth.uid());

create policy "Users can update own import sessions"
  on import_sessions for update using (user_id = auth.uid());

create policy "Users can delete own import sessions"
  on import_sessions for delete using (user_id = auth.uid());

-- RLS Policies for import_logs (access through parent session)
create policy "Users can view own import logs"
  on import_logs for select using (
    import_session_id in (select id from import_sessions where user_id = auth.uid())
  );

create policy "Users can insert own import logs"
  on import_logs for insert with check (
    import_session_id in (select id from import_sessions where user_id = auth.uid())
  );
