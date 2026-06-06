insert into public.firms (id, name, legal_name, brand_color)
values (
  '11111111-1111-4111-8111-111111111111',
  'Demo Mali Musavirlik',
  'Demo Mali Musavirlik Ltd.',
  '#155E75'
)
on conflict (id) do nothing;

insert into public.clients (id, firm_id, company_name, tax_number, contact_name, contact_email, contact_phone)
values
  (
    '44444444-4444-4444-8444-444444444444',
    '11111111-1111-4111-8111-111111111111',
    'Kara Ticaret A.S.',
    '1234567890',
    'Mehmet Kara',
    'mehmet@example.com',
    '+90 532 000 00 00'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '11111111-1111-4111-8111-111111111111',
    'Ege Zeytin Gida',
    '9876543210',
    'Selin Ege',
    'selin@example.com',
    '+90 533 000 00 00'
  )
on conflict (id) do nothing;

insert into public.documents (
  id,
  firm_id,
  client_id,
  folder_type,
  origin,
  title,
  storage_bucket,
  storage_path,
  mime_type,
  file_size_bytes,
  status,
  shared_at,
  due_at
)
values
  (
    '66666666-6666-4666-8666-666666666666',
    '11111111-1111-4111-8111-111111111111',
    '44444444-4444-4444-8444-444444444444',
    'declarations',
    'accountant_shared',
    'Mayis KDV Beyannamesi',
    'client-documents',
    'firm_11111111-1111-4111-8111-111111111111/client_44444444-4444-4444-8444-444444444444/declarations/2026/06/66666666-6666-4666-8666-666666666666__mayis-kdv.pdf',
    'application/pdf',
    240000,
    'active',
    now(),
    null
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    '11111111-1111-4111-8111-111111111111',
    '44444444-4444-4444-8444-444444444444',
    'accruals',
    'accountant_shared',
    'Mayis KDV Tahakkuk Fisi',
    'client-documents',
    'firm_11111111-1111-4111-8111-111111111111/client_44444444-4444-4444-8444-444444444444/accruals/2026/06/77777777-7777-4777-8777-777777777777__mayis-tahakkuk.pdf',
    'application/pdf',
    180000,
    'active',
    now(),
    now() + interval '20 days'
  )
on conflict (id) do nothing;

-- Auth users are project-specific. After creating Supabase Auth users, insert matching
-- profiles and client_memberships rows using their auth.users.id values.
