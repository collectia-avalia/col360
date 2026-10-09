import { redirect } from 'next/navigation'

interface Props {
    params: Promise<{ token: string }>
}

// Ruta heredada: los enlaces antiguos de invitación se envían al formulario actual.
export default async function InvitePage({ params }: Props) {
    const { token } = await params
    redirect(`/formulario/${encodeURIComponent(token)}`)
}
