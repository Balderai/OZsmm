insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "client_documents_select_visible_metadata"
on storage.objects for select to authenticated
using (
  bucket_id = 'client-documents'
  and exists (
    select 1
    from public.documents d
    where d.storage_bucket = storage.objects.bucket_id
      and d.storage_path = storage.objects.name
      and d.firm_id = app_private.current_firm_id()
      and d.status = 'active'
      and (
        app_private.is_accountant()
        or exists (
          select 1 from public.client_memberships cm
          where cm.client_id = d.client_id and cm.user_id = auth.uid()
        )
      )
  )
);

create policy "client_documents_accountant_upload_path_scope"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'client-documents'
  and app_private.is_accountant()
  and (storage.foldername(name))[1] = 'firm_' || app_private.current_firm_id()::text
  and exists (
    select 1
    from public.clients c
    where c.firm_id = app_private.current_firm_id()
      and (storage.foldername(name))[2] = 'client_' || c.id::text
  )
  and (storage.foldername(name))[3] in ('declarations', 'accruals', 'documents_photos')
);

create policy "client_documents_client_upload_documents_photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'client-documents'
  and app_private.current_role() = 'client'
  and (storage.foldername(name))[1] = 'firm_' || app_private.current_firm_id()::text
  and (storage.foldername(name))[3] = 'documents_photos'
  and exists (
    select 1
    from public.client_memberships cm
    where cm.user_id = auth.uid()
      and cm.firm_id = app_private.current_firm_id()
      and (storage.foldername(name))[2] = 'client_' || cm.client_id::text
  )
);

create policy "client_documents_accountant_update_delete"
on storage.objects for update to authenticated
using (
  bucket_id = 'client-documents'
  and app_private.is_accountant()
  and (storage.foldername(name))[1] = 'firm_' || app_private.current_firm_id()::text
)
with check (
  bucket_id = 'client-documents'
  and app_private.is_accountant()
  and (storage.foldername(name))[1] = 'firm_' || app_private.current_firm_id()::text
);
