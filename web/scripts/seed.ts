
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function seed() {
  console.log('🌱 Iniciando Seeding...')

  // 1. Obtener un usuario válido para created_by
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
  
  if (userError || !users || users.length === 0) {
    console.error('❌ Error: No se encontraron usuarios en Auth. Crea un usuario primero en la plataforma.')
    process.exit(1)
  }

  const userId = users[0].id
  console.log(`👤 Usando usuario ID: ${userId} (${users[0].email})`)

  // 2. Datos de Payers
  const payerNames = [
    "Tech Solutions SAS", "Inversiones del Norte", "Comercializadora Global", 
    "Distribuidora Los Andes", "Servicios Integrales LTDA", "Consultoría y Estrategia SAS", 
    "Agroindustrias del Valle", "Logística Rápida SA", "Importadora El Puerto", "Manufacturas Central"
  ]

  const payersData = payerNames.map((name, i) => {
    const status = Math.random() > 0.6 ? 'aprobado' : (Math.random() > 0.3 ? 'pendiente' : 'rechazado')
    const quota = status === 'aprobado' ? Math.floor(Math.random() * 500000000) + 10000000 : 0
    
    return {
      razon_social: name,
      nit: `900${Math.floor(Math.random() * 100000)}-${i}`,
      contact_email: `contacto@${name.toLowerCase().replace(/\s+/g, '')}.com`,
      contact_name: `Gerente ${i + 1}`,
      risk_status: status,
      approved_quota: quota,
      created_by: userId,
      terms_accepted: true,
      invitation_status: 'accepted'
    }
  })

  // 3. Insertar Payers
  const { data: createdPayers, error: payerError } = await supabase
    .from('payers')
    .insert(payersData)
    .select()

  if (payerError) {
    console.error('❌ Error insertando Payers:', payerError)
    process.exit(1)
  }

  console.log(`✅ ${createdPayers.length} Clientes creados.`)

  // 4. Generar Facturas
  const invoicesData = []
  const totalInvoices = 20
  const today = new Date()

  for (let i = 0; i < totalInvoices; i++) {
    const payer = createdPayers[Math.floor(Math.random() * createdPayers.length)]
    
    // Distribución de Fechas
    const rand = Math.random()
    let dueDate = new Date()
    let status = 'vigente'

    if (rand < 0.4) {
      // Vencida (hace 1 a 30 días)
      dueDate.setDate(today.getDate() - Math.floor(Math.random() * 30) - 1)
      status = 'vigente' // En BD es vigente, el frontend calcula "Vencida"
    } else if (rand < 0.8) {
      // Vigente (en 1 a 30 días)
      dueDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1)
    } else {
      // Hoy
      // dueDate es hoy
    }

    const issueDate = new Date(dueDate)
    issueDate.setDate(dueDate.getDate() - 30) // Emitida 30 días antes del vencimiento

    const amount = Math.floor(Math.random() * 50000000) + 1000000
    const isGuaranteed = Math.random() > 0.5

    invoicesData.push({
      invoice_number: `FE-${Math.floor(Math.random() * 10000)}`,
      amount: amount,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      payer_id: payer.id,
      file_url: 'https://vandelay-industry.com/invoice_mock_01.pdf',
      status: 'vigente', // Siempre vigente inicial
      is_guaranteed: isGuaranteed,
      guaranteed_amount: isGuaranteed ? amount * 0.9 : 0, // 90% cobertura
      client_id: userId
    })
  }

  // 5. Insertar Facturas
  const { error: invoiceError } = await supabase
    .from('invoices')
    .insert(invoicesData)

  if (invoiceError) {
    console.error('❌ Error insertando Facturas:', invoiceError)
    process.exit(1)
  }

  console.log(`✅ ${invoicesData.length} Facturas creadas.`)
  console.log('✨ Seeding completado exitosamente.')
}

seed()
