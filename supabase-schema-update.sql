create table if not exists registration_codes (
  code text primary key,
  pet_id text unique,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

alter table pets
add column if not exists emergency_phone text,
add column if not exists animal_registration_number text,
add column if not exists qr_image_url text,
add column if not exists registration_code text unique,
add column if not exists password_hash text;

create index if not exists registration_codes_pet_id_idx
on registration_codes (pet_id);

create index if not exists pets_registration_code_idx
on pets (registration_code);

-- 등록코드는 관리자가 고객에게 전달하기 전에 미리 생성해둡니다.
-- 예시:
-- insert into registration_codes (code)
-- values ('PET-ABCD-1234')
-- on conflict (code) do nothing;
