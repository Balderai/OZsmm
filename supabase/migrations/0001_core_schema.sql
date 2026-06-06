create extension if not exists pgcrypto;

create type public.app_role as enum ('accountant', 'client');
create type public.folder_type as enum ('declarations', 'accruals', 'documents_photos');
create type public.document_origin as enum ('accountant_shared', 'client_uploaded');
create type public.document_status as enum ('active', 'archived', 'deleted');
create type public.request_status as enum ('open', 'submitted', 'resolved', 'cancelled');
create type public.notification_category as enum ('document_shared', 'document_request', 'reminder', 'request_completed', 'system');

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  logo_url text,
  brand_color text default '#155E75',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  role public.app_role not null,
  full_name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  company_name text not null,
  tax_number text,
  contact_name text,
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_memberships (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(client_id, user_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  folder_type public.folder_type not null,
  origin public.document_origin not null,
  title text not null,
  description text,
  storage_bucket text not null default 'client-documents',
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  status public.document_status not null default 'active',
  created_by uuid references auth.users(id),
  shared_by uuid references auth.users(id),
  shared_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_views (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique(document_id, user_id)
);

create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  folder_type public.folder_type not null default 'documents_photos',
  title text not null,
  description text,
  status public.request_status not null default 'open',
  due_at timestamptz,
  created_by uuid not null references auth.users(id),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.request_submissions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  request_id uuid not null references public.document_requests(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  submitted_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  category public.notification_category not null,
  title text not null,
  body text not null,
  action_url text,
  related_document_id uuid references public.documents(id) on delete set null,
  related_request_id uuid references public.document_requests(id) on delete set null,
  due_at timestamptz,
  read_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references public.firms(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index clients_firm_company_idx on public.clients(firm_id, company_name);
create index documents_client_folder_idx on public.documents(client_id, folder_type, status);
create index notifications_recipient_idx on public.notifications(recipient_user_id, read_at, created_at desc);
create index requests_client_status_idx on public.document_requests(client_id, status, due_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger firms_set_updated_at before update on public.firms for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger clients_set_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger document_requests_set_updated_at before update on public.document_requests for each row execute function public.set_updated_at();
create trigger push_subscriptions_set_updated_at before update on public.push_subscriptions for each row execute function public.set_updated_at();
