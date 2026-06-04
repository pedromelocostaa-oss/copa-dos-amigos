import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MODE_PRICES } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://copa-dos-amigos.vercel.app'
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN

// Descrições dos modos para o checkout
const MODE_DESCRIPTIONS = {
  campeao:       'Modo Bônus: Campeão da Copa — bolão Copa dos Amigos',
  artilheiro:    'Modo Bônus: Artilheiro — bolão Copa dos Amigos',
  classificados: 'Modo Bônus: Seleções Classificadas — bolão Copa dos Amigos',
  bundle:        'Todos os Modos Bônus — bolão Copa dos Amigos',
}

export async function POST(req: NextRequest) {
  if (!MP_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: 'Pagamento não configurado. Fale com o administrador.' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json() as { leagueId: string; mode: string }
  const { leagueId, mode } = body

  if (!leagueId || !mode) {
    return NextResponse.json({ error: 'leagueId e mode são obrigatórios' }, { status: 400 })
  }

  // Verifica se o usuário é o owner do bolão
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, owner_id')
    .eq('id', leagueId)
    .single()

  if (!league || league.owner_id !== user.id) {
    return NextResponse.json({ error: 'Apenas o organizador pode comprar modos' }, { status: 403 })
  }

  const amount = mode === 'bundle'
    ? MODE_PRICES.bundle
    : (MODE_PRICES as Record<string, number>)[mode]

  if (!amount) {
    return NextResponse.json({ error: `Modo inválido: ${mode}` }, { status: 400 })
  }

  // Cria registro de compra pendente
  const { data: purchase } = await supabase
    .from('mode_purchases')
    .insert({
      league_id: leagueId,
      mode,
      amount,
      provider: 'mercadopago',
      status: 'pending',
    })
    .select()
    .single()

  if (!purchase) {
    return NextResponse.json({ error: 'Erro ao registrar compra' }, { status: 500 })
  }

  // Cria preference no Mercado Pago
  const mpBody = {
    items: [{
      id: purchase.id,
      title: MODE_DESCRIPTIONS[mode as keyof typeof MODE_DESCRIPTIONS] ?? `Modo ${mode}`,
      quantity: 1,
      unit_price: amount / 100,
      currency_id: 'BRL',
    }],
    back_urls: {
      success: `${APP_URL}/bolao?payment=success&leagueId=${leagueId}`,
      failure: `${APP_URL}/bolao?payment=failure&leagueId=${leagueId}`,
      pending: `${APP_URL}/bolao?payment=pending&leagueId=${leagueId}`,
    },
    auto_return: 'approved',
    external_reference: purchase.id,
    notification_url: `${APP_URL}/api/webhooks/mercadopago`,
    metadata: {
      league_id: leagueId,
      mode,
      purchase_id: purchase.id,
    },
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mpBody),
  })

  if (!mpRes.ok) {
    const err = await mpRes.text()
    console.error('MP error:', err)
    return NextResponse.json({ error: 'Erro ao criar preferência de pagamento' }, { status: 500 })
  }

  const mpData = await mpRes.json() as { id: string; init_point: string; sandbox_init_point: string }

  // Salva o ID da preference no registro de compra
  await supabase
    .from('mode_purchases')
    .update({ provider_payment_id: mpData.id })
    .eq('id', purchase.id)

  return NextResponse.json({
    checkout_url: mpData.init_point,
    purchase_id: purchase.id,
  })
}
