create schema if not exists app_private;

create or replace function app_private.current_firm_id()
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select firm_id from public.profiles where id = auth.uid() and is_active = true limit 1
$$;

create or replace function app_private.current_role()
returns public.app_role
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select role from public.profiles where id = auth.uid() and is_active = true limit 1
$$;

create or replace function app_private.is_accountant()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select app_private.current_role() = 'accountant'
$$;

grant usage on schema app_private to authenticated;
grant execute on all functions in schema app_private to authenticated;

alter table public.firms enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_memberships enable row level security;
alter table public.documents enable row level security;
alter table public.document_views enable row level security;
alter table public.document_requests enable row level security;
alter table public.request_submissions enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.audit_logs enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on all tables in schema public to authenticated;

create policy "profiles_select_own_or_firm_accountant"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or (app_private.is_accountant() and firm_id = app_private.current_firm_id())
);

create policy "profiles_accountant_manage_same_firm"
on public.profiles for all to authenticated
using (app_private.is_accountant() and firm_id = app_private.current_firm_id())
with check (app_private.is_accountant() and firm_id = app_private.current_firm_id());

create policy "firms_select_own"
on public.firms for select to authenticated
using (id = app_private.current_firm_id());

create policy "firms_accountant_update_own"
on public.firms for update to authenticated
using (app_private.is_accountant() and id = app_private.current_firm_id())
with check (app_private.is_accountant() and id = app_private.current_firm_id());

create policy "clients_select_scope"
on public.clients for select to authenticated
using (
  firm_id = app_private.current_firm_id()
  and (
    app_private.is_accountant()
    or exists (
      select 1 from public.client_memberships cm
      where cm.client_id = clients.id and cm.user_id = auth.uid()
    )
  )
);

create policy "clients_accountant_manage"
on public.clients for all to authenticated
using (app_private.is_accountant() and firm_id = app_private.current_firm_id())
with check (app_private.is_accountant() and firm_id = app_private.current_firm_id());

create policy "memberships_select_scope"
on public.client_memberships for select to authenticated
using (
  firm_id = app_private.current_firm_id()
  and (app_private.is_accountant() or user_id = auth.uid())
);

create policy "memberships_accountant_manage"
on public.client_memberships for all to authenticated
using (app_private.is_accountant() and firm_id = app_private.current_firm_id())
with check (app_private.is_accountant() and firm_id = app_private.current_firm_id());

create policy "documents_select_scope"
on public.documents for select to authenticated
using (
  firm_id = app_private.current_firm_id()
  and status = 'active'
  and (
    app_private.is_accountant()
    or exists (
      select 1 from public.client_memberships cm
      where cm.client_id = documents.client_id and cm.user_id = auth.uid()
    )
  )
);

create policy "documents_accountant_manage"
on public.documents for all to authenticated
using (app_private.is_accountant() and firm_id = app_private.current_firm_id())
with check (app_private.is_accountant() and firm_id = app_private.current_firm_id());

create policy "documents_client_upload"
on public.documents for insert to authenticated
with check (
  firm_id = app_private.current_firm_id()
  and origin = 'client_uploaded'
  and folder_type = 'documents_photos'
  and created_by = auth.uid()
  and exists (
    select 1 from public.client_memberships cm
    where cm.client_id = documents.client_id and cm.user_id = auth.uid()
  )
);

create policy "document_views_select_scope"
on public.document_views for select to authenticated
using (
  firm_id = app_private.current_firm_id()
  and (
    app_private.is_accountant()
    or user_id = auth.uid()
  )
);

create policy "document_views_insert_visible"
on public.document_views for insert to authenticated
with check (
  firm_id = app_private.current_firm_id()
  and user_id = auth.uid()
  and exists (
    select 1 from public.documents d
    where d.id = document_views.document_id
      and d.firm_id = document_views.firm_id
      and d.status = 'active'
  )
);

create policy "requests_select_scope"
on public.document_requests for select to authenticated
using (
  firm_id = app_private.current_firm_id()
  and (
    app_private.is_accountant()
    or exists (
      select 1 from public.client_memberships cm
      where cm.client_id = document_requests.client_id and cm.user_id = auth.uid()
    )
  )
);

create policy "requests_accountant_manage"
on public.document_requests for all to authenticated
using (app_private.is_accountant() and firm_id = app_private.current_firm_id())
with check (app_private.is_accountant() and firm_id = app_private.current_firm_id());

create policy "submissions_select_scope"
on public.request_submissions for select to authenticated
using (
  firm_id = app_private.current_firm_id()
  and (
    app_private.is_accountant()
    or submitted_by = auth.uid()
  )
);

create policy "submissions_client_insert"
on public.request_submissions for insert to authenticated
with check (
  firm_id = app_private.current_firm_id()
  and submitted_by = auth.uid()
);

create policy "notifications_select_scope"
on public.notifications for select to authenticated
using (
  firm_id = app_private.current_firm_id()
  and (
    app_private.is_accountant()
    or recipient_user_id = auth.uid()
    or exists (
      select 1 from public.client_memberships cm
      where cm.client_id = notifications.client_id and cm.user_id = auth.uid()
    )
  )
);

create policy "notifications_accountant_insert"
on public.notifications for insert to authenticated
with check (app_private.is_accountant() and firm_id = app_private.current_firm_id());

create policy "notifications_recipient_mark_read"
on public.notifications for update to authenticated
using (recipient_user_id = auth.uid())
with check (recipient_user_id = auth.uid());

create policy "push_subscriptions_own"
on public.push_subscriptions for all to authenticated
using (user_id = auth.uid() and firm_id = app_private.current_firm_id())
with check (user_id = auth.uid() and firm_id = app_private.current_firm_id());

create policy "audit_logs_accountant_select"
on public.audit_logs for select to authenticated
using (app_private.is_accountant() and firm_id = app_private.current_firm_id());

create policy "audit_logs_accountant_insert"
on public.audit_logs for insert to authenticated
with check (app_private.is_accountant() and firm_id = app_private.current_firm_id());
