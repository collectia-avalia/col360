import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js')

export interface ParsedInvoiceData {
  invoiceNumber?: string
  issueDate?: string
  dueDate?: string
  amount?: string
  supplierNit?: string
  supplierName?: string
  customerNit?: string
  customerName?: string
  cufe?: string
}

function parseDate(ddmmyyyy: string): string | undefined {
  const parts = ddmmyyyy.split('/')
  if (parts.length !== 3) return undefined
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function cleanAmount(raw: string): string {
  // Formato colombiano: 20,300,542.50 o 20.300.542,50
  // Detectar si la coma es separador decimal (un solo bloque después de la coma)
  const cleaned = raw.replace(/\s/g, '')
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(cleaned)) {
    // Punto = miles, coma = decimal
    return cleaned.replace(/\./g, '').replace(',', '.')
  }
  // Coma = miles, punto = decimal
  return cleaned.replace(/,/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Se requiere un archivo' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const data = await pdfParse(buffer)
    const text: string = data.text

    const result: ParsedInvoiceData = {}

    // ── Número de Factura ───────────────────────────────────────────
    // Patrones: "No. BPO 205", "No. FV-123", "No. FE 2025-001"
    const numMatch = text.match(/No\.\s+([A-Z]+\s*[-]?\s*[\d]+(?:[-]\d+)?)/i)
    if (numMatch) result.invoiceNumber = numMatch[1].trim().replace(/\s+/g, ' ')

    // ── Fecha de Vencimiento ────────────────────────────────────────
    const dueMatch = text.match(/Vencimiento\s+(\d{1,2}\/\d{1,2}\/\d{4})/)
    if (dueMatch) result.dueDate = parseDate(dueMatch[1])

    // ── Fecha de Emisión ────────────────────────────────────────────
    const issueMatch = text.match(/(?:Expedici[oó]n|Generaci[oó]n|Fecha\s+de\s+emisi[oó]n)\s+(\d{1,2}\/\d{1,2}\/\d{4})/)
    if (issueMatch) result.issueDate = parseDate(issueMatch[1])

    // ── Valor Total ─────────────────────────────────────────────────
    const amountMatch = text.match(/Total a Pagar\s+([\d,\.]+)/)
    if (amountMatch) result.amount = cleanAmount(amountMatch[1])

    // ── NITs (primer = emisor, segundo = receptor/deudor) ───────────
    const nitMatches = [...text.matchAll(/NIT\s+([\d\.]+(?:-\d)?)/g)]
    if (nitMatches.length >= 1) result.supplierNit = nitMatches[0][1]
    if (nitMatches.length >= 2) result.customerNit  = nitMatches[1][1]

    // ── Nombre del Emisor (primera línea significativa del doc) ─────
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length > 0) result.supplierName = lines[0]

    // ── Nombre del Receptor: línea después de "Señores" ─────────────
    const senoресIdx = lines.findIndex(l => /se[ñn]ores/i.test(l))
    if (senoресIdx !== -1 && lines[senoресIdx + 1]) {
      result.customerName = lines[senoресIdx + 1].trim()
    }

    // ── CUFE ────────────────────────────────────────────────────────
    const cufeMatch = text.match(/CUFE:\s*([a-f0-9]{60,})/i)
    if (cufeMatch) result.cufe = cufeMatch[1]

    return NextResponse.json(result)
  } catch (err) {
    console.error('[parse-invoice] Error:', err)
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 })
  }
}
