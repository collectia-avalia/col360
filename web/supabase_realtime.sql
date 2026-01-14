alter table public.payers replica identity full;
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.payers;
commit;
