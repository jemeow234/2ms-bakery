-- Card payments are replaced by GCash. 'card' stays valid so past orders keep
-- their recorded payment method; the app no longer offers it.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cash', 'gcash', 'card'));
