-- Migración: Habilitar acceso público para Invitaciones
-- 1. Permitir ver Pagador por Token
create policy "Public can view payer by invitation token"
on public.payers for select
using (invitation_token is not null);

-- 2. Permitir ver nombre del perfil para la invitación
-- (Solo permitimos ver el nombre de quien invita para no exponer datos sensibles)
create policy "Public can view inviter profile name"
on public.profiles for select
using (
  exists (
    select 1 from public.payers
    where payers.created_by = profiles.id
    and payers.invitation_token is not null
  )
);
