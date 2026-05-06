// api/webhook-pagamento.js
// Recebe notificações do Mercado Pago quando um pagamento é aprovado/recusado
// Configure esta URL no painel do MP: https://www.mercadopago.com.br/developers/panel/webhooks

import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
})

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).end()
  }

  // MP envia GET com query params ou POST com body
  const { type, data } = req.method === 'POST' ? req.body : req.query

  // Responde 200 imediatamente para o MP não retentar
  res.status(200).json({ received: true })

  if (type !== 'payment' || !data?.id) return

  try {
    const payment = new Payment(client)
    const pagamento = await payment.get({ id: data.id })

    const {
      status,
      status_detail,
      external_reference,
      payer,
      transaction_amount,
    } = pagamento

    console.log('[webhook] pagamento recebido:', {
      id: data.id,
      status,
      status_detail,
      external_reference,
      email: payer?.email,
      valor: transaction_amount,
    })

    if (status === 'approved') {
      // ─── AÇÃO PÓS-PAGAMENTO ───────────────────────────────────────────────
      // Aqui você conecta ao seu banco de dados para liberar o acesso.
      //
      // Exemplos de implementação:
      //
      // 1. Supabase (recomendado para este projeto):
      //    const { createClient } = await import('@supabase/supabase-js')
      //    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
      //    await supabase.from('assinantes').upsert({
      //      email: payer.email,
      //      plano: external_reference.split('_')[0],
      //      ativo: true,
      //      pagamento_id: data.id,
      //      criado_em: new Date().toISOString(),
      //    })
      //
      // 2. Envio de email de acesso (Resend):
      //    const { Resend } = await import('resend')
      //    const resend = new Resend(process.env.RESEND_API_KEY)
      //    await resend.emails.send({
      //      from: 'no-reply@seudominio.com.br',
      //      to: payer.email,
      //      subject: 'Seu acesso ao Contrato Freelancer está liberado!',
      //      html: `<p>Olá! Seu pagamento foi aprovado. Acesse: ${process.env.VITE_APP_URL}/app</p>`
      //    })
      //
      // ─────────────────────────────────────────────────────────────────────

      console.log(`[webhook] ✓ Pagamento aprovado para ${payer?.email} — plano: ${external_reference}`)
    } else {
      console.log(`[webhook] ✗ Pagamento não aprovado: ${status} (${status_detail})`)
    }
  } catch (err) {
    console.error('[webhook] erro ao processar pagamento:', err)
  }
}
