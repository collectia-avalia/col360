import { Resend } from 'resend';

// Inicializar el cliente de Resend.
// Asegúrate de que RESEND_API_KEY esté definida en .env.local
export const resend = new Resend(process.env.RESEND_API_KEY);
