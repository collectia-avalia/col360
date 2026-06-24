export function PayerWelcomeHtml({
    contactName,
    razonSocial,
    approvedQuota,
    clientName,
}: {
    contactName: string;
    razonSocial: string;
    approvedQuota: string;
    clientName: string;
}) {
    const currentYear = new Date().getFullYear();
    return `
        <div style="font-family: 'Geist Sans', Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);">
            <div style="background-color: #0F172A; color: #ffffff; padding: 32px 24px; text-align: center; border-bottom: 4px solid #7C3AED;">
                <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">
                    Aval<span style="color: #7C3AED;">IA</span>
                </h1>
                <p style="margin: 8px 0 0; font-size: 14px; color: #94A3B8; font-weight: 500;">
                    Respaldo de Crédito Comercial
                </p>
            </div>

            <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
                <p style="font-size: 16px; margin: 0 0 16px 0;">
                    Estimado/a <strong>${contactName}</strong>,
                </p>

                <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">
                    Es un gusto saludarte y darte la bienvenida a la red de confianza de <strong>Avalia</strong>.
                </p>

                <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">
                    Queremos informarte que, a solicitud de tu proveedor <strong>${clientName}</strong>, hemos culminado con éxito el estudio de riesgo y aprobado un cupo de crédito comercial para respaldar tus compras a plazo:
                </p>

                <div style="background-color: #F8FAFC; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px; margin-top: 24px; margin-bottom: 24px; text-align: center;">
                    <span style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Cupo Aprobado y Garantizado</span>
                    <span style="font-size: 32px; font-weight: 900; color: #0F172A; display: block;">${approvedQuota} COP</span>
                </div>

                <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 16px 20px; border-radius: 4px; margin-top: 20px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #1E3A8A; font-weight: bold;">
                        ¿Cómo funciona tu cupo con Avalia?
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #1E40AF; line-height: 1.5;">
                        No somos factoring ni adelantamos dinero sobre tus facturas. Avalia actúa como una entidad fiadora (fianza comercial) que garantiza el pago de tus obligaciones a plazo con tu proveedor. Esto te permite comprar a crédito con la máxima confianza y fortalecer tu relación comercial.
                    </p>
                </div>

                <h3 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 24px 0 12px 0;">
                    ¿Cómo mantener tu cupo activo?
                </h3>
                <p style="font-size: 14px; margin: 0 0 16px 0; color: #475569;">
                    Para disfrutar de este cupo de crédito y futuros incrementos, es fundamental que realices el pago puntual de cada factura emitida por tu proveedor. El cumplimiento oportuno de los plazos evita suspensiones temporales en la plataforma de facturación y mantiene intacto tu historial comercial en nuestra red y centrales de información financiera.
                </p>

                <h3 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 24px 0 12px 0;">
                    Haz crecer tu negocio con Avalia
                </h3>
                <p style="font-size: 14px; margin: 0 0 24px 0; color: #475569;">
                    Al igual que hoy tu proveedor te otorga crédito respaldado por nosotros, tú también puedes ofrecer ventas a plazos a tus propios compradores sin asumir riesgo de cartera. Habilita cupos de crédito y vende de forma segura.
                </p>

                <div style="text-align: center;">
                    <a href="https://avaliab2b.com" style="display: inline-block; padding: 14px 28px; background-color: #2563EB; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgb(37 99 235 / 0.1); text-align: center;" target="_blank" rel="noreferrer">
                        Conocer más de Avalia
                    </a>
                </div>
            </div>

            <div style="background-color: #F8FAFC; padding: 24px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0;">
                    © ${currentYear} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                    Si tienes dudas, contáctanos a <a href="mailto:comercial@avaliab2b.com" style="color: #2563EB; text-decoration: none;">comercial@avaliab2b.com</a> o vía WhatsApp al <a href="https://wa.me/573015965775" style="color: #2563EB; text-decoration: none;">+57 3015965775</a>.
                </p>
                <p style="margin: 0; font-size: 11px; color: #CBD5E1;">
                    Este es un correo informativo sobre tu cupo de crédito comercial.
                </p>
            </div>
        </div>
    `;
}

export function Mora1Html({
    contactName,
    razonSocial,
    invoiceNumber,
    amount,
    dueDate,
    clientName,
}: {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}) {
    const currentYear = new Date().getFullYear();
    return `
        <div style="font-family: 'Geist Sans', Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);">
            <div style="background-color: #0F172A; color: #ffffff; padding: 24px 24px; text-align: center; border-bottom: 4px solid #2563EB;">
                <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">
                    Aval<span style="color: #2563EB;">IA</span>
                </h1>
                <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8; font-weight: 500;">
                    Recordatorio de Vencimiento
                </p>
            </div>

            <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 16px 0;">
                    Estimado/a <strong>${contactName}</strong> (de ${razonSocial}),
                </p>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Esperamos que te encuentres muy bien.
                </p>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Te escribimos para recordarte de manera amable que la factura N° <strong>${invoiceNumber}</strong> con tu proveedor <strong>${clientName}</strong> venció el día de ayer.
                </p>

                <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #92400E; margin-top: 16px; margin-bottom: 16px; font-weight: 500;">
                    Esta obligación registra 1 día de mora en el sistema.
                </div>

                <div style="background-color: #F8FAFC; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tbody>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 40%;">Proveedor / Facturador</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${clientName}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Factura N°</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${invoiceNumber}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Monto Pendiente</td>
                                <td style="color: #B91C1C; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${amount} COP</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Fecha Vencimiento</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${dueDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p style="font-size: 14px; margin: 20px 0 12px 0; color: #334155; font-weight: bold;">
                    Instrucciones de Pago:
                </p>
                <p style="font-size: 14px; margin: 0 0 24px 0; color: #475569; line-height: 1.5;">
                    Te invitamos a realizar el pago a la mayor brevedad. Recuerda que este pago debe efectuarse directamente <strong>en los canales que el cliente ${clientName} dispuso para tal fin</strong>.
                </p>

                <p style="font-size: 13px; color: #64748B; margin: 0; border-top: 1px dashed #e2e8f0; padding-top: 16px;">
                    Si ya realizaste el pago, por favor haz caso omiso de este correo o reenvíanos el soporte correspondiente para actualizar tu estado en la red Avalia.
                </p>
            </div>

            <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0;">
                    © ${currentYear} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                    Si tienes dudas o deseas enviar tu soporte de pago, contáctanos a <a href="mailto:comercial@avaliab2b.com" style="color: #2563EB; text-decoration: none;">comercial@avaliab2b.com</a> o vía WhatsApp al <a href="https://wa.me/573015965775" style="color: #2563EB; text-decoration: none;">+57 3015965775</a>.
                </p>
                <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                    Este es un aviso automático de cartera.
                </p>
            </div>
        </div>
    `;
}

export function Mora5Html({
    contactName,
    razonSocial,
    invoiceNumber,
    amount,
    dueDate,
    clientName,
}: {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}) {
    const currentYear = new Date().getFullYear();
    return `
        <div style="font-family: 'Geist Sans', Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);">
            <div style="background-color: #0F172A; color: #ffffff; padding: 24px 24px; text-align: center; border-bottom: 4px solid #EA580C;">
                <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">
                    Aval<span style="color: #EA580C;">IA</span>
                </h1>
                <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8; font-weight: 500;">
                    Segunda Notificación de Cobro
                </p>
            </div>

            <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 16px 0;">
                    Estimado/a <strong>${contactName}</strong> (de ${razonSocial}),
                </p>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Nos comunicamos nuevamente en relación con la factura N° <strong>${invoiceNumber}</strong> emitida por tu proveedor <strong>${clientName}</strong> por valor de <strong>${amount} COP</strong>, la cual presenta un retraso en su pago.
                </p>

                <div style="background-color: #FFedd5; border-left: 4px solid #EA580C; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #C2410C; margin-top: 16px; margin-bottom: 16px; font-weight: 600;">
                    Esta obligación registra actualmente 5 días de mora.
                </div>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Mantener tus cuentas al día es indispensable para conservar activo tu cupo de crédito comercial garantizado por Avalia y evitar cobros por mora o recargos administrativos por parte de tu proveedor.
                </p>

                <div style="background-color: #F8FAFC; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tbody>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 40%;">Proveedor / Facturador</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${clientName}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Factura N°</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${invoiceNumber}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Monto Pendiente</td>
                                <td style="color: #B91C1C; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${amount} COP</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Fecha Vencimiento</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${dueDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p style="font-size: 14px; margin: 20px 0 12px 0; color: #0F172A; font-weight: bold;">
                    ¿Cómo realizar el pago?
                </p>
                <p style="font-size: 14px; margin: 0 0 24px 0; color: #475569; line-height: 1.5;">
                    Por favor, procede con la cancelación de este saldo <strong>en los canales que el cliente ${clientName} dispuso para tal fin</strong> y remítenos el comprobante de pago respondiendo a este mensaje para actualizar tu estado de inmediato.
                </p>

                <p style="font-size: 13px; color: #64748B; margin: 0; border-top: 1px dashed #e2e8f0; padding-top: 16px;">
                    Si realizaste el pago en las últimas 24 horas, puedes omitir este correo. Agradecemos tu compromiso y puntualidad.
                </p>
            </div>

            <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0;">
                    © ${currentYear} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                    Si tienes dudas o deseas enviar tu soporte de pago, contáctanos a <a href="mailto:comercial@avaliab2b.com" style="color: #2563EB; text-decoration: none;">comercial@avaliab2b.com</a> o vía WhatsApp al <a href="https://wa.me/573015965775" style="color: #2563EB; text-decoration: none;">+57 3015965775</a>.
                </p>
                <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                    Notificación automática de estado de cuenta.
                </p>
            </div>
        </div>
    `;
}

export function Mora10Html({
    contactName,
    razonSocial,
    invoiceNumber,
    amount,
    dueDate,
    clientName,
}: {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}) {
    const currentYear = new Date().getFullYear();
    return `
        <div style="font-family: 'Geist Sans', Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);">
            <div style="background-color: #0F172A; color: #ffffff; padding: 24px 24px; text-align: center; border-bottom: 4px solid #DC2626;">
                <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">
                    Aval<span style="color: #DC2626;">IA</span>
                </h1>
                <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8; font-weight: 500;">
                    Notificación Urgente de Mora
                </p>
            </div>

            <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 16px 0;">
                    Estimado/a <strong>${contactName}</strong> (de ${razonSocial}),
                </p>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Te informamos que la factura N° <strong>${invoiceNumber}</strong> con tu proveedor <strong>${clientName}</strong> por valor de <strong>${amount} COP</strong> registra actualmente una mora prolongada.
                </p>

                <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #991B1B; margin-top: 16px; margin-bottom: 16px; font-weight: 600;">
                    Esta obligación registra actualmente 10 días de mora.
                </div>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Esta situación comienza a generar un impacto negativo directo en tu <strong>calificación crediticia interna</strong> dentro de nuestra plataforma, lo cual podría limitar futuras solicitudes de incremento o renovación de cupo de crédito comercial con este y otros proveedores asociados a nuestra red.
                </p>

                <div style="background-color: #F8FAFC; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tbody>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 40%;">Proveedor / Facturador</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${clientName}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Factura N°</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${invoiceNumber}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Monto Pendiente</td>
                                <td style="color: #B91C1C; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${amount} COP</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Fecha Vencimiento</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${dueDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p style="font-size: 14px; margin: 20px 0 12px 0; color: #0F172A; font-weight: bold;">
                    Regularización de Cuenta:
                </p>
                <p style="font-size: 14px; margin: 0 0 24px 0; color: #475569; line-height: 1.5;">
                    Te solicitamos proceder con el pago inmediato <strong>en los canales que el cliente ${clientName} dispuso para tal fin</strong> y remitir el soporte para restaurar tu calificación crediticia en el sistema.
                </p>

                <p style="font-size: 13px; color: #64748B; margin: 0; border-top: 1px dashed #e2e8f0; padding-top: 16px;">
                    Si tienes algún inconveniente o necesitas reportar un acuerdo de pago, por favor ponte en contacto con tu proveedor a la brevedad.
                </p>
            </div>

            <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0;">
                    © ${currentYear} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                    Si tienes dudas o deseas enviar tu soporte de pago, contáctanos a <a href="mailto:comercial@avaliab2b.com" style="color: #2563EB; text-decoration: none;">comercial@avaliab2b.com</a> o vía WhatsApp al <a href="https://wa.me/573015965775" style="color: #2563EB; text-decoration: none;">+57 3015965775</a>.
                </p>
                <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                    Aviso formal de cartera.
                </p>
            </div>
        </div>
    `;
}

export function Mora15Html({
    contactName,
    razonSocial,
    invoiceNumber,
    amount,
    dueDate,
    clientName,
}: {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}) {
    const currentYear = new Date().getFullYear();
    return `
        <div style="font-family: 'Geist Sans', Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);">
            <div style="background-color: #0F172A; color: #ffffff; padding: 24px 24px; text-align: center; border-bottom: 4px solid #B91C1C;">
                <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">
                    Aval<span style="color: #B91C1C;">IA</span>
                </h1>
                <p style="margin: 4px 0 0; font-size: 12px; color: #94A3B8; font-weight: 500;">
                    Notificación de Suspensión de Cupo
                </p>
            </div>

            <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 16px 0;">
                    Estimado/a <strong>${contactName}</strong> (de ${razonSocial}),
                </p>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Te informamos que debido al no pago de la factura N° <strong>${invoiceNumber}</strong> con tu proveedor <strong>${clientName}</strong> por valor de <strong>${amount} COP</strong>, la cual cuenta con <strong>15 días de mora</strong>, <strong>hemos procedido a suspender temporalmente tu cupo de crédito comercial</strong>.
                </p>

                <div style="background-color: #FEE2E2; border-left: 4px solid #B91C1C; padding: 16px 20px; border-radius: 4px; font-size: 14px; color: #991B1B; margin-top: 16px; margin-bottom: 16px; font-weight: bold;">
                    ESTADO DE CUPO: SUSPENDIDO TEMPORALMENTE
                </div>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Esta suspensión temporal impide realizar nuevas compras a crédito con el respaldo de Avalia ante este y cualquier otro proveedor de nuestra red, hasta que la obligación pendiente sea cancelada en su totalidad.
                </p>

                <div style="background-color: #F8FAFC; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tbody>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 40%;">Proveedor / Facturador</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${clientName}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Factura N°</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${invoiceNumber}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Monto Pendiente</td>
                                <td style="color: #B91C1C; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${amount} COP</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Fecha Vencimiento</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${dueDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; padding: 16px 20px; border-radius: 8px; font-size: 14px; color: #92400E; margin-top: 20px; margin-bottom: 20px; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">
                        Advertencia Importante
                    </p>
                    <p style="margin: 0;">
                        De continuar la mora y superar los <strong>30 días</strong>, de acuerdo con la legislación vigente, nos veremos obligados a <strong>reportar esta obligación en mora ante las centrales de información financiera (Datacrédito y TransUnion)</strong> e iniciar el <strong>proceso de cobro coactivo judicial</strong> correspondiente.
                    </p>
                </div>

                <p style="font-size: 14px; margin: 20px 0 12px 0; color: #0F172A; font-weight: bold;">
                    Acción Requerida:
                </p>
                <p style="font-size: 14px; margin: 0 0 24px 0; color: #475569; line-height: 1.5;">
                    Te instamos a regularizar tu situación de forma inmediata realizando el pago <strong>en los canales que el cliente ${clientName} dispuso para tal fin</strong> y enviando el comprobante de manera urgente. Una vez verificado el pago por el proveedor, tu cupo será reactivado de inmediato.
                </p>
            </div>

            <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0;">
                    © ${currentYear} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                    Si tienes dudas o deseas enviar tu soporte de pago, contáctanos a <a href="mailto:comercial@avaliab2b.com" style="color: #2563EB; text-decoration: none;">comercial@avaliab2b.com</a> o vía WhatsApp al <a href="https://wa.me/573015965775" style="color: #2563EB; text-decoration: none;">+57 3015965775</a>.
                </p>
                <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                    Aviso legal y de cobro pre-jurídico.
                </p>
            </div>
        </div>
    `;
}

export function Mora30Html({
    contactName,
    razonSocial,
    invoiceNumber,
    amount,
    dueDate,
    clientName,
}: {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}) {
    const currentYear = new Date().getFullYear();
    return `
        <div style="font-family: 'Geist Sans', Inter, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 2px solid #7F1D1D; border-radius: 12px; background-color: #ffffff; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);">
            <div style="background-color: #7F1D1D; color: #ffffff; padding: 28px 24px; text-align: center;">
                <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0;">
                    Aval<span style="color: #FCA5A5;">IA</span>
                </h1>
                <p style="margin: 4px 0 0; font-size: 12px; color: #FCA5A5; font-weight: bold; text-transform: uppercase;">
                    Bloqueo de Cupo y Reporte a Centrales
                </p>
            </div>

            <div style="padding: 32px 24px; color: #1E293B; line-height: 1.6;">
                <p style="font-size: 15px; margin: 0 0 16px 0;">
                    Estimado/a <strong>${contactName}</strong> (de ${razonSocial}),
                </p>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Lamentamos informarte que la factura N° <strong>${invoiceNumber}</strong> con tu proveedor <strong>${clientName}</strong> por valor de <strong>${amount} COP</strong> presenta hoy <strong>30 días de mora</strong>.
                </p>

                <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                    Al no haber recibido el pago ni un acuerdo de pago formal a la fecha, hemos procedido a ejecutar las siguientes acciones comerciales y legales:
                </p>

                <div style="background-color: #FEE2E2; border-left: 4px solid #7F1D1D; padding: 16px 20px; border-radius: 4px; font-size: 13px; color: #7F1D1D; margin-top: 16px; margin-bottom: 16px; font-weight: bold; text-align: center;">
                    CUPO DE CRÉDITO BLOQUEADO DEFINITIVAMENTE / TRASLADO A COBRO JURÍDICO
                </div>

                <ol style="margin: 20px 0; padding-left: 20px; font-size: 14px; color: #334155;">
                    <li style="margin-bottom: 12px;">
                        <strong>Bloqueo Definitivo del Cupo:</strong> Tu cupo de crédito comercial con Avalia ha sido cancelado y bloqueado de forma permanente. No podrás acceder a crédito comercial en nuestra plataforma.
                    </li>
                    <li style="margin-bottom: 12px;">
                        <strong>Reporte Negativo en Centrales de Riesgo:</strong> Se procederá de manera inmediata con el reporte negativo de esta obligación en las centrales de información financiera (Datacrédito y TransUnion), lo cual afectará tu historial y calificación de crédito a nivel nacional.
                    </li>
                    <li style="margin-bottom: 12px;">
                        <strong>Traslado a Cobro Jurídico:</strong> El expediente ha sido transferido a nuestra firma de abogados externa para iniciar el cobro judicial de la obligación. Esto generará cargos adicionales por concepto de intereses de mora, honorarios de cobranza (hasta un 20%) y costos procesales.
                    </li>
                </ol>

                <div style="background-color: #F8FAFC; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tbody>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 40%;">Proveedor / Facturador</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${clientName}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Factura N°</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${invoiceNumber}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Monto Pendiente</td>
                                <td style="color: #B91C1C; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${amount} COP</td>
                            </tr>
                            <tr>
                                <td style="font-weight: bold; color: #64748B; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Fecha Vencimiento</td>
                                <td style="color: #0F172A; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${dueDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p style="font-size: 14px; margin: 20px 0 12px 0; color: #0F172A; font-weight: bold;">
                    Pago Inmediato:
                </p>
                <p style="font-size: 14px; margin: 0 0 24px 0; color: #475569; line-height: 1.5;">
                    Aún puedes evitar el cobro por la vía judicial y mitigar la permanencia del reporte negativo realizando el pago inmediato <strong>en los canales que el cliente ${clientName} dispuso para tal fin</strong> y enviando el comprobante de pago con carácter de urgencia.
                </p>
            </div>

            <div style="background-color: #F8FAFC; padding: 24px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0;">
                    © ${currentYear} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                    Si tienes dudas o deseas enviar tu soporte de pago, contáctanos a <a href="mailto:comercial@avaliab2b.com" style="color: #2563EB; text-decoration: none;">comercial@avaliab2b.com</a> o vía WhatsApp al <a href="https://wa.me/573015965775" style="color: #2563EB; text-decoration: none;">+57 3015965775</a>.
                </p>
                <p style="margin: 0; font-size: 11px; color: #7F1D1D; font-weight: bold;">
                    AVISO LEGAL FORMAL DE COBRO COACTIVO.
                </p>
            </div>
        </div>
    `;
}
