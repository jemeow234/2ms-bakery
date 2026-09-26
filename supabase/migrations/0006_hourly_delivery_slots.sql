-- Delivery/pick-up is booked in one-hour slots (7 AM – 5 PM), stored as the
-- slot's start time ('07:00' … '16:00'). 'morning'/'afternoon' stay valid so
-- orders placed before this change keep their schedule.
-- Apply with: npx supabase db push (linked project nucodgvijjzkajllazxt).

alter table public.orders drop constraint if exists orders_delivery_session_check;
alter table public.orders add constraint orders_delivery_session_check
  check (
    delivery_session is null
    or delivery_session in (
      '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00',
      'morning', 'afternoon'
    )
  );
