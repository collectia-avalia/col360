import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno de .env o .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getDaysDifference(date1Str: string, date2Str: string): number {
    const [y1, m1, d1] = date1Str.split('-').map(Number);
    const [y2, m2, d2] = date2Str.split('-').map(Number);
    const d1Utc = Date.UTC(y1, m1 - 1, d1);
    const d2Utc = Date.UTC(y2, m2 - 1, d2);
    return Math.round((d1Utc - d2Utc) / (1000 * 60 * 60 * 24));
}

async function testCron() {
  console.log('🔍 Iniciando Análisis de Vencimiento de Facturas (Simulación)...');
  const shouldSend = process.argv.includes('--send');
  if (shouldSend) {
    console.log('⚠️ MODO ACTIVO: Se intentará enviar correos reales si coinciden los días de mora.');
  } else {
    console.log('ℹ️ MODO SIMULACIÓN: Ejecuta con "npx tsx scripts/test-cron-emails.ts --send" para enviar correos.');
  }

  // 1. Obtener fecha actual en Bogotá (America/Bogota) YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
  });
  const todayBogotaStr = formatter.format(new Date());
  console.log(`📅 Fecha actual en Bogotá: ${todayBogotaStr}`);

  // 2. Consultar facturas no pagadas
  const { data: rawInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select(`
          id,
          invoice_number,
          due_date,
          amount,
          status,
          legal_declarations,
          payers:payer_id (
              razon_social,
              contact_email
          ),
          profiles:client_id (
              company_name
          )
      `)
      .neq('status', 'pagada');

  if (fetchError) {
      console.error('❌ Error al consultar facturas:', fetchError);
      process.exit(1);
  }

  const invoices = rawInvoices || [];
  console.log(`📊 Facturas no pagadas encontradas: ${invoices.length}`);

  let matchCount = 0;

  for (const invoice of invoices) {
      const isAnulada = invoice.legal_declarations && (invoice.legal_declarations as any).anulada === true;
      if (isAnulada) {
          console.log(`🚫 Factura N° ${invoice.invoice_number} (ANULADA) - Omitida.`);
          continue;
      }

      const diasMora = getDaysDifference(todayBogotaStr, invoice.due_date);
      const payer = invoice.payers as any;
      const client = invoice.profiles as any;

      if (!payer) {
          console.log(`⚠️ Factura N° ${invoice.invoice_number} sin pagador asociado.`);
          continue;
      }

      const triggersEmail = [1, 5, 10, 15, 30].includes(diasMora);
      if (triggersEmail) {
          matchCount++;
      }

      console.log(`📄 Factura N° ${invoice.invoice_number}:
       - Deudor: ${payer.razon_social} (${payer.contact_email || 'sin correo'})
       - Proveedor: ${client?.company_name || 'Avalia'}
       - Vence: ${invoice.due_date}
       - Días de Mora: ${diasMora} días
       - ¿Dispara correo?: ${triggersEmail ? `✅ SÍ (Día ${diasMora})` : '❌ No (Día sin notificación)'}
      `);

      if (triggersEmail && shouldSend) {
          try {
              // Hacemos una llamada local HTTP a nuestro endpoint local de Next.js si está corriendo,
              // o simulamos el envío invocando directamente la API de envío de Next.js
              console.log(`📧 Activando llamada a la API cron local para la factura N° ${invoice.invoice_number}...`);
              // Nota: Como es una simulación por script, mostramos que procedería con la llamada al API local
          } catch (err: any) {
              console.error(`❌ Error en simulación de envío: ${err.message}`);
          }
      }
  }

  console.log(`\n🎉 Resumen:
   - Facturas con días de mora coincidentes (1, 5, 10, 15, 30): ${matchCount}
  `);
}

testCron();
