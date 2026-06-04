import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET

// Valida assinatura HMAC-SHA256 do Mercado Pago
function validateSignature(req: NextRequest, rawBody: string): boolean {
  if (!MP_WEBHOOK_SECRET) return true // sem secret configurado, aceita (dev)

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const dataId = new URL(req.url).searchParams.get('data.id') ?? ''

  const signedTemplate = `id:${dataId};request-id:${xRequestId};ts:${xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1] ?? ''};`
  const ts = xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1] ?? ''
  const v1 = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1] ?? ''

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex')

  return hmac === v1
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Validação de assinatura
  if (!validateSignature(req, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: { type?: string; action?: string; data?: { id?: string } }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Só processa pagamentos aprovados
  if (payload.type !== 'payment' && payload.action !== 'payment.updated') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const paymentId = payload.data?.id
  if (!paymentId || !MP_ACCESS_TOKEN) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Busca detalhes do pagamento na API do Mercado Pago
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
  })

  if (!mpRes.ok) {
    console.error('MP payment fetch failed:', await mpRes.text())
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }

  const payment = await mpRes.json() as {
    status: string
    external_reference: string
    metadata?: { league_id?: string; mode?: string; purchase_id?: string }
  }

  if (payment.status !== 'approved') {
    // Atualiza status para failed se necessário
    if (['cancelled', 'refunded', 'charged_back', 'rejected'].includes(payment.status)) {
      const supabase = await createClient()
      await supabase
        .from('mode_purchases')
        .update({ status: 'failed', provider_payment_id: paymentId })
        .eq('id', payment.external_reference)
    }
    return NextResponse.json({ ok: true, status: payment.status })
  }

  // Pagamento aprovado — ativa o modo no bolão
  const purchaseId = payment.external_reference
  const leagueId = payment.metadata?.league_id
  const mode = payment.metadata?.mode

  if (!leagueId || !mode) {
    console.error('Missing metadata in payment', payment)
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
  }

  const supabase = await createClient()

  // Monta o patch de enabled_modes
  let modesPatch: Record<string, boolean>
  if (mode === 'bundle') {
    modesPatch = { campeao: true, artilheiro: true, classificados: true }
  } else {
    modesPatch = { [mode]: true }
  }

  // Usa jsonb_set para merge (não sobrescreve modos já ativos)
  // Alternativa simples: select + merge no JS
  const { data: league } = await supabase
    .from('leagues')
    .select('enabled_modes')
    .eq('id', leagueId)
    .single()

  const currentModes = (league?.enabled_modes ?? {}) as Record<string, boolean>
  const newModes = { ...currentModes, ...modesPatch }

  await Promise.all([
    supabase.from('leagues').update({ enabled_modes: newModes }).eq('id', leagueId),
    supabase.from('mode_purchases').update({
      status: 'approved',
      provider_payment_id: paymentId,
    }).eq('id', purchaseId),
  ])

  console.log(`✅ Modo(s) ${mode} ativado(s) para league ${leagueId}`)
  return NextResponse.json({ ok: true, activated: modesPatch })
}
