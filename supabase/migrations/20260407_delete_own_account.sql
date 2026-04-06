-- Function: delete_own_account
-- Allows an authenticated user to delete their own account and all associated data.
-- Runs as SECURITY DEFINER so it can delete from auth.users.

create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid;
begin
  _user_id := auth.uid();

  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Delete user data
  delete from user_cards where user_id = _user_id;

  -- Delete the auth user (cascades to auth.sessions, auth.identities, etc.)
  delete from auth.users where id = _user_id;
end;
$$;

-- Only authenticated users can call this
revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;
