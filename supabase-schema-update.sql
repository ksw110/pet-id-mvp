create table if not exists registration_codes (
  code text primary key,
  pet_id text unique,
  qr_image_url text,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

alter table pets
add column if not exists emergency_phone text,
add column if not exists user_id text unique,
add column if not exists gender text,
add column if not exists birth_year integer,
add column if not exists animal_registration_number text,
add column if not exists qr_image_url text,
add column if not exists registration_code text unique,
add column if not exists password_hash text;

create index if not exists registration_codes_pet_id_idx
on registration_codes (pet_id);

create index if not exists pets_registration_code_idx
on pets (registration_code);

create index if not exists pets_user_id_idx
on pets (user_id);

-- 등록코드는 관리자가 먼저 생성하고,
-- QR 이미지까지 함께 만들어서 고객에게 전달합니다.
-- 예시:
-- insert into registration_codes (code, pet_id, qr_image_url)
-- values ('PET-ABCD-1234', 'nanoid-id-here', 'https://...')
-- on conflict (code) do nothing;
