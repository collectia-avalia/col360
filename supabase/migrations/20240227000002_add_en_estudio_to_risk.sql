-- Añadir estado 'en estudio' al enum risk_status
alter type public.risk_status add value if not exists 'en estudio' after 'pendiente';
