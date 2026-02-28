import { redirect } from 'next/navigation'

// Esta ruta ya no se usa. Los pagadores acceden por /formulario/[token]
export default function PortalPage() {
    redirect('/login')
}
