-- Announcements: drop the "advertisement" kind and add an active window.
--
-- starts_at / ends_at bound when customers see an announcement. ends_at is
-- optional: an announcement with no end date stays up until it is deleted.

update public.announcements set type = 'announcement' where type <> 'announcement';

alter table public.announcements drop constraint if exists announcements_type_check;
alter table public.announcements
  add constraint announcements_type_check check (type = 'announcement');

alter table public.announcements
  add column if not exists starts_at timestamptz not null default now(),
  add column if not exists ends_at   timestamptz;

-- Existing announcements were live from the moment they were posted.
update public.announcements set starts_at = created_at;

alter table public.announcements drop constraint if exists announcements_window_check;
alter table public.announcements
  add constraint announcements_window_check check (ends_at is null or ends_at > starts_at);

create index if not exists announcements_window_idx
  on public.announcements (starts_at, ends_at);

-- A low rating (1–2 stars) must say what went wrong.
alter table public.order_feedback drop constraint if exists order_feedback_low_rating_reason_check;
alter table public.order_feedback
  add constraint order_feedback_low_rating_reason_check
  check (rating > 2 or length(btrim(comment)) > 0)
  not valid;
