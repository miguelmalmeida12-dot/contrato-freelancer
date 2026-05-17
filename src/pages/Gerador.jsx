import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContratos } from '../hooks/useContratos.js'
import { isLoggedIn, isPremium, isAdmin, getUser, verificarLimiteFree, registrarUsoContrato, logout } from '../lib/auth.js'

// ─── DADOS ────────────────────────────────────────────────────────────────────

const TIPOS = [
  { id: 'servicos',   label: 'Prestação de Serviços',      icon: '◆', desc: 'Qualquer serviço autônomo' },
  { id: 'software',   label: 'Desenvolvimento de Software', icon: '◈', desc: 'Apps, sistemas e APIs' },
  { id: 'design',     label: 'Design / Criação',            icon: '◉', desc: 'Visual, UI/UX, social media' },
  { id: 'influencer', label: 'Influencer Marketing',        icon: '◎', desc: 'Publipost e parcerias' },
]

const STEPS = {
  servicos:   ['Tipo', 'Contratante', 'Contratado', 'Escopo', 'Financeiro', 'Condições', 'Revisão'],
  software:   ['Tipo', 'Cliente', 'Desenvolvedor', 'Projeto', 'Milestones', 'Pagamento', 'Condições', 'Revisão'],
  design:     ['Tipo', 'Contratante', 'Designer', 'Escopo', 'Financeiro', 'Condições', 'Revisão'],
  influencer: ['Tipo', 'Marca', 'Influencer', 'Campanha', 'Conteúdo', 'Financeiro', 'Revisão'],
}

const STEP_MAP = {
  servicos:   ['tipo', 'contratante', 'contratado', 'escopo', 'financeiro', 'condicoes', 'preview'],
  software:   ['tipo', 'cliente', 'desenvolvedor', 'projeto', 'milestones', 'pagamento', 'condicoes', 'preview'],
  design:     ['tipo', 'contratante', 'designer', 'escopo', 'financeiro', 'condicoes', 'preview'],
  influencer: ['tipo', 'marca', 'influencer', 'campanha', 'conteudo', 'financeiro', 'preview'],
}

const STEP_INFO = {
  contratante:  { title: 'Dados do Contratante',     sub: 'Quem está contratando o serviço' },
  contratado:   { title: 'Seus Dados',               sub: 'O prestador do serviço' },
  escopo:       { title: 'Escopo do Serviço',        sub: 'O que será entregue e quando' },
  financeiro:   { title: 'Valores e Pagamento',      sub: 'Como e quando você receberá' },
  condicoes:    { title: 'Condições Gerais',          sub: 'Rescisão, revisões e foro' },
  cliente:      { title: 'Dados do Cliente',          sub: 'Quem contrata o desenvolvimento' },
  desenvolvedor:{ title: 'Seus Dados',               sub: 'O desenvolvedor ou agência' },
  projeto:      { title: 'Detalhes do Projeto',       sub: 'Escopo técnico e funcionalidades' },
  milestones:   { title: 'Fases e Entregas',          sub: 'Cronograma e pagamentos por etapa' },
  pagamento:    { title: 'Pagamento',                 sub: 'Valores totais e forma de pagamento' },
  designer:     { title: 'Seus Dados',               sub: 'O designer ou estúdio' },
  marca:        { title: 'Dados da Marca',            sub: 'A empresa contratante da campanha' },
  influencer:   { title: 'Seus Dados',               sub: 'O influencer ou criador de conteúdo' },
  campanha:     { title: 'Dados da Campanha',         sub: 'Plataformas, formatos e cronograma' },
  conteudo:     { title: 'Conteúdo e Aprovação',      sub: 'Diretrizes, menções e prazos' },
  preview:      { title: 'Revisar e Baixar',          sub: 'Confirme os dados e gere o PDF' },
}

const FIELDS = {
  servicos: {
    contratante: [
      { key:'cont_nome',     label:'Nome / Razão Social', type:'text',   req:true,  placeholder:'Ex: Empresa XPTO Ltda' },
      { key:'cont_cpf',      label:'CPF / CNPJ',          type:'text',   req:true,  placeholder:'000.000.000-00' },
      { key:'cont_email',    label:'E-mail',              type:'email',  req:true,  placeholder:'email@empresa.com' },
      { key:'cont_telefone', label:'Telefone',            type:'text',   req:false, placeholder:'(11) 99999-9999' },
      { key:'cont_endereco', label:'Endereço completo',   type:'text',   req:false, placeholder:'Rua, nº, cidade – UF', full:true },
    ],
    contratado: [
      { key:'tado_nome',     label:'Seu nome / Razão Social', type:'text',   req:true,  placeholder:'Seu nome completo' },
      { key:'tado_cpf',      label:'CPF / CNPJ',              type:'text',   req:true,  placeholder:'000.000.000-00' },
      { key:'tado_email',    label:'E-mail',                  type:'email',  req:true,  placeholder:'voce@email.com' },
      { key:'tado_telefone', label:'Telefone',                type:'text',   req:false, placeholder:'(11) 99999-9999' },
      { key:'tado_endereco', label:'Endereço',                type:'text',   req:false, placeholder:'Rua, nº, cidade – UF', full:true },
    ],
    escopo: [
      { key:'descricao',        label:'Descrição detalhada dos serviços', type:'textarea', req:true,  placeholder:'Descreva tudo que será entregue...', full:true },
      { key:'modalidade',       label:'Modalidade',                       type:'select',   req:true,  options:['Remota','Presencial','Híbrida'] },
      { key:'data_inicio',      label:'Data de início',                   type:'date',     req:true },
      { key:'data_fim',         label:'Data de conclusão',                type:'date',     req:true },
      { key:'num_revisoes',     label:'Revisões incluídas',               type:'number',   req:true,  placeholder:'3' },
      { key:'formatos_entrega', label:'Formatos de entrega',              type:'text',     req:false, placeholder:'PDF, PNG, arquivos editáveis', full:true },
    ],
    financeiro: [
      { key:'valor_total',      label:'Valor total (R$)',         type:'text',   req:true, placeholder:'R$ 3.500,00' },
      { key:'forma_pagamento',  label:'Forma de pagamento',       type:'select', req:true, options:['PIX','Transferência bancária','Boleto','Cartão','Combinado'] },
      { key:'data_vencimento',  label:'Data(s) de vencimento',   type:'text',   req:true, placeholder:'50% início + 50% entrega' },
      { key:'dados_bancarios',  label:'Chave PIX / Dados bancários', type:'text', req:true, placeholder:'CPF, e-mail ou chave' },
      { key:'data_primeiro_pag',label:'Data do 1º pagamento',    type:'date',   req:true },
    ],
    condicoes: [
      { key:'prazo_retorno',  label:'Prazo p/ contratante fornecer materiais (dias)', type:'number', req:true, placeholder:'5' },
      { key:'prazo_aprovacao',label:'Prazo p/ aprovação de entregas (dias úteis)',    type:'number', req:true, placeholder:'3' },
      { key:'prazo_aviso',    label:'Aviso prévio para rescisão (dias)',              type:'number', req:true, placeholder:'15' },
      { key:'multa_rescisao', label:'Multa rescisória (%)',                           type:'number', req:true, placeholder:'20' },
      { key:'cidade_foro',    label:'Cidade do foro',                                type:'text',   req:true, placeholder:'São Paulo – SP' },
    ],
  },
  software: {
    cliente: [
      { key:'cli_nome',  label:'Nome / Razão Social',  type:'text',  req:true,  placeholder:'Empresa cliente' },
      { key:'cli_cpf',   label:'CPF / CNPJ',           type:'text',  req:true,  placeholder:'00.000.000/0001-00' },
      { key:'cli_rep',   label:'Representante legal',  type:'text',  req:false, placeholder:'Nome do responsável' },
      { key:'cli_email', label:'E-mail',               type:'email', req:true,  placeholder:'cliente@empresa.com' },
      { key:'cli_tel',   label:'Telefone',             type:'text',  req:false, placeholder:'(11) 99999-9999' },
    ],
    desenvolvedor: [
      { key:'dev_nome',  label:'Nome / Razão Social', type:'text',  req:true,  placeholder:'Seu nome ou empresa' },
      { key:'dev_cpf',   label:'CPF / CNPJ',          type:'text',  req:true,  placeholder:'000.000.000-00' },
      { key:'dev_email', label:'E-mail',              type:'email', req:true,  placeholder:'voce@email.com' },
      { key:'dev_tel',   label:'Telefone',            type:'text',  req:false, placeholder:'(11) 99999-9999' },
    ],
    projeto: [
      { key:'proj_nome',       label:'Nome do projeto',       type:'text',     req:true,  placeholder:'Ex: Plataforma de Agendamentos' },
      { key:'proj_tipo',       label:'Tipo de produto',       type:'select',   req:true,  options:['Web App','App Mobile','API / Backend','Sistema Desktop','E-commerce','Outro'] },
      { key:'proj_plataformas',label:'Plataformas-alvo',      type:'text',     req:true,  placeholder:'Web, iOS, Android' },
      { key:'proj_stack',      label:'Stack tecnológica',     type:'text',     req:false, placeholder:'React, Node.js, PostgreSQL', full:true },
      { key:'proj_escopo',     label:'Escopo e funcionalidades', type:'textarea', req:true, placeholder:'Liste as funcionalidades incluídas...', full:true },
    ],
    milestones: [
      { key:'ms1_fase',    label:'Fase 1 – Nome',        type:'text', req:true,  placeholder:'Ex: Design e UX' },
      { key:'ms1_entrega', label:'Fase 1 – Entregável',  type:'text', req:true,  placeholder:'Ex: Wireframes aprovados' },
      { key:'ms1_prazo',   label:'Fase 1 – Prazo',       type:'date', req:true },
      { key:'ms1_valor',   label:'Fase 1 – Valor (R$)',  type:'text', req:true,  placeholder:'R$ 1.500,00' },
      { key:'ms2_fase',    label:'Fase 2 – Nome',        type:'text', req:false, placeholder:'Ex: Desenvolvimento' },
      { key:'ms2_entrega', label:'Fase 2 – Entregável',  type:'text', req:false, placeholder:'Ex: MVP funcional' },
      { key:'ms2_prazo',   label:'Fase 2 – Prazo',       type:'date', req:false },
      { key:'ms2_valor',   label:'Fase 2 – Valor (R$)',  type:'text', req:false, placeholder:'R$ 3.000,00' },
      { key:'ms3_fase',    label:'Fase 3 – Nome',        type:'text', req:false, placeholder:'Ex: Entrega final' },
      { key:'ms3_entrega', label:'Fase 3 – Entregável',  type:'text', req:false, placeholder:'Ex: Deploy em produção' },
      { key:'ms3_prazo',   label:'Fase 3 – Prazo',       type:'date', req:false },
      { key:'ms3_valor',   label:'Fase 3 – Valor (R$)',  type:'text', req:false, placeholder:'R$ 2.500,00' },
    ],
    pagamento: [
      { key:'sw_valor_total',   label:'Valor total (R$)',            type:'text',   req:true, placeholder:'R$ 8.000,00' },
      { key:'sw_pct_entrada',   label:'Entrada (%)',                 type:'number', req:true, placeholder:'30' },
      { key:'sw_valor_entrada', label:'Valor da entrada (R$)',       type:'text',   req:true, placeholder:'R$ 2.400,00' },
      { key:'sw_pct_final',     label:'Pagamento final (%)',         type:'number', req:true, placeholder:'30' },
      { key:'sw_valor_final',   label:'Valor final (R$)',            type:'text',   req:true, placeholder:'R$ 2.400,00' },
      { key:'sw_forma_pag',     label:'Forma de pagamento',          type:'select', req:true, options:['PIX','Transferência bancária','Boleto','Combinado'] },
      { key:'sw_dados_banco',   label:'Chave PIX / Dados bancários', type:'text',   req:true, placeholder:'CPF, e-mail ou chave', full:true },
    ],
    condicoes: [
      { key:'sw_garantia',    label:'Garantia técnica (dias)',                   type:'number', req:true, placeholder:'60' },
      { key:'sw_prazo_aceite',label:'Prazo de aceite por entrega (dias úteis)',  type:'number', req:true, placeholder:'5' },
      { key:'sw_nda_anos',    label:'Confidencialidade (anos)',                  type:'number', req:true, placeholder:'2' },
      { key:'sw_cidade_foro', label:'Cidade do foro',                            type:'text',   req:true, placeholder:'São Paulo – SP' },
    ],
  },
  design: {
    contratante: [
      { key:'dc_nome',  label:'Nome / Empresa',   type:'text',  req:true,  placeholder:'Nome do cliente' },
      { key:'dc_cpf',   label:'CPF / CNPJ',       type:'text',  req:true,  placeholder:'000.000.000-00' },
      { key:'dc_email', label:'E-mail',           type:'email', req:true,  placeholder:'cliente@email.com' },
      { key:'dc_redes', label:'Instagram / Site', type:'text',  req:false, placeholder:'@empresa ou www.empresa.com' },
    ],
    designer: [
      { key:'ds_nome',      label:'Seu nome / Estúdio', type:'text',  req:true,  placeholder:'Nome completo ou estúdio' },
      { key:'ds_cpf',       label:'CPF / CNPJ',         type:'text',  req:true,  placeholder:'000.000.000-00' },
      { key:'ds_email',     label:'E-mail',             type:'email', req:true,  placeholder:'voce@email.com' },
      { key:'ds_portfolio', label:'Portfólio',          type:'text',  req:false, placeholder:'behance.net/seu-perfil' },
    ],
    escopo: [
      { key:'dg_tipo',          label:'Tipo de projeto',                    type:'select',   req:true,  options:['Identidade Visual','UI/UX','Branding','Social Media','Criação Gráfica','Outro'] },
      { key:'dg_entregas',      label:'Entregas principais',                type:'textarea', req:true,  placeholder:'Logo, paleta, tipografia, mockups...', full:true },
      { key:'dg_formatos',      label:'Formatos de entrega',                type:'text',     req:true,  placeholder:'AI, PDF, PNG, Figma', full:true },
      { key:'dg_opcoes',        label:'Opções de conceito inicial',         type:'number',   req:true,  placeholder:'2' },
      { key:'dg_versoes',       label:'Versões completas incluídas',        type:'number',   req:true,  placeholder:'2' },
      { key:'dg_revisoes',      label:'Rodadas de ajuste por entrega',      type:'number',   req:true,  placeholder:'3' },
      { key:'dg_prazo_conceito',label:'Prazo para conceito (dias úteis)',   type:'number',   req:true,  placeholder:'7' },
      { key:'dg_prazo_feedback',label:'Prazo de feedback do cliente (dias)',type:'number',   req:true,  placeholder:'3' },
    ],
    financeiro: [
      { key:'dg_valor', label:'Valor total (R$)',             type:'text',   req:true, placeholder:'R$ 2.500,00' },
      { key:'dg_sinal', label:'Valor do sinal 50% (R$)',      type:'text',   req:true, placeholder:'R$ 1.250,00' },
      { key:'dg_final', label:'Valor pagamento final (R$)',   type:'text',   req:true, placeholder:'R$ 1.250,00' },
      { key:'dg_forma', label:'Forma de pagamento',           type:'select', req:true, options:['PIX','Transferência bancária','Boleto','Combinado'] },
      { key:'dg_dados', label:'Chave PIX / Dados bancários',  type:'text',   req:true, placeholder:'CPF, e-mail ou chave', full:true },
    ],
    condicoes: [
      { key:'dg_excl_pct',label:'Adicional por exclusividade (%)', type:'number', req:false, placeholder:'20' },
      { key:'dg_cidade',  label:'Cidade do foro',                  type:'text',   req:true,  placeholder:'São Paulo – SP' },
    ],
  },
  influencer: {
    marca: [
      { key:'mk_nome',  label:'Razão Social / Nome da marca', type:'text',  req:true,  placeholder:'Empresa ABC Ltda' },
      { key:'mk_cnpj',  label:'CNPJ / CPF',                   type:'text',  req:true,  placeholder:'00.000.000/0001-00' },
      { key:'mk_rep',   label:'Representante',                 type:'text',  req:true,  placeholder:'Nome do responsável' },
      { key:'mk_email', label:'E-mail',                        type:'email', req:true,  placeholder:'marketing@empresa.com' },
      { key:'mk_tel',   label:'Telefone',                      type:'text',  req:false, placeholder:'(11) 99999-9999' },
    ],
    influencer: [
      { key:'inf_nome',      label:'Nome / Nome artístico',         type:'text',  req:true,  placeholder:'Seu nome ou @ principal' },
      { key:'inf_cpf',       label:'CPF / CNPJ',                   type:'text',  req:true,  placeholder:'000.000.000-00' },
      { key:'inf_email',     label:'E-mail',                       type:'email', req:true,  placeholder:'voce@email.com' },
      { key:'inf_arrobas',   label:'Instagram / TikTok / YouTube', type:'text',  req:true,  placeholder:'@sua-conta', full:true },
      { key:'inf_seguidores',label:'Número de seguidores',         type:'text',  req:true,  placeholder:'Ex: 125.000' },
    ],
    campanha: [
      { key:'cp_produto',       label:'Produto / serviço a divulgar',     type:'text',   req:true,  placeholder:'Ex: Curso de culinária online', full:true },
      { key:'cp_plataforma',    label:'Plataforma(s)',                     type:'select', req:true,  options:['Instagram','TikTok','YouTube','Twitch','Multi-plataforma'] },
      { key:'cp_formatos',      label:'Formatos de conteúdo',             type:'text',   req:true,  placeholder:'3 Stories + 1 Reels + 1 Feed', full:true },
      { key:'cp_qtd',           label:'Quantidade de publicações',        type:'number', req:true,  placeholder:'5' },
      { key:'cp_inicio',        label:'Início da campanha',               type:'date',   req:true },
      { key:'cp_fim',           label:'Fim da campanha',                  type:'date',   req:true },
      { key:'cp_tempo_stories', label:'Tempo mínimo nos Stories (horas)', type:'number', req:false, placeholder:'24' },
      { key:'cp_tempo_feed',    label:'Tempo mínimo no Feed (dias)',      type:'number', req:false, placeholder:'90' },
    ],
    conteudo: [
      { key:'cn_mencao',     label:'@Menção ou hashtag obrigatória',          type:'text',   req:true,  placeholder:'@marca ou #hashtag' },
      { key:'cn_link',       label:'Link / código de desconto (opcional)',     type:'text',   req:false, placeholder:'linktr.ee/marca ou CODIGO10' },
      { key:'cn_prazo_envio',label:'Envio para aprovação (dias antes)',        type:'number', req:true,  placeholder:'3' },
      { key:'cn_prazo_aprov',label:'Prazo da marca para aprovar (dias úteis)', type:'number', req:true,  placeholder:'2' },
      { key:'cn_rodadas',    label:'Máx. rodadas de ajuste',                  type:'number', req:true,  placeholder:'2' },
      { key:'cn_excl_prazo', label:'Não-concorrência após campanha (dias)',    type:'number', req:true,  placeholder:'30' },
      { key:'cn_excl_cat',   label:'Categoria de não-concorrência',            type:'text',   req:true,  placeholder:'cursos online de gastronomia', full:true },
    ],
    financeiro: [
      { key:'inf_valor',    label:'Valor total da parceria (R$)',            type:'text',   req:true,  placeholder:'R$ 4.500,00' },
      { key:'inf_forma',    label:'Forma de pagamento',                      type:'select', req:true,  options:['PIX','Transferência bancária','Nota Fiscal','Combinado'] },
      { key:'inf_dados',    label:'Chave PIX / Dados bancários',             type:'text',   req:true,  placeholder:'CPF, e-mail ou chave' },
      { key:'inf_data_pag', label:'Data de pagamento',                       type:'date',   req:true },
      { key:'inf_produtos', label:'Produtos/brindes enviados (se houver)',    type:'text',   req:false, placeholder:'Kit de produtos + R$2.000', full:true },
      { key:'inf_prazo_rel',label:'Prazo relatório de métricas (dias)',       type:'number', req:true,  placeholder:'7' },
      { key:'inf_cidade',   label:'Cidade do foro',                          type:'text',   req:true,  placeholder:'São Paulo – SP' },
    ],
  },
}

// ─── CSS GLOBAL DO PDF ────────────────────────────────────────────────────────

const PDF_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #1A1612; line-height: 1.85; background: #fff; padding: 28mm 22mm 24mm 28mm; }
  .doc-header { text-align: center; border-bottom: 2px solid #1A1612; padding-bottom: 16px; margin-bottom: 20px; }
  .doc-marca { font-family: Arial, sans-serif; font-size: 9pt; letter-spacing: .15em; text-transform: uppercase; color: #C8502A; margin-bottom: 8px; }
  .doc-title { font-family: Arial, sans-serif; font-size: 15pt; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
  .doc-subtitle { font-size: 9pt; color: #6B6358; }
  .preambulo { background: #F7F5F0; border-left: 3px solid #C8502A; padding: 10px 14px; font-size: 10pt; line-height: 1.7; margin-bottom: 20px; color: #3A3530; }
  .sec-title { font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #fff; background: #2C3E50; padding: 5px 10px; margin: 22px 0 12px; }
  .parte-label { font-family: Arial, sans-serif; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #C8502A; display: block; margin-bottom: 5px; }
  .parte-bloco { border: 1px solid #E2DDD6; border-radius: 2px; padding: 10px 14px; margin-bottom: 10px; }
  .parte-bloco p { margin: 2px 0; font-size: 10.5pt; }
  .clause { margin-bottom: 16px; page-break-inside: avoid; }
  .clause-title { font-family: Arial, sans-serif; font-size: 10pt; font-weight: 700; color: #1A1612; margin-bottom: 5px; }
  .ai-badge { font-family: Arial, sans-serif; font-size: 7pt; color: #1D4ED8; background: #EFF6FF; padding: 1px 5px; border-radius: 2px; font-weight: 600; }
  .clause-body { font-size: 10.5pt; color: #2C2820; line-height: 1.9; text-align: justify; }
  .clause-body p { margin-bottom: 8px; }
  .ms-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 8px 0 12px; }
  .ms-table th { background: #2C3E50; color: #fff; padding: 5px 8px; text-align: left; font-family: Arial, sans-serif; font-size: 8.5pt; }
  .ms-table td { padding: 5px 8px; border-bottom: 1px solid #E2DDD6; }
  .ms-table tr:nth-child(even) td { background: #F7F5F0; }
  .fecho { font-size: 10.5pt; color: #2C2820; text-align: justify; line-height: 1.8; margin-top: 24px; }
  .sig-local { font-size: 10pt; color: #6B6358; margin: 24px 0 32px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 24px; }
  .sig-line { border-top: 1.5px solid #1A1612; padding-top: 10px; margin-top: 48px; }
  .sig-label { font-family: Arial, sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; color: #C8502A; font-weight: 700; }
  .sig-name { font-size: 10.5pt; font-weight: 700; margin-top: 3px; }
  .sig-detail { font-size: 9pt; color: #6B6358; line-height: 1.6; }
  .test-section { margin-top: 20px; padding-top: 14px; border-top: 1px dashed #CEC8BF; }
  .test-label { font-family: Arial, sans-serif; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; color: #6B6358; margin-bottom: 16px; }
  .test-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .test-box .sig-line { margin-top: 36px; }
  .doc-footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #E2DDD6; font-family: Arial, sans-serif; font-size: 8pt; color: #A09890; text-align: center; }
`

// ─── GERADOR DE HTML DO PDF ───────────────────────────────────────────────────

function buildPdf(tipo, data, ia) {
  const v = (k, fb = '___________') => (data[k] && String(data[k]).trim()) ? String(data[k]) : fb
  const hoje = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })
  const IA = ia || {}
  const aiBadge = ia ? ' <span class="ai-badge">IA</span>' : ''

  const foro = v('cidade_foro', v('sw_cidade_foro', v('dg_cidade', v('inf_cidade', '__________'))))

  const sigs = (r1, n1, d1, r2, n2, d2, extra1='') => `
    <div class="fecho"><p>E por estarem assim justas e acordadas, as partes assinam o presente instrumento em duas vias de igual teor e forma, juntamente com as testemunhas abaixo, para que produza os devidos efeitos legais.</p></div>
    <div class="sig-local">${foro}, ${hoje}</div>
    <div class="sig-grid">
      <div><div class="sig-line">
        <div class="sig-label">${r1}</div>
        <div class="sig-name">${n1}</div>
        <div class="sig-detail">${d1}</div>${extra1}
      </div></div>
      <div><div class="sig-line">
        <div class="sig-label">${r2}</div>
        <div class="sig-name">${n2}</div>
        <div class="sig-detail">${d2}</div>
      </div></div>
    </div>
    <div class="test-section">
      <div class="test-label">Testemunhas — facultativo, recomendado para maior validade probatória</div>
      <div class="test-grid">
        <div class="test-box"><div class="sig-line"><div class="sig-detail">Nome: _________________________________</div><div class="sig-detail">CPF: ______________________</div></div></div>
        <div class="test-box"><div class="sig-line"><div class="sig-detail">Nome: _________________________________</div><div class="sig-detail">CPF: ______________________</div></div></div>
      </div>
    </div>
    <div class="doc-footer">Documento gerado por TRACT &middot; ${hoje} &middot; Regido pela legislação brasileira &mdash; Código Civil (Lei nº 10.406/2002)</div>
  `

  const bodies = {

    servicos: `
      <div class="doc-header">
        <div class="doc-marca">TRACT &middot; Gerador de Contratos</div>
        <div class="doc-title">Contrato de Prestação de Serviços</div>
        <div class="doc-subtitle">Instrumento Particular de Prestação de Serviços Autônomos</div>
      </div>
      <div class="preambulo">Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas e condições seguintes, em conformidade com os artigos 593 a 609 do Código Civil Brasileiro (Lei nº 10.406/2002).</div>

      <div class="sec-title">I — Qualificação das Partes</div>
      <span class="parte-label">Contratante — quem contrata o serviço</span>
      <div class="parte-bloco">
        <p><strong>Nome / Razão Social:</strong> ${v('cont_nome')}</p>
        <p><strong>CPF / CNPJ:</strong> ${v('cont_cpf')}</p>
        <p><strong>Endereço:</strong> ${v('cont_endereco')}</p>
        <p><strong>E-mail:</strong> ${v('cont_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('cont_telefone')}</p>
      </div>
      <span class="parte-label">Contratado(a) — prestador do serviço</span>
      <div class="parte-bloco">
        <p><strong>Nome / Razão Social:</strong> ${v('tado_nome')}</p>
        <p><strong>CPF / CNPJ:</strong> ${v('tado_cpf')}</p>
        <p><strong>Endereço:</strong> ${v('tado_endereco')}</p>
        <p><strong>E-mail:</strong> ${v('tado_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('tado_telefone')}</p>
      </div>

      <div class="sec-title">II — Cláusulas e Condições</div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 1ª – DO OBJETO DO CONTRATO${aiBadge}</div>
        <div class="clause-body">${IA.clausula_objeto || `<p>O presente contrato tem por objeto a prestação, pelo CONTRATADO ao CONTRATANTE, dos seguintes serviços: <strong>${v('descricao')}</strong>. Os serviços serão executados na modalidade <strong>${v('modalidade')}</strong>, conforme acordado entre as partes, observando os padrões técnicos e de qualidade inerentes à atividade profissional.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 2ª – DO PRAZO DE EXECUÇÃO</div>
        <div class="clause-body"><p>Os serviços terão início em <strong>${v('data_inicio')}</strong> e deverão ser concluídos até <strong>${v('data_fim')}</strong>, salvo motivo de força maior, caso fortuito ou atraso imputável ao CONTRATANTE no fornecimento de materiais e informações necessários. Estão incluídas <strong>${v('num_revisoes')}</strong> rodadas de revisão. Os arquivos finais serão entregues nos formatos: <strong>${v('formatos_entrega')}</strong>.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 3ª – DO VALOR E DA FORMA DE PAGAMENTO</div>
        <div class="clause-body"><p>O CONTRATANTE pagará ao CONTRATADO o valor total de <strong>${v('valor_total')}</strong>, nas condições: ${v('data_vencimento')}. O pagamento será realizado mediante <strong>${v('forma_pagamento')}</strong>, nos dados: ${v('dados_bancarios')}. O primeiro pagamento deverá ocorrer até <strong>${v('data_primeiro_pag')}</strong>. O inadimplemento acarretará multa de 2% e juros de 1% ao mês, nos termos do art. 395 do Código Civil.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 4ª – DAS OBRIGAÇÕES DO CONTRATADO${aiBadge}</div>
        <div class="clause-body">${IA.clausula_obrigacoes_contratado || `<p>São obrigações do CONTRATADO: (a) executar os serviços com zelo, diligência e qualidade técnica compatíveis com a atividade; (b) cumprir os prazos estipulados, comunicando imediatamente qualquer impedimento; (c) manter sigilo sobre todas as informações do CONTRATANTE durante e após o contrato; (d) não subcontratar sem autorização prévia e escrita.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 5ª – DAS OBRIGAÇÕES DO CONTRATANTE${aiBadge}</div>
        <div class="clause-body">${IA.clausula_obrigacoes_contratante || `<p>São obrigações do CONTRATANTE: (a) efetuar os pagamentos nas datas acordadas; (b) fornecer materiais e informações em até <strong>${v('prazo_retorno')}</strong> dias após solicitação; (c) aprovar ou solicitar alterações nas entregas em até <strong>${v('prazo_aprovacao')}</strong> dias úteis — a ausência de resposta implicará aprovação tácita; (d) não solicitar serviços fora do escopo sem formalização de aditivo.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 6ª – DA PROPRIEDADE INTELECTUAL${aiBadge}</div>
        <div class="clause-body">${IA.clausula_propriedade_intelectual || `<p>Os direitos patrimoniais sobre os trabalhos desenvolvidos serão cedidos ao CONTRATANTE após quitação integral de todos os valores, nos termos da Lei nº 9.610/1998. O CONTRATADO mantém o direito moral de autoria, irrenunciável por força de lei, bem como o direito de exibir os trabalhos em seu portfólio profissional.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 7ª – DA RESCISÃO CONTRATUAL${aiBadge}</div>
        <div class="clause-body">${IA.clausula_rescisao || `<p>O contrato poderá ser rescindido mediante aviso prévio de <strong>${v('prazo_aviso')}</strong> dias. Em caso de rescisão unilateral pelo CONTRATANTE após o início dos serviços, ficará devida multa de <strong>${v('multa_rescisao')}%</strong> sobre o valor total, além do pagamento proporcional pelos serviços já prestados.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 8ª – DA AUSÊNCIA DE VÍNCULO EMPREGATÍCIO</div>
        <div class="clause-body"><p>O presente contrato não estabelece relação de emprego ou vínculo empregatício entre as partes. O CONTRATADO é profissional autônomo, responsável pelo recolhimento de seus próprios tributos (ISS, INSS, IR), nos termos do art. 593 do Código Civil.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 9ª – DAS DISPOSIÇÕES GERAIS E DO FORO</div>
        <div class="clause-body"><p>O presente instrumento constitui o acordo integral entre as partes. Eventuais alterações somente produzirão efeitos se formalizadas por escrito e assinadas por ambas as partes. As partes elegem o foro da Comarca de <strong>${v('cidade_foro')}</strong> para dirimir controvérsias, nos termos do art. 63 do Código de Processo Civil.</p></div>
      </div>

      ${sigs('Contratante', v('cont_nome'), `CPF/CNPJ: ${v('cont_cpf')}`, 'Contratado(a)', v('tado_nome'), `CPF/CNPJ: ${v('tado_cpf')}`)}
    `,

    software: `
      <div class="doc-header">
        <div class="doc-marca">TRACT &middot; Gerador de Contratos</div>
        <div class="doc-title">Contrato de Desenvolvimento de Software</div>
        <div class="doc-subtitle">Instrumento Particular de Desenvolvimento e Entrega de Produto Digital</div>
      </div>
      <div class="preambulo">Pelo presente instrumento particular, as partes celebram o presente Contrato de Desenvolvimento de Software, regido pela Lei nº 10.406/2002 (Código Civil), Lei nº 9.609/1998 (Software) e Lei nº 9.610/1998 (Direitos Autorais).</div>

      <div class="sec-title">I — Qualificação das Partes</div>
      <span class="parte-label">Cliente (Contratante)</span>
      <div class="parte-bloco">
        <p><strong>Nome / Razão Social:</strong> ${v('cli_nome')}</p>
        <p><strong>CPF / CNPJ:</strong> ${v('cli_cpf')}</p>
        <p><strong>Representante Legal:</strong> ${v('cli_rep')}</p>
        <p><strong>E-mail:</strong> ${v('cli_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('cli_tel')}</p>
      </div>
      <span class="parte-label">Desenvolvedor(a) / Empresa (Contratado)</span>
      <div class="parte-bloco">
        <p><strong>Nome / Razão Social:</strong> ${v('dev_nome')}</p>
        <p><strong>CPF / CNPJ:</strong> ${v('dev_cpf')}</p>
        <p><strong>E-mail:</strong> ${v('dev_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('dev_tel')}</p>
      </div>

      <div class="sec-title">II — Objeto e Especificações</div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 1ª – DO OBJETO${aiBadge}</div>
        <div class="clause-body">${IA.clausula_objeto || `<p>O presente contrato tem por objeto o desenvolvimento de <strong>${v('proj_nome')}</strong>, classificado como <strong>${v('proj_tipo')}</strong>, para as plataformas <strong>${v('proj_plataformas')}</strong>, utilizando: ${v('proj_stack')}. O escopo compreende: ${v('proj_escopo')}. Funcionalidades não descritas estão fora do escopo e serão orçadas separadamente.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 2ª – DAS FASES, ENTREGAS E MARCOS</div>
        <div class="clause-body">
          <p>O desenvolvimento será organizado nas fases abaixo. Cada fase inicia após aprovação da anterior e pagamento da parcela correspondente:</p>
          <table class="ms-table">
            <thead><tr><th>Fase</th><th>Entregável</th><th>Prazo</th><th>Valor</th></tr></thead>
            <tbody>
              ${['1','2','3'].map(n => data[`ms${n}_fase`] ? `<tr><td><strong>${data[`ms${n}_fase`]}</strong></td><td>${v(`ms${n}_entrega`)}</td><td>${v(`ms${n}_prazo`)}</td><td>${v(`ms${n}_valor`)}</td></tr>` : '').join('')}
            </tbody>
          </table>
          <p>O aceite de cada entrega deverá ser formalizado em até <strong>${v('sw_prazo_aceite')}</strong> dias úteis. Ausência de resposta implica aceite tácito.</p>
        </div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 3ª – DO VALOR E FORMA DE PAGAMENTO</div>
        <div class="clause-body"><p>Valor total: <strong>${v('sw_valor_total')}</strong>. Entrada (${v('sw_pct_entrada')}%): <strong>${v('sw_valor_entrada')}</strong> antes do início. Pagamento final (${v('sw_pct_final')}%): <strong>${v('sw_valor_final')}</strong> na entrega definitiva. Forma: <strong>${v('sw_forma_pag')}</strong>. Dados: ${v('sw_dados_banco')}. Atraso superior a 15 dias autoriza suspensão do desenvolvimento.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 4ª – DO CONTROLE DE MUDANÇAS DE ESCOPO</div>
        <div class="clause-body"><p>Qualquer alteração no escopo original deverá ser formalizada mediante Pedido de Mudança (Change Request) assinado por ambas as partes, contendo: descrição da alteração, impacto no prazo e custo adicional. Nenhuma alteração será implementada sem aprovação formal.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 5ª – DA PROPRIEDADE INTELECTUAL${aiBadge}</div>
        <div class="clause-body">${IA.clausula_propriedade_intelectual || `<p>Após quitação integral, o CONTRATANTE receberá a cessão dos direitos patrimoniais sobre o código-fonte desenvolvido, nos termos da Lei nº 9.609/1998. Bibliotecas e frameworks de terceiros permanecem sujeitos às suas respectivas licenças.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 6ª – DA GARANTIA TÉCNICA E CONFIDENCIALIDADE</div>
        <div class="clause-body"><p>Garantia de <strong>${v('sw_garantia')}</strong> dias para correção de bugs após entrega. Ambas as partes obrigam-se a manter sigilo por <strong>${v('sw_nda_anos')}</strong> anos. Foro eleito: Comarca de <strong>${v('sw_cidade_foro')}</strong>.</p></div>
      </div>

      ${sigs('Cliente', v('cli_nome'), `CPF/CNPJ: ${v('cli_cpf')}`, 'Desenvolvedor(a)', v('dev_nome'), `CPF/CNPJ: ${v('dev_cpf')}`, v('cli_rep') !== '___________' ? `<div class="sig-detail">Repr.: ${v('cli_rep')}</div>` : '')}
    `,

    design: `
      <div class="doc-header">
        <div class="doc-marca">TRACT &middot; Gerador de Contratos</div>
        <div class="doc-title">Contrato de Prestação de Serviços de Design</div>
        <div class="doc-subtitle">Identidade Visual &middot; UI/UX &middot; Branding &middot; Criação Gráfica</div>
      </div>
      <div class="preambulo">Pelo presente instrumento particular, as partes celebram o presente Contrato de Prestação de Serviços de Design, regido pelo Código Civil Brasileiro e pela Lei nº 9.610/1998 (Direitos Autorais).</div>

      <div class="sec-title">I — Qualificação das Partes</div>
      <span class="parte-label">Contratante</span>
      <div class="parte-bloco">
        <p><strong>Nome / Empresa:</strong> ${v('dc_nome')}</p>
        <p><strong>CPF / CNPJ:</strong> ${v('dc_cpf')}</p>
        <p><strong>E-mail:</strong> ${v('dc_email')} &nbsp;&nbsp; <strong>Instagram / Site:</strong> ${v('dc_redes')}</p>
      </div>
      <span class="parte-label">Designer / Estúdio (Contratado)</span>
      <div class="parte-bloco">
        <p><strong>Nome / Estúdio:</strong> ${v('ds_nome')}</p>
        <p><strong>CPF / CNPJ:</strong> ${v('ds_cpf')}</p>
        <p><strong>E-mail:</strong> ${v('ds_email')} &nbsp;&nbsp; <strong>Portfólio:</strong> ${v('ds_portfolio')}</p>
      </div>

      <div class="sec-title">II — Escopo e Condições</div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 1ª – DO OBJETO E ESCOPO CRIATIVO${aiBadge}</div>
        <div class="clause-body">${IA.clausula_objeto || `<p>O presente contrato tem por objeto o desenvolvimento de <strong>${v('dg_tipo')}</strong>, compreendendo: <strong>${v('dg_entregas')}</strong>. Os arquivos serão entregues em: ${v('dg_formatos')}. O projeto contempla <strong>${v('dg_opcoes')}</strong> opções de conceito, <strong>${v('dg_versoes')}</strong> versões completas e <strong>${v('dg_revisoes')}</strong> rodadas de ajuste por entrega. Alterações conceituais após aprovação de direção serão tratadas como novo escopo.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 2ª – DO PROCESSO CRIATIVO E PRAZOS</div>
        <div class="clause-body"><p>O conceito inicial será apresentado em até <strong>${v('dg_prazo_conceito')}</strong> dias úteis após recebimento de todos os materiais. O CONTRATANTE deve fornecer feedback em até <strong>${v('dg_prazo_feedback')}</strong> dias úteis após cada apresentação. Atrasos no retorno impactam diretamente nos prazos, sem responsabilidade do CONTRATADO.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 3ª – DO VALOR E FORMA DE PAGAMENTO</div>
        <div class="clause-body"><p>Valor total: <strong>${v('dg_valor')}</strong>. Sinal de 50% (<strong>${v('dg_sinal')}</strong>) no início; saldo de 50% (<strong>${v('dg_final')}</strong>) na entrega. Forma: <strong>${v('dg_forma')}</strong>. Dados: ${v('dg_dados')}. Os arquivos editáveis serão entregues somente após confirmação da quitação integral.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 4ª – DOS DIREITOS AUTORAIS${aiBadge}</div>
        <div class="clause-body">${IA.clausula_propriedade_intelectual || `<p>Após quitação integral, os direitos patrimoniais são cedidos ao CONTRATANTE para uso comercial irrestrito, nos termos da Lei nº 9.610/1998. O CONTRATADO mantém o direito moral de autoria e o direito de exibir o trabalho em portfólio. Fontes e imagens de terceiros estão sujeitas às licenças de seus respectivos detentores.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 5ª – DA RESCISÃO${aiBadge}</div>
        <div class="clause-body">${IA.clausula_rescisao || `<p>Cancelamento antes do conceito: reembolso de 70% do sinal. Após apresentação do conceito e antes da entrega: sem reembolso do sinal. Em caso de cancelamento pelo CONTRATADO: reembolso integral mais multa de 10% sobre o valor total.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 6ª – DO FORO</div>
        <div class="clause-body"><p>As partes elegem o foro da Comarca de <strong>${v('dg_cidade')}</strong> para dirimir eventuais litígios.</p></div>
      </div>

      ${sigs('Contratante', v('dc_nome'), `CPF/CNPJ: ${v('dc_cpf')}`, 'Designer / Estúdio', v('ds_nome'), `CPF/CNPJ: ${v('ds_cpf')}`)}
    `,

    influencer: `
      <div class="doc-header">
        <div class="doc-marca">TRACT &middot; Gerador de Contratos</div>
        <div class="doc-title">Contrato de Influencer Marketing</div>
        <div class="doc-subtitle">Instrumento Particular de Parceria Comercial para Divulgação Paga</div>
      </div>
      <div class="preambulo">Pelo presente instrumento, as partes celebram o presente Contrato de Influencer Marketing, em conformidade com o Código Civil Brasileiro, as diretrizes do CONAR e a Resolução nº 163/2021 do CONANDA.</div>

      <div class="sec-title">I — Qualificação das Partes</div>
      <span class="parte-label">Marca / Empresa (Contratante)</span>
      <div class="parte-bloco">
        <p><strong>Razão Social:</strong> ${v('mk_nome')}</p>
        <p><strong>CNPJ / CPF:</strong> ${v('mk_cnpj')}</p>
        <p><strong>Representante:</strong> ${v('mk_rep')}</p>
        <p><strong>E-mail:</strong> ${v('mk_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('mk_tel')}</p>
      </div>
      <span class="parte-label">Influenciador(a) (Contratado)</span>
      <div class="parte-bloco">
        <p><strong>Nome / @ artístico:</strong> ${v('inf_nome')}</p>
        <p><strong>CPF / CNPJ:</strong> ${v('inf_cpf')}</p>
        <p><strong>E-mail:</strong> ${v('inf_email')}</p>
        <p><strong>Perfis:</strong> ${v('inf_arrobas')} &nbsp;&nbsp; <strong>Seguidores na data:</strong> ${v('inf_seguidores')}</p>
      </div>

      <div class="sec-title">II — Objeto e Escopo da Campanha</div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 1ª – DO OBJETO${aiBadge}</div>
        <div class="clause-body">${IA.clausula_objeto || `<p>O presente contrato tem por objeto a divulgação paga de <strong>${v('cp_produto')}</strong> pelo CONTRATADO nas plataformas: <strong>${v('cp_plataforma')}</strong>. Serão realizadas <strong>${v('cp_qtd')}</strong> publicações nos formatos: <strong>${v('cp_formatos')}</strong>, no período de <strong>${v('cp_inicio')}</strong> a <strong>${v('cp_fim')}</strong>.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 2ª – DAS DIRETRIZES E CONFORMIDADE COM O CONAR</div>
        <div class="clause-body"><p>Todo conteúdo deverá identificar o caráter publicitário com <strong>#publi</strong>, <strong>#parceria</strong> ou <strong>#ad</strong>, conforme o CONAR. Menção obrigatória: <strong>${v('cn_mencao')}</strong>${data.cn_link ? `. Link/código: ${data.cn_link}` : ''}. Envio para aprovação com <strong>${v('cn_prazo_envio')}</strong> dias de antecedência. A CONTRATANTE terá <strong>${v('cn_prazo_aprov')}</strong> dias úteis para aprovar, com até <strong>${v('cn_rodadas')}</strong> rodadas de ajuste.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 3ª – DO VALOR E PAGAMENTO</div>
        <div class="clause-body"><p>Valor total: <strong>${v('inf_valor')}</strong>. Forma: <strong>${v('inf_forma')}</strong>. Data: <strong>${v('inf_data_pag')}</strong>. Dados: ${v('inf_dados')}.${data.inf_produtos ? ` Além da remuneração, a CONTRATANTE fornecerá: ${data.inf_produtos}.` : ''} Relatório de métricas em até <strong>${v('inf_prazo_rel')}</strong> dias após o encerramento.</p></div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 4ª – DOS DIREITOS DE USO DO CONTEÚDO${aiBadge}</div>
        <div class="clause-body">${IA.clausula_propriedade_intelectual || `<p>A CONTRATANTE poderá fazer repost do conteúdo em seus perfis oficiais. O uso em anúncios pagos ou materiais offline requer autorização adicional e poderá implicar remuneração suplementar a ser negociada.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 5ª – DA NÃO-CONCORRÊNCIA${aiBadge}</div>
        <div class="clause-body">${IA.clausula_rescisao || `<p>Por <strong>${v('cn_excl_prazo')}</strong> dias após o encerramento, o CONTRATADO não divulgará concorrentes na categoria: <strong>${v('cn_excl_cat')}</strong>. O descumprimento implicará multa de 100% do valor contratual.</p>`}</div>
      </div>

      <div class="clause">
        <div class="clause-title">CLÁUSULA 6ª – DO FORO</div>
        <div class="clause-body"><p>As partes elegem o foro da Comarca de <strong>${v('inf_cidade')}</strong> para dirimir eventuais litígios.</p></div>
      </div>

      ${sigs('Marca / Empresa', v('mk_nome'), `CNPJ/CPF: ${v('mk_cnpj')}`, 'Influenciador(a)', v('inf_nome'), `CPF/CNPJ: ${v('inf_cpf')}`, `<div class="sig-detail">Repr.: ${v('mk_rep')}</div>`)}
    `,
  }

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${PDF_CSS}</style></head><body>${bodies[tipo] || '<p>Tipo inválido</p>'}</body></html>`
}

// ─── COMPONENTE FIELD ─────────────────────────────────────────────────────────

function Field({ def, value, onChange }) {
  const base = {
    width: '100%', padding: '10px 14px',
    border: '1px solid #CEC8BF', borderRadius: 3,
    background: '#FAFAF8', color: '#1A1612',
    fontFamily: 'inherit', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .15s',
  }
  const label = (
    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#5C5448', letterSpacing:'.04em', textTransform:'uppercase', marginBottom:5 }}>
      {def.label}{def.req && <span style={{ color:'#C8502A', marginLeft:2 }}>*</span>}
    </label>
  )
  const wrap = (child) => (
    <div style={{ gridColumn: def.full ? '1 / -1' : undefined, display:'flex', flexDirection:'column' }}>
      {label}{child}
    </div>
  )
  if (def.type === 'select') return wrap(
    <select value={value||''} onChange={e => onChange(def.key, e.target.value)}
      style={{ ...base, appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%235C5448' d='M6 8L0 0h12z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center', paddingRight:36 }}>
      <option value="">Selecione...</option>
      {def.options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  if (def.type === 'textarea') return wrap(
    <textarea value={value||''} onChange={e => onChange(def.key, e.target.value)}
      placeholder={def.placeholder} rows={3}
      style={{ ...base, resize:'vertical', lineHeight:1.6 }} />
  )
  return wrap(
    <input type={def.type} value={value||''} onChange={e => onChange(def.key, e.target.value)}
      placeholder={def.placeholder} style={base} />
  )
}

// ─── COMPONENTE PAINEL IA ─────────────────────────────────────────────────────

function PainelIA({ clausulas, alertas, sugestoes, loading, onGerar, temDados }) {
  if (loading) return (
    <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:18, height:18, border:'2px solid #1D4ED8', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite', flexShrink:0 }} />
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:'#1E40AF' }}>Claude está gerando suas cláusulas...</div>
        <div style={{ fontSize:12, color:'#3B82F6', marginTop:2 }}>Isso leva alguns segundos</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!clausulas) return (
    <div style={{ background:'linear-gradient(135deg,#EFF6FF,#F0FDF4)', border:'1px solid #BFDBFE', borderRadius:6, padding:'16px 20px', marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:'#1E3A8A', marginBottom:3 }}>✨ Cláusulas personalizadas com IA</div>
          <div style={{ fontSize:12, color:'#3B82F6', lineHeight:1.5 }}>Gere cláusulas adaptadas ao seu projeto com alertas jurídicos e sugestões de proteção.</div>
        </div>
        <button onClick={onGerar} disabled={!temDados}
          style={{ padding:'9px 18px', background: temDados ? '#1D4ED8' : '#9CA3AF', color:'#fff', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor: temDados ? 'pointer' : 'not-allowed', whiteSpace:'nowrap', fontFamily:'inherit' }}>
          ✨ Gerar com Claude
        </button>
      </div>
      {!temDados && <div style={{ fontSize:11, color:'#6B7280', marginTop:8 }}>Preencha pelo menos os campos principais para ativar.</div>}
    </div>
  )
  return (
    <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:6, padding:'16px 20px', marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#1A1612' }}>✨ Cláusulas geradas por IA</div>
        <button onClick={onGerar} style={{ fontSize:12, color:'#3B82F6', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>↻ Regerar</button>
      </div>
      {alertas?.length > 0 && (
        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:4, padding:'10px 14px', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#C2410C', marginBottom:6, textTransform:'uppercase', letterSpacing:'.04em' }}>⚠ Alertas</div>
          {alertas.map((a,i) => <div key={i} style={{ fontSize:12, color:'#9A3412', lineHeight:1.6 }}>• {a}</div>)}
        </div>
      )}
      {[['Objeto', clausulas.clausula_objeto], ['Obrigações do Contratado', clausulas.clausula_obrigacoes_contratado], ['Obrigações do Contratante', clausulas.clausula_obrigacoes_contratante], ['Propriedade Intelectual', clausulas.clausula_propriedade_intelectual], ['Rescisão', clausulas.clausula_rescisao]].filter(([,v]) => v).map(([t, tx]) => (
        <details key={t} style={{ borderBottom:'1px solid #F3F0EB', paddingBottom:10, marginBottom:10 }}>
          <summary style={{ fontSize:13, fontWeight:600, color:'#1A1612', cursor:'pointer', listStyle:'none', display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
            {t} <span style={{ color:'#A09890', fontWeight:400 }}>▾</span>
          </summary>
          <div style={{ fontSize:12, color:'#5C5448', lineHeight:1.8, marginTop:8, paddingLeft:12, borderLeft:'2px solid #E2DDD6' }}>{tx}</div>
        </details>
      ))}
      {sugestoes?.length > 0 && (
        <div style={{ background:'#F0FDF4', borderRadius:4, padding:'10px 14px', marginTop:8 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#166534', marginBottom:6, textTransform:'uppercase', letterSpacing:'.04em' }}>💡 Sugestões</div>
          {sugestoes.map((s,i) => <div key={i} style={{ fontSize:12, color:'#166534', lineHeight:1.6 }}>• {s}</div>)}
        </div>
      )}
    </div>
  )
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────

export default function Gerador() {
  const navigate = useNavigate()
  const { salvarContrato } = useContratos()

  // ── GUARD SÍNCRONO: lê sessão imediatamente, antes de qualquer render ────────
  // Não usa useEffect para evitar flash de redirect em usuários logados.
  // isLoggedIn() é síncrono (lê localStorage diretamente).
  const [autorizado] = useState(() => isLoggedIn())

  useEffect(() => {
    if (!autorizado) {
      navigate('/', { replace: true })
    }
  }, [autorizado])

  // Se não autorizado, não renderiza nada (evita flash de conteúdo)
  if (!autorizado) return null

  const user    = getUser()
  const premium = isPremium()
  const admin   = isAdmin()
  const limite  = verificarLimiteFree()

  const [tipo, setTipo] = useState('servicos')
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})
  const [clausulas, setClausulas] = useState(null)
  const [alertas, setAlertas] = useState(null)
  const [sugestoes, setSugestoes] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // Carrega contrato salvo vindo do perfil
  useEffect(() => {
    const salvo = sessionStorage.getItem('tract_carregar_contrato')
    if (salvo) {
      try {
        const c = JSON.parse(salvo)
        setTipo(c.tipo || 'servicos')
        setData(c.data || {})
        setClausulas(c.clausulasIA || null)
        setStep(STEPS[c.tipo || 'servicos'].length - 1)
        sessionStorage.removeItem('tract_carregar_contrato')
      } catch {}
    }
  }, [])

  const steps = STEPS[tipo]
  const stepMap = STEP_MAP[tipo]
  const isPreview = stepMap[step] === 'preview'
  const progress = Math.round((step / (steps.length - 1)) * 100)
  const currentGroup = stepMap[step]
  const currentFields = FIELDS[tipo]?.[currentGroup] || null
  const info = STEP_INFO[currentGroup] || { title:'', sub:'' }
  const temDados = Object.values(data).filter(Boolean).length >= 4

  const onChange = useCallback((k, v) => setData(d => ({ ...d, [k]: v })), [])

  const resetTipo = (t) => { setTipo(t); setStep(0); setData({}); setClausulas(null); setAlertas(null); setSugestoes(null); setMenuOpen(false) }

  const toast_ = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const gerarClausulas = async () => {
    setLoadingAI(true); setClausulas(null)
    try {
      const res = await fetch('/api/gerar-clausulas', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tipo, dados: data }) })
      const json = await res.json()
      if (json.success && json.clausulas) {
        setClausulas(json.clausulas); setAlertas(json.clausulas.alertas||[]); setSugestoes(json.clausulas.sugestoes||[])
        toast_('✨ Cláusulas geradas!')
      } else { toast_(json.error || 'Erro ao gerar cláusulas', false) }
    } catch { toast_('Erro de conexão', false) }
    finally { setLoadingAI(false) }
  }

  // ─── PDF: ÚNICO MÉTODO FUNCIONAL ────────────────────────────────────────────
  // Usa window.open + print() — funciona em todos os browsers sem dependências
  const handleDownload = () => {
    // Verifica limite free ANTES de gerar
    if (!premium && !admin) {
      const lim = verificarLimiteFree()
      if (!lim.permitido) {
        toast_(`Você atingiu o limite de 2 contratos/mês do plano grátis. Faça upgrade para continuar.`, false)
        return
      }
    }

    setGenerating(true)
    try {
      const html = buildPdf(tipo, data, clausulas)
      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) {
        // Fallback se popup bloqueado: cria blob e abre em nova aba
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.target = '_blank'; a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
        toast_('Contrato aberto em nova aba — use Ctrl+P para salvar como PDF')
        setGenerating(false)
        return
      }
      win.document.open()
      win.document.write(html)
      win.document.close()
      // Aguarda renderizar e abre o diálogo de impressão/PDF
      win.onload = () => {
        setTimeout(() => {
          win.focus()
          win.print()
          // Registra uso apenas para free
          if (!premium && !admin) registrarUsoContrato()
          setGenerating(false)
          toast_('✓ Diálogo de PDF aberto! Selecione "Salvar como PDF".')
        }, 500)
      }
      // Fallback se onload não disparar
      setTimeout(() => {
        if (generating) { win.focus(); win.print(); setGenerating(false) }
      }, 2000)
    } catch(e) {
      console.error(e)
      toast_('Erro ao gerar PDF', false)
      setGenerating(false)
    }
  }

  const handleSalvar = () => {
    setSaving(true)
    try { salvarContrato({ tipo, data, clausulasIA: clausulas }); toast_('💾 Contrato salvo no perfil!') }
    catch { toast_('Erro ao salvar', false) }
    finally { setSaving(false) }
  }

  // ─── ESTILOS RESPONSIVOS ─────────────────────────────────────────────────────
  const px = isMobile ? '16px' : '40px'
  const sideW = 240

  return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0', display:'flex', flexDirection:'column' }}>

      {/* ── TOPBAR (SEMPRE VISÍVEL) ── */}
      <header style={{ position:'sticky', top:0, zIndex:50, background:'#1A1612', borderBottom:'1px solid #2C2820', display:'flex', alignItems:'center', justifyContent:'space-between', padding:`0 ${px}`, height:52, flexShrink:0 }}>
        {/* Logo */}
        <span onClick={() => navigate('/')} style={{ fontFamily:'Georgia,serif', fontSize:20, color:'#F7F5F0', cursor:'pointer', letterSpacing:'-.02em', userSelect:'none' }}>
          TR<span style={{ color:'#C8502A' }}>A</span>CT
        </span>

        {/* Barra de progresso inline (desktop) */}
        {!isMobile && (
          <div style={{ flex:1, maxWidth:360, margin:'0 32px', height:3, background:'#3A3530', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'#C8502A', borderRadius:2, transition:'width .4s', width:`${progress}%` }} />
          </div>
        )}

        {/* Ações */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Badge de plano */}
          {!isMobile && user && (
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background: admin?'#7E22CE': premium?'#C8502A':'#3A3530', color:'#F7F5F0' }}>
              {admin ? '👑 Admin' : premium ? `⭐ ${user.plano}` : `🆓 ${limite.usados}/2 contratos`}
            </span>
          )}
          {!isMobile && (
            <button onClick={() => navigate('/perfil')}
              style={{ padding:'6px 14px', background:'none', border:'1px solid #3A3530', color:'#9A9088', borderRadius:3, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              👤 Perfil
            </button>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ background:'none', border:'none', color:'#F7F5F0', fontSize:22, cursor:'pointer', padding:'4px 6px', lineHeight:1 }}>
              ☰
            </button>
          )}
        </div>
      </header>

      {/* ── BARRA DE PROGRESSO MOBILE ── */}
      {isMobile && (
        <div style={{ height:3, background:'#E2DDD6', overflow:'hidden', flexShrink:0 }}>
          <div style={{ height:'100%', background:'#C8502A', transition:'width .4s', width:`${progress}%` }} />
        </div>
      )}

      {/* ── MENU MOBILE DROPDOWN ── */}
      {isMobile && menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:40 }} />
          <div style={{ position:'fixed', top:52, right:0, left:0, background:'#1A1612', zIndex:45, borderBottom:'1px solid #2C2820', padding:'12px 16px' }}>
            <div style={{ fontSize:10, color:'#5C5448', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>Tipo de contrato</div>
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => resetTipo(t.id)}
                style={{ display:'block', width:'100%', textAlign:'left', background: tipo===t.id ? 'rgba(200,80,42,.15)' : 'none', borderLeft:`3px solid ${tipo===t.id ? '#C8502A' : 'transparent'}`, border:'none', color: tipo===t.id ? '#F7F5F0' : '#7A7268', fontFamily:'inherit', fontSize:14, padding:'10px 12px', cursor:'pointer', marginBottom:2, borderRadius:3 }}>
                {t.icon} {t.label}
              </button>
            ))}
            <div style={{ borderTop:'1px solid #2C2820', marginTop:12, paddingTop:12, display:'flex', gap:8 }}>
              <button onClick={() => { navigate('/perfil'); setMenuOpen(false) }}
                style={{ flex:1, padding:'9px', background:'rgba(255,255,255,.06)', border:'1px solid #3A3530', color:'#9A9088', borderRadius:3, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                👤 Meu Perfil
              </button>
              <button onClick={() => { resetTipo(tipo); navigate('/') }}
                style={{ flex:1, padding:'9px', background:'none', border:'1px solid #3A3530', color:'#5C5448', borderRadius:3, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                🏠 Início
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── LAYOUT PRINCIPAL ── */}
      <div style={{ display:'flex', flex:1 }}>

        {/* SIDEBAR DESKTOP */}
        {!isMobile && (
          <aside style={{ width:sideW, background:'#1A1612', color:'#F7F5F0', padding:'28px 20px', position:'sticky', top:52, height:'calc(100vh - 52px)', overflowY:'auto', flexShrink:0, display:'flex', flexDirection:'column' }}>
            <div style={{ fontSize:10, color:'#5C5448', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Tipo de contrato</div>
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => resetTipo(t.id)}
                style={{ display:'block', width:'100%', textAlign:'left', background: tipo===t.id ? 'rgba(200,80,42,.12)' : 'none', border:'none', borderLeft:`2px solid ${tipo===t.id ? '#C8502A' : 'transparent'}`, color: tipo===t.id ? '#F7F5F0' : '#7A7268', fontFamily:'inherit', fontSize:13, padding:'7px 10px', cursor:'pointer', marginBottom:2, transition:'all .15s' }}>
                {t.icon} {t.label}
              </button>
            ))}

            <div style={{ borderTop:'1px solid #2C2820', marginTop:20, paddingTop:20 }}>
              <div style={{ fontSize:10, color:'#5C5448', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Progresso</div>
              {steps.map((s, i) => {
                const done = i < step, active = i === step
                return (
                  <div key={i} onClick={() => i < step && setStep(i)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', fontSize:12, color: done?'#C8502A':active?'#F7F5F0':'#3A3530', cursor: i<step?'pointer':'default', transition:'color .15s' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', border:`1.5px solid ${done?'#C8502A':active?'#F7F5F0':'#3A3530'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, flexShrink:0, fontWeight:700, background:done?'#C8502A':active?'#F7F5F0':'none', color:done?'#fff':active?'#1A1612':'#3A3530' }}>
                      {done ? '✓' : i+1}
                    </div>
                    {s}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop:'auto', paddingTop:20, display:'flex', flexDirection:'column', gap:8 }}>
              <button onClick={() => navigate('/perfil')}
                style={{ padding:'8px 10px', background:'rgba(255,255,255,.05)', border:'1px solid #2C2820', color:'#9A9088', borderRadius:3, fontSize:12, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                👤 Meu perfil
              </button>
              <button onClick={() => resetTipo(tipo)}
                style={{ padding:'8px 10px', background:'none', border:'1px solid #2C2820', color:'#5C5448', borderRadius:3, fontSize:12, cursor:'pointer', textAlign:'left', fontFamily:'inherit' }}>
                + Novo contrato
              </button>
            </div>
          </aside>
        )}

        {/* CONTEÚDO PRINCIPAL */}
        <main style={{ flex:1, padding: isMobile ? '24px 16px 120px' : '32px 40px 48px', minWidth:0 }}>
          <div style={{ maxWidth:680, margin:'0 auto' }}>

            {/* STEP 0 — ESCOLHA DO TIPO */}
            {step === 0 && (
              <>
                <div style={{ marginBottom:24 }}>
                  <h1 style={{ fontFamily:'Georgia,serif', fontSize: isMobile?22:28, color:'#1A1612', marginBottom:6, lineHeight:1.2 }}>
                    Qual tipo de <em style={{ color:'#C8502A', fontStyle:'normal' }}>contrato</em>?
                  </h1>
                  <p style={{ fontSize:14, color:'#A09890' }}>Selecione o modelo que melhor descreve o serviço.</p>
                </div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap:12 }}>
                  {TIPOS.map(t => (
                    <button key={t.id} onClick={() => { setTipo(t.id); setStep(1) }}
                      style={{ background: tipo===t.id ? '#1A1612' : '#fff', color: tipo===t.id ? '#F7F5F0' : '#1A1612', border:`1.5px solid ${tipo===t.id ? '#1A1612' : '#E2DDD6'}`, borderRadius:6, padding: isMobile ? '16px 12px' : '20px 18px', cursor:'pointer', textAlign:'left', transition:'all .15s', display:'flex', flexDirection:'column', gap:8, fontFamily:'inherit' }}>
                      <span style={{ fontSize: isMobile?20:24 }}>{t.icon}</span>
                      <span style={{ fontFamily:'Georgia,serif', fontSize: isMobile?13:15, lineHeight:1.2 }}>{t.label}</span>
                      {!isMobile && <span style={{ fontSize:12, opacity:.6 }}>{t.desc}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* STEPS DE FORMULÁRIO */}
            {step > 0 && !isPreview && currentFields && (
              <>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#C8502A', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>
                    Passo {step} de {steps.length - 1}
                  </div>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize: isMobile?20:26, color:'#1A1612', marginBottom:4 }}>{info.title}</h2>
                  <p style={{ fontSize:13, color:'#A09890' }}>{info.sub}</p>
                </div>
                <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:6, padding: isMobile ? '18px 16px' : '24px 28px' }}>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
                    {currentFields.map(f => <Field key={f.key} def={f} value={data[f.key]} onChange={onChange} />)}
                  </div>
                </div>
              </>
            )}

            {/* PREVIEW */}
            {isPreview && (
              <>
                <div style={{ marginBottom:20 }}>
                  <h2 style={{ fontFamily:'Georgia,serif', fontSize: isMobile?20:26, color:'#1A1612', marginBottom:4 }}>
                    Revisar e <em style={{ color:'#C8502A', fontStyle:'normal' }}>baixar</em>
                  </h2>
                  <p style={{ fontSize:13, color:'#A09890' }}>Gere cláusulas com IA e depois baixe o PDF profissional.</p>
                </div>

                <PainelIA clausulas={clausulas} alertas={alertas} sugestoes={sugestoes} loading={loadingAI} onGerar={gerarClausulas} temDados={temDados} />

                {/* BANNER LIMITE FREE */}
                {!premium && !admin && (
                  <div style={{ background: limite.permitido ? '#F0FDF4' : '#FEF2F2', border:`1px solid ${limite.permitido ? '#BBF7D0' : '#FECACA'}`, borderRadius:6, padding:'12px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color: limite.permitido ? '#166534' : '#B91C1C' }}>
                        {limite.permitido ? `🆓 Plano Gratuito — ${limite.restantes} contrato(s) restante(s) este mês` : '🚫 Limite mensal atingido'}
                      </div>
                      <div style={{ fontSize:12, color: limite.permitido ? '#15803D' : '#DC2626', marginTop:2 }}>
                        {limite.permitido ? 'Faça upgrade para contratos ilimitados.' : 'Você usou seus 2 contratos gratuitos deste mês.'}
                      </div>
                    </div>
                    <button onClick={() => navigate('/')}
                      style={{ padding:'8px 16px', background:'#C8502A', color:'#fff', border:'none', borderRadius:3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                      {limite.permitido ? 'Ver planos' : 'Fazer upgrade →'}
                    </button>
                  </div>
                )}

                {/* RESUMO */}
                <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:6, padding: isMobile?'14px 16px':'20px 24px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#5C5448', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:14 }}>Resumo dos dados informados</div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:1, background:'#E2DDD6', border:'1px solid #E2DDD6', borderRadius:4, overflow:'hidden' }}>
                    {Object.entries(data).filter(([,v]) => v).slice(0, isMobile?6:12).map(([k,v]) => (
                      <div key={k} style={{ background:'#fff', padding:'8px 12px' }}>
                        <div style={{ fontSize:9, color:'#A09890', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:2 }}>{k.replace(/_/g,' ')}</div>
                        <div style={{ fontSize:13, color:'#1A1612' }}>{String(v).slice(0,50)}{String(v).length>50?'…':''}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12, fontSize:12, color:'#A09890', background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:4, padding:'8px 12px' }}>
                    💡 Ao clicar em <strong>Baixar PDF</strong>, seu contrato abrirá em nova janela. Use <strong>Ctrl+P</strong> (ou ⌘+P no Mac) e selecione <strong>"Salvar como PDF"</strong>.
                  </div>
                </div>
              </>
            )}

            {/* NAVEGAÇÃO */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:24, gap:10, flexWrap:'wrap' }}>
              <button onClick={() => setStep(s => Math.max(0, s-1))}
                style={{ padding:'11px 20px', background:'none', border:'1px solid #CEC8BF', color:'#5C5448', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', visibility: step===0?'hidden':'visible' }}>
                ← Voltar
              </button>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {isPreview && (
                  <button onClick={handleSalvar} disabled={saving}
                    style={{ padding:'11px 18px', background:'#1D4ED8', color:'#fff', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity: saving?.6:1 }}>
                    {saving ? '⏳' : '💾'} {isMobile ? 'Salvar' : 'Salvar no perfil'}
                  </button>
                )}
                {!isPreview ? (
                  <button onClick={() => setStep(s => s+1)}
                    style={{ padding:'11px 24px', background:'#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    {step===0 ? 'Começar →' : 'Próximo →'}
                  </button>
                ) : (
                  <button onClick={handleDownload} disabled={generating}
                    style={{ padding:'11px 24px', background: generating?'#6B7280':'#2D6A4F', color:'#fff', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor: generating?'not-allowed':'pointer', fontFamily:'inherit' }}>
                    {generating ? '⏳ Aguarde...' : '↓ Baixar PDF'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── BOTTOM NAV MOBILE ── */}
      {isMobile && (
        <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:'#1A1612', borderTop:'1px solid #2C2820', display:'flex', zIndex:50 }}>
          {[
            { icon:'🏠', label:'Início', fn: () => navigate('/') },
            { icon:'📄', label:'Novo',   fn: () => resetTipo(tipo) },
            { icon:'👤', label:'Perfil', fn: () => navigate('/perfil') },
          ].map(item => (
            <button key={item.label} onClick={item.fn}
              style={{ flex:1, padding:'10px 4px 8px', background:'none', border:'none', color:'#9A9088', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, fontFamily:'inherit' }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase' }}>{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:'fixed', bottom: isMobile?72:24, right: isMobile?16:24, left: isMobile?16:'auto', background: toast.ok?'#2D6A4F':'#C8502A', color:'#fff', padding:'12px 18px', borderRadius:4, fontSize:13, fontWeight:500, boxShadow:'0 8px 32px rgba(0,0,0,.2)', zIndex:999, animation:'toastIn .2s ease', textAlign:'center' }}>
          {toast.msg}
          <style>{`@keyframes toastIn{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        </div>
      )}
    </div>
  )
}
