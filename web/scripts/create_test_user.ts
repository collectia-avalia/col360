
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

async function createTestUser() {
  console.log('👤 Creando Usuario de Prueba...')

  const email = 'cliente@demo.com'
  const password = 'demo1234'

  // 1. Crear Usuario
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
        company_name: 'Demo Cliente SAS'
    }
  })

  let userId = user?.user?.id

  if (createError) {
      if (createError.message.includes('already has been registered')) {
          console.log('⚠️ El usuario ya existe, obteniendo ID...')
          const { data: users } = await supabase.auth.admin.listUsers()
          const existingUser = users?.users.find(u => u.email === email)
          if (existingUser) {
              userId = existingUser.id
              // Actualizar password por si acaso
              await supabase.auth.admin.updateUserById(userId, { password })
          }
      } else {
          console.error('❌ Error creando usuario:', createError)
          process.exit(1)
      }
  }

  console.log(`✅ Usuario listo: ${email} (ID: ${userId})`)

  // 2. Asociar "Tech Solutions SAS" al nuevo usuario
  const targetPayerName = 'Tech Solutions SAS'
  
  // Buscar el payer
  const { data: payer, error: findError } = await supabase
    .from('payers')
    .select('id, razon_social')
    .eq('razon_social', targetPayerName)
    .single()

  if (findError || !payer) {
      console.error(`❌ No se encontró la empresa '${targetPayerName}'. Asegúrate de haber ejecutado el seed.`)
      // Fallback: Buscar cualquiera
      const { data: anyPayer } = await supabase.from('payers').select('id, razon_social').limit(1).single()
      if (anyPayer) {
          console.log(`🔄 Usando fallback: '${anyPayer.razon_social}'`)
          await assignPayer(anyPayer.id, userId!)
      } else {
          process.exit(1)
      }
  } else {
      await assignPayer(payer.id, userId!)
  }

  console.log('\n🎉 ¡Listo! Credenciales de acceso:')
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Pass:  ${password}`)
  console.log(`🏢 Empresa Vinculada: ${payer?.razon_social || 'Fallback Payer'}`)
}

async function assignPayer(payerId: string, newOwnerId: string) {
    // 1. Actualizar Payer
    const { error: updatePayerError } = await supabase
        .from('payers')
        .update({ created_by: newOwnerId })
        .eq('id', payerId)

    if (updatePayerError) {
        console.error('Error actualizando Payer:', updatePayerError)
        return
    }
    console.log('✅ Payer transferido al nuevo usuario.')

    // 2. Actualizar Facturas del Payer
    const { error: updateInvoicesError } = await supabase
        .from('invoices')
        .update({ client_id: newOwnerId })
        .eq('payer_id', payerId)

    if (updateInvoicesError) {
        console.error('Error actualizando Facturas:', updateInvoicesError)
        return
    }
    console.log('✅ Facturas transferidas al nuevo usuario.')
}

createTestUser()
