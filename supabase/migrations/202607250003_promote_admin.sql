update public.profiles
set role = 'admin',
    username = 'admin_kiluah03',
    updated_at = now()
where lower(email) = 'kiluah03@gmail.com';
