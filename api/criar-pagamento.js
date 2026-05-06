// api/criar-pagamento.js
// Vercel Serverless Function — cria uma preferência de pagamento no Mercado Pago
// Chamada pelo frontend ao usuário clicar em "Assinar"

import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
})

const PLANOS = {
  mensal: {
    titulo: 'Contrato Freelancer — Plano Pro Mensal',
    descricao: 'Contratos ilimitados, 4 modelos, personalização completa.',
    preco: Number(process.env.VITE_PRECO_MENSAL || 3700) / 100,
  },
  vitalicio: {
    titulo: 'Contrato Freelancer — Acesso Vitalício',
    descricao: 'Acesso permanente a todos os modelos e funcionalidades.',
    preco: Number(process.env.VITE_PRECO_VITALICIO || 19700) / 100,
  },
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { plano = 'mensal', email, nome } = req.body

    if (!PLANOS[plano]) {
      return res.status(400).json({ error: 'Plano inválido' })
    }

    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'
    const planoData = PLANOS[plano]

    const preference = new Preference(client)

    const response = await preference.create({
      body: {
        // Item comprado
        items: [
          {
            id: plano,
            title: planoData.titulo,
            description: planoData.descricao,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: planoData.preco,
          },
        ],

        // Payer pré-preenchido (melhora conversão)
        payer: {
          name: nome || '',
          email: email || '',
        },

        // URLs de retorno após pagamento
        back_urls: {
          success: `${appUrl}/sucesso?plano=${plano}`,
          failure: `${appUrl}/pagamento-falhou`,
          pending: `${appUrl}/pagamento-pendente`,
        },
        auto_return: 'approved',

        // Webhook para confirmar pagamento no backend
        notification_url: `${appUrl}/api/webhook-pagamento`,

        // Referência interna para rastrear
        external_reference: `${plano}_${Date.now()}`,

        // Expiração da preferência (24h)
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),

        // Configurações de exibição
        statement_descriptor: 'CONTRATO FREELANCER',
      },
    })

    return res.status(200).json({
      id: response.id,
      init_point: response.init_point,        // URL de pagamento (produção)
      sandbox_init_point: response.sandbox_init_point, // URL de teste
    })
  } catch (err) {
    console.error('[criar-pagamento] erro:', err)
    return res.status(500).json({
      error: 'Erro ao criar preferência de pagamento',
      detail: err.message,
    })
  }
}
