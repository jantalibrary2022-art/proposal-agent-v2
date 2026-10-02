-- Optional: add one sample purchase so the Purchases / billing section shows a row and an invoice.
-- It finds your user id by email; do NOT type a UUID or email into the column list.
-- Run after schema.sql.

insert into public.purchases (user_id, description, amount, currency, status, invoice_no)
select u.id,
       'Prastav — Project proposal',
       6999,
       'INR',
       'paid',
       'PRS/2026/0001'
from auth.users u
where u.email = '621.prakash@gmail.com';
