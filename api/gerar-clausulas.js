// api/gerar-clausulas.js
// Usa a Claude API para gerar cláusulas personalizadas com base no escopo do contrato
// Chamada pelo frontend antes da etapa de preview

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Contexto jurídico base para o prompt do sistema
const SYSTEM_PROMPT = `Você é um especialista em direito contratual brasileiro especializado em contratos para freelancers e prestadores de serviços digitais.

Sua função é analisar os dados de um contrato fornecido e gerar cláusulas personalizadas, claras e juridicamente adequadas para a legislação brasileira.

REGRAS OBRIGATÓRIAS:
- Use linguagem jurídica formal, mas clara e acessível
- Cite artigos do Código Civil Brasileiro quando relevante (ex: Art. 421, Art. 593)
- Adapte as cláusulas ao tipo específico de serviço descrito
- Identifique riscos específicos do escopo e adicione proteções adequadas
- Nunca invente informações — use apenas o que foi fornecido
- Mantenha as cláusulas concisas (máx. 3 parágrafos por cláusula)
- Responda APENAS em JSON válido, sem markdown, sem texto fora do JSON

FORMATO DE RESPOSTA (JSON puro, sem blocos de código):
{
  "clausula_objeto": "Texto completo da cláusula do objeto, personalizada para o escopo descrito...",
  "clausula_obrigacoes_contratado": "Texto com obrigações específicas baseadas no tipo de serviço...",
  "clausula_obrigacoes_contratante": "Texto com obrigações do contratante baseadas no contexto...",
  "clausula_propriedade_intelectual": "Cláusula de PI adaptada ao tipo de entrega...",
  "clausula_rescisao": "Cláusula de rescisão com condições específicas para este tipo de projeto...",
  "alertas": ["Alerta 1 sobre risco identificado", "Alerta 2", "Alerta 3"],
  "sugestoes": ["Sugestão de melhoria 1", "Sugestão 2"]
}`

// Monta o prompt do usuário com os dados do contrato
function buildUserPrompt(tipo, dados) {
  const tipoLabels = {
    servicos: 'Prestação de Serviços',
    software: 'Desenvolvimento de Software',
    design: 'Design e Criação',
    influencer: 'Influencer Marketing / Publipost',
  }

  const label = tipoLabels[tipo] || tipo

  // Extrai os campos mais relevantes de cada tipo
  const resumo = {
    servicos: {
      descricao: dados.descricao,
      valor: dados.valor_total,
      prazo: `${dados.data_inicio} até ${dados.data_fim}`,
      modalidade: dados.modalidade,
      revisoes: dados.num_revisoes,
      formatos: dados.formatos_entrega,
    },
    software: {
      projeto: dados.proj_nome,
      tipo_produto: dados.proj_tipo,
      plataformas: dados.proj_plataformas,
      stack: dados.proj_stack,
      escopo: dados.proj_escopo,
      valor: dados.sw_valor_total,
      garantia: `${dados.sw_garantia} dias`,
    },
    design: {
      tipo_projeto: dados.dg_tipo,
      entregas: dados.dg_entregas,
      formatos: dados.dg_formatos,
      versoes: dados.dg_versoes,
      revisoes: dados.dg_revisoes,
      valor: dados.dg_valor,
    },
    influencer: {
      produto: dados.cp_produto,
      plataformas: dados.cp_plataforma,
      formatos_conteudo: dados.cp_formatos,
      publicacoes: dados.cp_qtd,
      periodo: `${dados.cp_inicio} a ${dados.cp_fim}`,
      valor: dados.inf_valor,
      exclusividade: `${dados.cn_excl_prazo} dias na categoria: ${dados.cn_excl_cat}`,
    },
  }

  const dadosRelevantes = resumo[tipo] || dados

  return `Gere cláusulas personalizadas para o seguinte contrato:

TIPO DE CONTRATO: ${label}

DADOS DO PROJETO:
${Object.entries(dadosRelevantes)
  .filter(([, v]) => v)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

Com base nesses dados:
1. Gere a cláusula do objeto descrevendo especificamente o que foi contratado
2. Liste obrigações do contratado específicas para este tipo de serviço
3. Liste obrigações do contratante adequadas ao contexto
4. Redija a cláusula de propriedade intelectual adequada para este tipo de entrega
5. Crie a cláusula de rescisão com condições justas para ambas as partes
6. Identifique até 3 alertas/riscos específicos deste contrato
7. Sugira até 2 cláusulas adicionais que seriam relevantes para este caso`
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { tipo, dados } = req.body

  if (!tipo || !dados) {
    return res.status(400).json({ error: 'tipo e dados são obrigatórios' })
  }

  // Valida que há conteúdo suficiente para gerar cláusulas
  const temConteudo = Object.values(dados).filter(Boolean).length >= 3
  if (!temConteudo) {
    return res.status(400).json({ error: 'Preencha pelo menos os campos principais antes de gerar as cláusulas' })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(tipo, dados),
        },
      ],
    })

    // Extrai o texto da resposta
    const rawText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Parse do JSON retornado pelo Claude
    let clausulas
    try {
      // Remove possíveis blocos de código se o modelo os incluir
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      clausulas = JSON.parse(cleaned)
    } catch {
      // Fallback: tenta extrair JSON do texto
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) {
        clausulas = JSON.parse(match[0])
      } else {
        throw new Error('Resposta do Claude não está em JSON válido')
      }
    }

    return res.status(200).json({
      success: true,
      clausulas,
      tokens_usados: message.usage?.output_tokens,
    })
  } catch (err) {
    console.error('[gerar-clausulas] erro:', err)
    return res.status(500).json({
      error: 'Erro ao gerar cláusulas',
      detail: err.message,
    })
  }
}
