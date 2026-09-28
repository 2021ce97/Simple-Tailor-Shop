-- Supabase SQL Migration: Expenses Table for Mujeeb Afghan Fashion House
-- Run this in your Supabase SQL Editor to enable persistent cloud storage for expenses.

create table if not exists public.expenses (
  id text primary key,
  title text not null,
  category text not null default 'other',
  amount numeric not null default 0,
  date date not null default current_date,
  spent_by text not null default '',
  payment_method text not null default 'cash',
  receipt_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for lightning fast searching and filtering by date, person, category
create index if not exists idx_expenses_date on public.expenses(date desc);
create index if not exists idx_expenses_category on public.expenses(category);
create index if not exists idx_expenses_spent_by on public.expenses(spent_by);
create index if not exists idx_expenses_created_at on public.expenses(created_at desc);

-- Enable Row Level Security (RLS)
alter table public.expenses enable row level security;

-- Grant permissions to authenticated shop staff/admins
grant select, insert, update, delete on public.expenses to authenticated;
revoke all on public.expenses from anon;

-- Permissive policies for management
drop policy if exists authenticated_manage_expenses on public.expenses;
create policy authenticated_manage_expenses on public.expenses
  for all to authenticated
  using (true)
  with check (true);

drop policy if exists anon_manage_expenses on public.expenses;

-- Comment for table documentation
comment on table public.expenses is 'Shop operational expenses (rent, electricity, sewing materials, tea/food, staff salaries, etc.) with person tracking and dates.';
