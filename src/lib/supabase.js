import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

/*
  ============================================================
  SUPABASE SCHEMA — run this SQL in your Supabase SQL Editor
  Dashboard → SQL Editor → New query → paste → Run
  ============================================================

  create table leads (
    id bigint generated always as identity primary key,
    name text not null,
    phone text,
    email text,
    location text not null,
    use_case text,
    service text,
    stage text default 'First Contact',
    quote_date date,
    quote_amount numeric,
    dp_amount numeric,
    fu_count integer default 0,
    notes text,
    outcome text,
    created_at date default current_date,
    assignee text default 'Noriel',
    source text default 'Facebook',
    qual_checks boolean[] default array[false,false,false,false]
  );

  -- Enable Row Level Security (open policy for now — lock down later)
  alter table leads enable row level security;

  create policy "Allow all" on leads
    for all using (true) with check (true);

*/
