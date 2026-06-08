-- MoneyFlow DR — Schema completo
-- Ejecutar en Supabase SQL Editor

-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- PERFILES
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  currency text default 'RD$',
  updated_at timestamp with time zone default now()
);

-- CUENTAS (Banco Popular, BHD, Efectivo, etc.)
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  bank text not null,
  balance numeric(12,2) default 0,
  type text check (type in ('checking','savings','cash')) default 'checking',
  created_at timestamp with time zone default now()
);

-- TRANSACCIONES
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references accounts on delete set null,
  amount numeric(12,2) not null,
  type text check (type in ('income','expense')) not null,
  category text not null default 'Sin categoría',
  merchant text,
  description text,
  date date not null,
  payment_method text check (payment_method in ('card','cash','transfer')) default 'card',
  source text check (source in ('manual','ocr_pdf','ocr_image')) default 'manual',
  created_at timestamp with time zone default now()
);

-- DEUDAS (préstamos, tarjetas)
create table debts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  total_amount numeric(12,2) not null,
  remaining_amount numeric(12,2) not null,
  monthly_payment numeric(12,2) default 0,
  due_date date,
  type text check (type in ('loan','credit_card','other')) default 'loan',
  created_at timestamp with time zone default now()
);

-- CUENTAS POR COBRAR
create table receivables (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  debtor_name text not null,
  amount numeric(12,2) not null,
  due_date date,
  notes text,
  status text check (status in ('pending','paid')) default 'pending',
  created_at timestamp with time zone default now()
);

-- PRESUPUESTOS
create table budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  limit_amount numeric(12,2) not null,
  month text not null, -- formato: '2026-06'
  created_at timestamp with time zone default now()
);

-- METAS
create table goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) default 0,
  deadline date,
  created_at timestamp with time zone default now()
);

-- REGLAS DE CATEGORIZACIÓN (IA adaptativa por usuario)
create table category_rules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  keyword text not null,
  category text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, keyword)
);

-- =============================================
-- ROW LEVEL SECURITY (nadie ve datos de otros)
-- =============================================
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table debts enable row level security;
alter table receivables enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;
alter table category_rules enable row level security;

-- Políticas: cada usuario solo ve y modifica sus propios datos
create policy "Users own their profiles" on profiles for all using (auth.uid() = id);
create policy "Users own their accounts" on accounts for all using (auth.uid() = user_id);
create policy "Users own their transactions" on transactions for all using (auth.uid() = user_id);
create policy "Users own their debts" on debts for all using (auth.uid() = user_id);
create policy "Users own their receivables" on receivables for all using (auth.uid() = user_id);
create policy "Users own their budgets" on budgets for all using (auth.uid() = user_id);
create policy "Users own their goals" on goals for all using (auth.uid() = user_id);
create policy "Users own their category_rules" on category_rules for all using (auth.uid() = user_id);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
