

# Plan: Profiles Tabel Migration

Alleen een database migration, geen frontend wijzigingen.

## SQL Migration

De migration bevat:

1. **Profiles tabel** met alle gevraagde kolommen (user_id, first_name, last_name, phone, avatar_url, date_of_birth, nationality, emergency_contact, timestamps)

2. **Trigger function `handle_new_user`** die bij nieuwe auth.users een profiel aanmaakt met first_name/last_name uit `raw_user_meta_data`

3. **Trigger `on_auth_user_created`** op `auth.users` AFTER INSERT

4. **RLS policies:**
   - SELECT eigen profiel: `auth.uid() = user_id`
   - UPDATE eigen profiel: `auth.uid() = user_id`
   - SELECT voor managers: check via `user_roles` tabel of user role 'manager' of 'owner' heeft EN dezelfde locatie deelt

5. **updated_at trigger** voor automatische timestamp updates

## Technische Details

- De manager/owner SELECT policy gebruikt een security definer function om recursie te voorkomen
- Omdat `app_role` enum alleen `admin`, `moderator`, `user` bevat, worden 'manager' en 'owner' als text vergeleken via een aparte query op `user_roles.role::text`
- Of: we voegen 'manager' en 'owner' toe aan de `app_role` enum als dat nog niet bestaat

Aangezien de huidige `app_role` enum alleen `admin`, `moderator`, `user` bevat, en de user vraagt om 'manager' en 'owner' rollen, wordt de enum uitgebreid met deze waarden. De locatie-check voor managers gebruikt `user_roles.location` om te matchen.

