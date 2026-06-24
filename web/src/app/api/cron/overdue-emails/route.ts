import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/actions/email';

// Importar plantillas de cobro en formato HTML String
import { 
    Mora1Html, 
    Mora5Html, 
    Mora10Html, 
    Mora15Html, 
    Mora30Html 
} from '@/components/emails/htmlTemplates';

// Evitar almacenamiento en caché de Next.js
export const dynamic = 'force-dynamic';

function getDaysDifference(date1Str: string, date2Str: string): number {
    const [y1, m1, d1] = date1Str.split('-').map(Number);
    const [y2, m2, d2] = date2Str.split('-').map(Number);
    const d1Utc = Date.UTC(y1, m1 - 1, d1);
    const d2Utc = Date.UTC(y2, m2 - 1, d2);
    return Math.round((d1Utc - d2Utc) / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatLongDate(dateStr: string): string {
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(Date.UTC(y, m - 1, d));
        return date.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        });
    } catch {
        return dateStr;
    }
}

export async function GET(request: NextRequest) {
    console.log('[CRON] Iniciando proceso diario de facturas en mora');

    // 1. Verificación de seguridad
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev) {
        if (!cronSecret) {
            console.error('[CRON] ERROR CRÍTICO: CRON_SECRET no configurado en producción.');
            return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
        }
        if (authHeader !== `Bearer ${cronSecret}`) {
            console.warn('[CRON] Intento de acceso no autorizado bloqueado');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    // 2. Inicializar cliente administrador de Supabase para omitir RLS
    const supabase = createAdminClient();

    try {
        // Consultar facturas no pagadas
        const { data: rawInvoices, error: fetchError } = await supabase
            .from('invoices')
            .select(`
                *,
                payers:payer_id (
                    razon_social,
                    contact_name,
                    contact_email,
                    contact_phone
                ),
                profiles:client_id (
                    company_name,
                    email
                )
            `)
            .neq('status', 'pagada');

        if (fetchError) {
            console.error('[CRON] Error al consultar facturas de la base de datos:', fetchError);
            return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
        }

        const invoices = rawInvoices || [];
        console.log(`[CRON] Total de facturas no pagadas recuperadas: ${invoices.length}`);

        // Obtener fecha actual en Bogotá (America/Bogota) YYYY-MM-DD
        const formatter = new Intl.DateTimeFormat('fr-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const todayBogotaStr = formatter.format(new Date());
        console.log(`[CRON] Fecha de ejecución (Bogotá): ${todayBogotaStr}`);

        let processedCount = 0;
        let sentCount = 0;
        let failedCount = 0;
        const failures: { invoiceNumber: string; error: string }[] = [];
        const processedDetails: { invoiceNumber: string; diasMora: number; template: string; recipient: string }[] = [];

        // 3. Iterar facturas
        for (const invoice of invoices) {
            // Ignorar facturas anuladas
            const isAnulada = invoice.legal_declarations && (invoice.legal_declarations as any).anulada === true;
            if (isAnulada) {
                continue;
            }

            processedCount++;
            const invoiceNum = invoice.invoice_number;

            try {
                // Calcular días de mora en base a la fecha de vencimiento y hoy en Bogotá
                const dueStr = invoice.due_date;
                const diasMora = getDaysDifference(todayBogotaStr, dueStr);

                // Solo procesar si está en los días exactos: 1, 5, 10, 15, 30
                if (![1, 5, 10, 15, 30].includes(diasMora)) {
                    continue;
                }

                const payer = invoice.payers as any;
                const client = invoice.profiles as any;

                if (!payer) {
                    throw new Error('La factura no tiene un pagador asociado en la base de datos.');
                }

                const contactEmail = payer.contact_email;
                if (!contactEmail) {
                    throw new Error(`El pagador ${payer.razon_social} no tiene correo de contacto.`);
                }

                const clientName = client?.company_name || 'Avalia';
                const contactName = payer.contact_name || 'Encargado de Cartera';
                const razonSocial = payer.razon_social;
                const formattedAmount = formatCurrency(Number(invoice.amount));
                const formattedDueDate = formatLongDate(invoice.due_date);

                let htmlContent = '';
                let subject = '';
                let templateName = '';

                // Seleccionar plantilla correspondiente
                switch (diasMora) {
                    case 1:
                        subject = `Recordatorio de pago: Factura N° ${invoiceNum} - ${clientName}`;
                        templateName = 'Mora Día 1';
                        htmlContent = Mora1Html({
                            contactName,
                            razonSocial,
                            invoiceNumber: invoiceNum,
                            amount: formattedAmount,
                            dueDate: formattedDueDate,
                            clientName
                        });
                        break;
                    case 5:
                        subject = `Segunda notificación: Pago pendiente Factura N° ${invoiceNum} - ${clientName}`;
                        templateName = 'Mora Día 5';
                        htmlContent = Mora5Html({
                            contactName,
                            razonSocial,
                            invoiceNumber: invoiceNum,
                            amount: formattedAmount,
                            dueDate: formattedDueDate,
                            clientName
                        });
                        break;
                    case 10:
                        subject = `Notificación urgente de mora: Factura N° ${invoiceNum} - ${clientName}`;
                        templateName = 'Mora Día 10';
                        htmlContent = Mora10Html({
                            contactName,
                            razonSocial,
                            invoiceNumber: invoiceNum,
                            amount: formattedAmount,
                            dueDate: formattedDueDate,
                            clientName
                        });
                        break;
                    case 15:
                        subject = `Suspensión de cupo: Notificación de mora Factura N° ${invoiceNum} - ${clientName}`;
                        templateName = 'Mora Día 15';
                        htmlContent = Mora15Html({
                            contactName,
                            razonSocial,
                            invoiceNumber: invoiceNum,
                            amount: formattedAmount,
                            dueDate: formattedDueDate,
                            clientName
                        });
                        break;
                    case 30:
                        subject = `Bloqueo definitivo y reporte central de riesgo: Factura N° ${invoiceNum} - ${clientName}`;
                        templateName = 'Mora Día 30';
                        htmlContent = Mora30Html({
                            contactName,
                            razonSocial,
                            invoiceNumber: invoiceNum,
                            amount: formattedAmount,
                            dueDate: formattedDueDate,
                            clientName
                        });
                        break;
                }

                if (htmlContent && subject) {
                    console.log(`[CRON] Enviando correo de ${templateName} a ${contactEmail} para factura ${invoiceNum}`);
                    
                    const result = await sendEmail({
                        to: contactEmail,
                        subject: subject,
                        html: htmlContent
                    });

                    if (!result.success) {
                        throw new Error(result.error || 'Fallo desconocido al enviar por Resend.');
                    }

                    sentCount++;
                    processedDetails.push({
                        invoiceNumber: invoiceNum,
                        diasMora,
                        template: templateName,
                        recipient: contactEmail
                    });
                }
            } catch (err: any) {
                failedCount++;
                const errMsg = err.message || err;
                console.error(`[CRON] Error procesando factura ${invoiceNum}: ${errMsg}`);
                failures.push({
                    invoiceNumber: invoiceNum,
                    error: errMsg
                });
            }
        }

        console.log(`[CRON] Fin del proceso. Enviados: ${sentCount}, Fallados: ${failedCount}, Procesados: ${processedCount}`);

        return NextResponse.json({
            success: true,
            todayBogota: todayBogotaStr,
            totalUnpaid: invoices.length,
            processedCount,
            sentCount,
            failedCount,
            processedDetails,
            failures
        });

    } catch (globalErr: any) {
        console.error('[CRON] Excepción global en ruta de cron:', globalErr);
        return NextResponse.json({
            success: false,
            error: globalErr.message || 'Error interno del servidor.'
        }, { status: 500 });
    }
}
