import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno inmediatamente
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import React from 'react';
import { renderToString } from 'react-dom/server';

// Importación dinámica para evitar hoisting
const { sendEmail } = require('../src/lib/actions/email');
const { PayerWelcomeEmail } = require('../src/components/emails/PayerWelcomeEmail');

async function sendTest() {
  const recipient = 'operaciones@collectiabpo.com';
  console.log(`✉️ Enviando correo de prueba a: ${recipient}...`);

  try {
    // Renderizar la plantilla a HTML string localmente en lugar de pasar el JSX a Resend
    const htmlContent = renderToString(
      React.createElement(PayerWelcomeEmail, {
        contactName: 'Gustavo / Operaciones',
        razonSocial: 'Transportes del Sur de Colombia S.A.S. (Prueba)',
        approvedQuota: '$ 150.000.000',
        clientName: 'ABC Proveedores S.A.'
      })
    );

    const result = await sendEmail({
      to: recipient,
      subject: '¡Bienvenido a Avalia! Tu cupo de crédito comercial ha sido aprobado (Prueba)',
      html: htmlContent
    });

    if (result.success) {
      console.log(`✅ ¡Correo enviado con éxito! ID del mensaje: ${result.messageId}`);
    } else {
      console.error(`❌ Error al enviar el correo: ${result.error}`);
    }
  } catch (err: any) {
    console.error('❌ Excepción ocurrida:', err.message || err);
  }
}

sendTest();
