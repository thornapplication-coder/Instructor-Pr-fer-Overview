-- Let anybody with the link READ one nominated row.
--
-- Why: the app is handed around as a link. Whoever opens it should see the
-- current state without an account, and nobody but the owner should be able to
-- change it. That is a read policy for the `anon` role and nothing else.
--
-- What this does NOT do: it adds no insert, update or delete policy for anon.
-- The existing "*_own" policies all test `auth.uid() = user_id`, which the anon
-- role can never satisfy, so a visitor cannot write even if the client tried.
-- The protection is the database's, not the app's.
--
-- BE CLEAR ABOUT WHAT IS PUBLISHED. The anon key ships inside the JavaScript of
-- every deployment - that is what a publishable key is - so a row flagged here
-- is readable by anyone who can reach the site, not only by people who were
-- given the link. Flag the row only when its contents may be seen that widely.

alter table public.app_state
  add column if not exists shared boolean not null default false;

-- One permissive policy alongside the owner's own. RLS ORs them together, so
-- the owner keeps full access to every row of theirs and anon gets exactly the
-- flagged ones.
drop policy if exists "app_state_select_shared" on public.app_state;
create policy "app_state_select_shared" on public.app_state
  for select to anon using (shared = true);

-- The anon role needs the table grant as well; RLS narrows a grant, it does not
-- replace one. `select` only - never insert/update/delete.
--
-- And only the two columns the viewer actually reads (see pullPublic() in
-- src/lib/supabaseSync.js). A bare `grant select on public.app_state` would
-- also hand out `user_id` - the owner's auth UUID - to anybody who asks, which
-- the app has no use for and no reason to publish. Narrow the grant to what is
-- read; the policy decides WHICH rows, the grant decides WHICH columns.
--
-- `shared` is in the list because pullPublic() filters on it, and Postgres
-- needs the privilege on a column to let a WHERE clause reference it - drop it
-- and the viewer gets "permission denied for column shared" instead of data.
revoke select on public.app_state from anon;
grant select (data, updated_at, shared) on public.app_state to anon;

-- Flip the flag for the row that should be visible. Run this separately once
-- you know which account owns it, e.g.:
--
--   update public.app_state set shared = true
--    where user_id = (select id from auth.users where email = 'you@example.com');
--
-- and to stop sharing again:
--
--   update public.app_state set shared = false;
