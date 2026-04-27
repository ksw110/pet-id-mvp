alter table pets
add column if not exists emergency_phone text,
add column if not exists animal_registration_number text,
add column if not exists qr_image_url text;
