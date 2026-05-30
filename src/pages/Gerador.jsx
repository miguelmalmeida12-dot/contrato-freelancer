import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContratos } from '../hooks/useContratos.js'
import { lerSessao, isPremium, isAdmin, verificarLimiteFree, registrarUsoContrato } from '../lib/auth.js'

// ─── DADOS E CONFIGURAÇÃO ─────────────────────────────────────────────────────

const TIPOS = [
  { id: 'servicos', label: 'Prestação de Serviços', icon: '◆', desc: 'Qualquer serviço autônomo' },
  { id: 'software', label: 'Dev de Software', icon: '◈', desc: 'Apps, sistemas, APIs' },
  { id: 'design', label: 'Design / Criação', icon: '◉', desc: 'Visual, UI/UX, social media' },
  { id: 'influencer', label: 'Influencer Marketing', icon: '◎', desc: 'Publipost e parcerias' },
]

const STEPS = {
  servicos:   ['Tipo', 'Contratante', 'Contratado', 'Escopo', 'Financeiro', 'Condições', 'Preview'],
  software:   ['Tipo', 'Cliente', 'Desenvolvedor', 'Projeto', 'Milestones', 'Pagamento', 'Condições', 'Preview'],
  design:     ['Tipo', 'Contratante', 'Designer', 'Escopo Criativo', 'Financeiro', 'Condições', 'Preview'],
  influencer: ['Tipo', 'Marca', 'Influencer', 'Campanha', 'Conteúdo', 'Financeiro', 'Preview'],
}

const FIELDS = {
  servicos: {
    contratante: [
      { key:'cont_nome', label:'Nome / Razão Social', type:'text', req:true, placeholder:'Ex: Empresa XPTO Ltda' },
      { key:'cont_cpf',  label:'CPF / CNPJ', type:'text', req:true, placeholder:'000.000.000-00' },
      { key:'cont_email',label:'E-mail', type:'email', req:true, placeholder:'email@empresa.com' },
      { key:'cont_telefone',label:'Telefone', type:'text', req:false, placeholder:'(11) 99999-9999' },
      { key:'cont_endereco',label:'Endereço completo', type:'text', req:false, placeholder:'Rua, nº, cidade – UF', full:true },
    ],
    contratado: [
      { key:'tado_nome', label:'Seu nome / Razão Social', type:'text', req:true, placeholder:'Seu nome completo' },
      { key:'tado_cpf',  label:'CPF / CNPJ', type:'text', req:true, placeholder:'000.000.000-00' },
      { key:'tado_email',label:'E-mail', type:'email', req:true, placeholder:'voce@email.com' },
      { key:'tado_telefone',label:'Telefone', type:'text', req:false, placeholder:'(11) 99999-9999' },
      { key:'tado_endereco',label:'Endereço', type:'text', req:false, placeholder:'Rua, nº, cidade – UF', full:true },
    ],
    escopo: [
      { key:'descricao',  label:'Descrição dos serviços', type:'textarea', req:true, placeholder:'Descreva tudo que será entregue...', full:true },
      { key:'modalidade', label:'Modalidade', type:'select', req:true, options:['Remota','Presencial','Híbrida'] },
      { key:'data_inicio',label:'Data de início', type:'date', req:true },
      { key:'data_fim',   label:'Data de conclusão', type:'date', req:true },
      { key:'num_revisoes',label:'Revisões incluídas', type:'number', req:true, placeholder:'3' },
      { key:'formatos_entrega',label:'Formatos de entrega', type:'text', req:false, placeholder:'PDF, PNG, arquivos editáveis', full:true },
    ],
    financeiro: [
      { key:'valor_total',  label:'Valor total (R$)', type:'text', req:true, placeholder:'R$ 3.500,00' },
      { key:'forma_pagamento',label:'Forma de pagamento', type:'select', req:true, options:['PIX','Transferência bancária','Boleto','Cartão','Combinado'] },
      { key:'data_vencimento',label:'Data(s) de vencimento', type:'text', req:true, placeholder:'50% início + 50% entrega' },
      { key:'dados_bancarios',label:'Chave PIX / Dados bancários', type:'text', req:true, placeholder:'CPF, e-mail ou chave aleatória' },
      { key:'data_primeiro_pag',label:'Data do 1º pagamento', type:'date', req:true },
    ],
    condicoes: [
      { key:'prazo_retorno', label:'Prazo p/ contratante fornecer materiais (dias)', type:'number', req:true, placeholder:'5' },
      { key:'prazo_aprovacao',label:'Prazo p/ aprovação de entregas (dias úteis)', type:'number', req:true, placeholder:'3' },
      { key:'prazo_aviso',   label:'Aviso prévio rescisão (dias)', type:'number', req:true, placeholder:'15' },
      { key:'multa_rescisao',label:'Multa rescisória (%)', type:'number', req:true, placeholder:'20' },
      { key:'cidade_foro',   label:'Cidade do foro', type:'text', req:true, placeholder:'São Paulo – SP' },
    ],
  },
  software: {
    cliente: [
      { key:'cli_nome', label:'Nome / Razão Social', type:'text', req:true, placeholder:'Empresa cliente' },
      { key:'cli_cpf',  label:'CPF / CNPJ', type:'text', req:true, placeholder:'00.000.000/0001-00' },
      { key:'cli_rep',  label:'Representante legal', type:'text', req:false, placeholder:'Nome do responsável' },
      { key:'cli_email',label:'E-mail', type:'email', req:true, placeholder:'cliente@empresa.com' },
      { key:'cli_tel',  label:'Telefone', type:'text', req:false, placeholder:'(11) 99999-9999' },
    ],
    desenvolvedor: [
      { key:'dev_nome', label:'Nome / Razão Social', type:'text', req:true, placeholder:'Seu nome ou empresa' },
      { key:'dev_cpf',  label:'CPF / CNPJ', type:'text', req:true, placeholder:'000.000.000-00' },
      { key:'dev_email',label:'E-mail', type:'email', req:true, placeholder:'voce@email.com' },
      { key:'dev_tel',  label:'Telefone', type:'text', req:false, placeholder:'(11) 99999-9999' },
    ],
    projeto: [
      { key:'proj_nome',      label:'Nome do projeto', type:'text', req:true, placeholder:'Ex: Plataforma de Agendamentos' },
      { key:'proj_tipo',      label:'Tipo de produto', type:'select', req:true, options:['Web App','App Mobile','API / Backend','Sistema Desktop','E-commerce','Outro'] },
      { key:'proj_plataformas',label:'Plataformas-alvo', type:'text', req:true, placeholder:'Web, iOS, Android' },
      { key:'proj_stack',     label:'Stack tecnológica', type:'text', req:false, placeholder:'React, Node.js, PostgreSQL', full:true },
      { key:'proj_escopo',    label:'Escopo e funcionalidades', type:'textarea', req:true, placeholder:'Liste as funcionalidades incluídas...', full:true },
    ],
    milestones: [
      { key:'ms1_fase',    label:'Fase 1 – Nome', type:'text', req:true, placeholder:'Ex: Design e UX' },
      { key:'ms1_entrega', label:'Fase 1 – Entregável', type:'text', req:true, placeholder:'Ex: Wireframes aprovados' },
      { key:'ms1_prazo',   label:'Fase 1 – Prazo', type:'date', req:true },
      { key:'ms1_valor',   label:'Fase 1 – Valor (R$)', type:'text', req:true, placeholder:'R$ 1.500,00' },
      { key:'ms2_fase',    label:'Fase 2 – Nome', type:'text', req:false, placeholder:'Ex: Desenvolvimento' },
      { key:'ms2_entrega', label:'Fase 2 – Entregável', type:'text', req:false, placeholder:'Ex: MVP funcional' },
      { key:'ms2_prazo',   label:'Fase 2 – Prazo', type:'date', req:false },
      { key:'ms2_valor',   label:'Fase 2 – Valor (R$)', type:'text', req:false, placeholder:'R$ 3.000,00' },
      { key:'ms3_fase',    label:'Fase 3 – Nome', type:'text', req:false, placeholder:'Ex: Entrega final' },
      { key:'ms3_entrega', label:'Fase 3 – Entregável', type:'text', req:false, placeholder:'Ex: Deploy em produção' },
      { key:'ms3_prazo',   label:'Fase 3 – Prazo', type:'date', req:false },
      { key:'ms3_valor',   label:'Fase 3 – Valor (R$)', type:'text', req:false, placeholder:'R$ 2.500,00' },
    ],
    pagamento: [
      { key:'sw_valor_total',  label:'Valor total (R$)', type:'text', req:true, placeholder:'R$ 8.000,00' },
      { key:'sw_pct_entrada',  label:'Entrada (%)', type:'number', req:true, placeholder:'30' },
      { key:'sw_valor_entrada',label:'Valor da entrada (R$)', type:'text', req:true, placeholder:'R$ 2.400,00' },
      { key:'sw_pct_final',    label:'Pagamento final (%)', type:'number', req:true, placeholder:'30' },
      { key:'sw_valor_final',  label:'Valor final (R$)', type:'text', req:true, placeholder:'R$ 2.400,00' },
      { key:'sw_forma_pag',    label:'Forma de pagamento', type:'select', req:true, options:['PIX','Transferência bancária','Boleto','Combinado'] },
      { key:'sw_dados_banco',  label:'Chave PIX / Dados bancários', type:'text', req:true, placeholder:'CPF, e-mail ou chave', full:true },
    ],
    condicoes: [
      { key:'sw_garantia',    label:'Garantia técnica (dias)', type:'number', req:true, placeholder:'60' },
      { key:'sw_prazo_aceite',label:'Prazo de aceite por entrega (dias úteis)', type:'number', req:true, placeholder:'5' },
      { key:'sw_nda_anos',    label:'Confidencialidade (anos)', type:'number', req:true, placeholder:'2' },
      { key:'sw_cidade_foro', label:'Cidade do foro', type:'text', req:true, placeholder:'São Paulo – SP' },
    ],
  },
  design: {
    contratante: [
      { key:'dc_nome',  label:'Nome / Empresa', type:'text', req:true, placeholder:'Nome do cliente' },
      { key:'dc_cpf',   label:'CPF / CNPJ', type:'text', req:true, placeholder:'000.000.000-00' },
      { key:'dc_email', label:'E-mail', type:'email', req:true, placeholder:'cliente@email.com' },
      { key:'dc_redes', label:'Instagram / Site', type:'text', req:false, placeholder:'@empresa ou www.empresa.com' },
    ],
    designer: [
      { key:'ds_nome',      label:'Seu nome / Estúdio', type:'text', req:true, placeholder:'Nome completo ou estúdio' },
      { key:'ds_cpf',       label:'CPF / CNPJ', type:'text', req:true, placeholder:'000.000.000-00' },
      { key:'ds_email',     label:'E-mail', type:'email', req:true, placeholder:'voce@email.com' },
      { key:'ds_portfolio', label:'Portfólio', type:'text', req:false, placeholder:'behance.net/seu-perfil' },
    ],
    escopo: [
      { key:'dg_tipo',          label:'Tipo de projeto', type:'select', req:true, options:['Identidade Visual','UI/UX','Branding','Social Media','Criação Gráfica','Outro'] },
      { key:'dg_entregas',      label:'Entregas principais', type:'textarea', req:true, placeholder:'Logo, paleta, tipografia, mockups...', full:true },
      { key:'dg_formatos',      label:'Formatos de entrega', type:'text', req:true, placeholder:'AI, PDF, PNG, Figma', full:true },
      { key:'dg_opcoes',        label:'Opções de conceito inicial', type:'number', req:true, placeholder:'2' },
      { key:'dg_versoes',       label:'Versões completas', type:'number', req:true, placeholder:'2' },
      { key:'dg_revisoes',      label:'Rodadas de ajuste por entrega', type:'number', req:true, placeholder:'3' },
      { key:'dg_prazo_conceito',label:'Prazo para conceito (dias úteis)', type:'number', req:true, placeholder:'7' },
      { key:'dg_prazo_feedback',label:'Prazo de feedback do cliente (dias úteis)', type:'number', req:true, placeholder:'3' },
    ],
    financeiro: [
      { key:'dg_valor', label:'Valor total (R$)', type:'text', req:true, placeholder:'R$ 2.500,00' },
      { key:'dg_sinal', label:'Valor do sinal (R$)', type:'text', req:true, placeholder:'R$ 1.250,00' },
      { key:'dg_final', label:'Valor pagamento final (R$)', type:'text', req:true, placeholder:'R$ 1.250,00' },
      { key:'dg_forma', label:'Forma de pagamento', type:'select', req:true, options:['PIX','Transferência bancária','Boleto','Combinado'] },
      { key:'dg_dados', label:'Chave PIX / Dados bancários', type:'text', req:true, placeholder:'CPF, e-mail ou chave', full:true },
    ],
    condicoes: [
      { key:'dg_excl_pct',label:'Adicional exclusividade (%)', type:'number', req:false, placeholder:'20' },
      { key:'dg_cidade',  label:'Cidade do foro', type:'text', req:true, placeholder:'São Paulo – SP' },
    ],
  },
  influencer: {
    marca: [
      { key:'mk_nome',  label:'Razão Social / Nome da marca', type:'text', req:true, placeholder:'Empresa ABC Ltda' },
      { key:'mk_cnpj',  label:'CNPJ / CPF', type:'text', req:true, placeholder:'00.000.000/0001-00' },
      { key:'mk_rep',   label:'Representante', type:'text', req:true, placeholder:'Nome do responsável' },
      { key:'mk_email', label:'E-mail', type:'email', req:true, placeholder:'marketing@empresa.com' },
      { key:'mk_tel',   label:'Telefone', type:'text', req:false, placeholder:'(11) 99999-9999' },
    ],
    influencer: [
      { key:'inf_nome',      label:'Nome / Nome artístico', type:'text', req:true, placeholder:'Seu nome ou @ principal' },
      { key:'inf_cpf',       label:'CPF / CNPJ', type:'text', req:true, placeholder:'000.000.000-00' },
      { key:'inf_email',     label:'E-mail', type:'email', req:true, placeholder:'voce@email.com' },
      { key:'inf_arrobas',   label:'Instagram / TikTok / YouTube', type:'text', req:true, placeholder:'@sua-conta', full:true },
      { key:'inf_seguidores',label:'Número de seguidores', type:'text', req:true, placeholder:'Ex: 125.000' },
    ],
    campanha: [
      { key:'cp_produto',      label:'Produto / serviço a divulgar', type:'text', req:true, placeholder:'Ex: Curso de culinária online', full:true },
      { key:'cp_plataforma',   label:'Plataforma(s)', type:'select', req:true, options:['Instagram','TikTok','YouTube','Twitch','Multi-plataforma'] },
      { key:'cp_formatos',     label:'Formatos de conteúdo', type:'text', req:true, placeholder:'3 Stories + 1 Reels + 1 Feed', full:true },
      { key:'cp_qtd',          label:'Quantidade de publicações', type:'number', req:true, placeholder:'5' },
      { key:'cp_inicio',       label:'Início da campanha', type:'date', req:true },
      { key:'cp_fim',          label:'Fim da campanha', type:'date', req:true },
      { key:'cp_tempo_stories',label:'Tempo mínimo nos Stories (horas)', type:'number', req:false, placeholder:'24' },
      { key:'cp_tempo_feed',   label:'Tempo mínimo no Feed (dias)', type:'number', req:false, placeholder:'90' },
    ],
    conteudo: [
      { key:'cn_mencao',      label:'@Menção ou hashtag obrigatória', type:'text', req:true, placeholder:'@marca ou #hashtag' },
      { key:'cn_link',        label:'Link / código de desconto', type:'text', req:false, placeholder:'linktr.ee/marca ou CODIGO10' },
      { key:'cn_prazo_envio', label:'Prazo de envio para aprovação (dias antes)', type:'number', req:true, placeholder:'3' },
      { key:'cn_prazo_aprov', label:'Prazo da marca para aprovar (dias úteis)', type:'number', req:true, placeholder:'2' },
      { key:'cn_rodadas',     label:'Máx. rodadas de ajuste', type:'number', req:true, placeholder:'2' },
      { key:'cn_excl_prazo',  label:'Não-concorrência após campanha (dias)', type:'number', req:true, placeholder:'30' },
      { key:'cn_excl_cat',    label:'Categoria de não-concorrência', type:'text', req:true, placeholder:'cursos online de gastronomia', full:true },
    ],
    financeiro: [
      { key:'inf_valor',    label:'Valor total da parceria (R$)', type:'text', req:true, placeholder:'R$ 4.500,00' },
      { key:'inf_forma',    label:'Forma de pagamento', type:'select', req:true, options:['PIX','Transferência bancária','Nota Fiscal','Combinado'] },
      { key:'inf_dados',    label:'Chave PIX / Dados bancários', type:'text', req:true, placeholder:'CPF, e-mail ou chave' },
      { key:'inf_data_pag', label:'Data de pagamento', type:'date', req:true },
      { key:'inf_produtos', label:'Produtos/brindes enviados (se houver)', type:'text', req:false, placeholder:'Kit de produtos + R$2.000', full:true },
      { key:'inf_prazo_rel',label:'Prazo relatório de métricas (dias)', type:'number', req:true, placeholder:'7' },
      { key:'inf_cidade',   label:'Cidade do foro', type:'text', req:true, placeholder:'São Paulo – SP' },
    ],
  },
}

const STEP_MAP = {
  servicos:   ['', 'contratante', 'contratado', 'escopo', 'financeiro', 'condicoes', 'preview'],
  software:   ['', 'cliente', 'desenvolvedor', 'projeto', 'milestones', 'pagamento', 'condicoes', 'preview'],
  design:     ['', 'contratante', 'designer', 'escopo', 'financeiro', 'condicoes', 'preview'],
  influencer: ['', 'marca', 'influencer', 'campanha', 'conteudo', 'financeiro', 'preview'],
}

const STEP_LABELS = {
  contratante:  ['Dados do Contratante', 'Quem está contratando o serviço'],
  contratado:   ['Seus Dados', 'O prestador do serviço'],
  escopo:       ['Escopo do Serviço', 'O que será entregue e quando'],
  financeiro:   ['Valores e Pagamento', 'Como e quando você receberá'],
  condicoes:    ['Condições Gerais', 'Rescisão, revisões e foro'],
  cliente:      ['Dados do Cliente', 'Quem está contratando o desenvolvimento'],
  desenvolvedor:['Seus Dados', 'O desenvolvedor ou agência'],
  projeto:      ['Detalhes do Projeto', 'Escopo técnico e funcionalidades'],
  milestones:   ['Fases e Entregas', 'Cronograma e pagamentos por etapa'],
  pagamento:    ['Pagamento', 'Valores totais e forma de pagamento'],
  designer:     ['Seus Dados', 'O designer ou estúdio'],
  marca:        ['Dados da Marca', 'A empresa contratante da campanha'],
  influencer:   ['Seus Dados', 'O influencer ou criador de conteúdo'],
  campanha:     ['Dados da Campanha', 'Plataformas, formatos e cronograma'],
  conteudo:     ['Conteúdo e Aprovação', 'Diretrizes, menções e aprovação'],
  preview:      ['Revisar e Baixar', 'Confirme os dados e gere o PDF'],
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const S = {
  app: { display:'flex', minHeight:'100vh' },
  sidebar: { width:260, minHeight:'100vh', background:'#1A1612', color:'#F7F5F0', padding:'36px 28px', position:'fixed', top:0, left:0, bottom:0, display:'flex', flexDirection:'column', gap:0, overflowY:'auto' },
  sidebarLogo: { fontFamily:'var(--font-display)', fontSize:20, color:'#F7F5F0', marginBottom:6, lineHeight:1.2 },
  sidebarSub: { fontSize:10, color:'#5C5448', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:40 },
  sidebarSecLabel: { fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'#5C5448', marginBottom:10, fontWeight:700 },
  typeBtn: (active) => ({ display:'block', width:'100%', textAlign:'left', background:'none', border:'none', borderLeft:`2px solid ${active ? '#E8A87C' : 'transparent'}`, color: active ? '#F7F5F0' : '#7A7268', fontFamily:'var(--font-body)', fontSize:13, padding:'7px 10px', borderRadius:0, cursor:'pointer', marginBottom:2, transition:'all .15s', background: active ? 'rgba(200,80,42,.12)' : 'none' }),
  stepItem: (state) => ({ display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:12, color: state === 'done' ? '#E8A87C' : state === 'active' ? '#F7F5F0' : '#3A3530', transition:'color .15s' }),
  stepDot: (state) => ({ width:18, height:18, borderRadius:'50%', border:`1.5px solid ${state === 'done' ? '#E8A87C' : state === 'active' ? '#E8A87C' : '#3A3530'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, flexShrink:0, fontWeight:700, background: state === 'done' ? '#E8A87C' : 'none', color: state === 'done' ? '#1A1612' : state === 'active' ? '#E8A87C' : '#3A3530' }),
  main: { marginLeft:260, flex:1, padding:'48px 56px', maxWidth:'calc(100vw - 260px)' },
  progressBar: { height:2, background:'#E2DDD6', borderRadius:1, marginBottom:40, overflow:'hidden' },
  progressFill: (pct) => ({ height:'100%', background:'var(--accent)', borderRadius:1, transition:'width .4s cubic-bezier(.4,0,.2,1)', width:`${pct}%` }),
  pageTitle: { fontFamily:'var(--font-display)', fontSize:34, color:'var(--ink)', lineHeight:1.1, marginBottom:8 },
  pageDesc: { fontSize:14, color:'var(--ink3)', marginBottom:32 },
  card: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:'32px 36px', marginBottom:20 },
  fieldGrid: (cols=2) => ({ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:18 }),
  field: (full) => ({ display:'flex', flexDirection:'column', gap:6, gridColumn: full ? '1 / -1' : undefined }),
  label: { fontSize:11, fontWeight:700, color:'var(--ink2)', letterSpacing:'.04em', textTransform:'uppercase' },
  input: { width:'100%', padding:'10px 14px', border:'1px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-body)', fontSize:14, outline:'none', boxSizing:'border-box' },
  nav: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:32 },
  btnGhost: { padding:'11px 24px', borderRadius:'var(--radius)', border:'1px solid var(--border2)', background:'none', color:'var(--ink2)', fontFamily:'var(--font-body)', fontSize:14, fontWeight:600, cursor:'pointer' },
  btnPrimary: { padding:'11px 28px', borderRadius:'var(--radius)', background:'var(--ink)', color:'#F7F5F0', border:'none', fontFamily:'var(--font-body)', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 },
  btnDownload: { padding:'13px 32px', borderRadius:'var(--radius)', background:'var(--green)', color:'#fff', border:'none', fontFamily:'var(--font-body)', fontSize:15, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 },
  btnAI: { padding:'10px 20px', borderRadius:'var(--radius)', background:'#1D4ED8', color:'#fff', border:'none', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 },
}

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────

function FieldInput({ def, value, onChange }) {
  const base = { ...S.input }
  if (def.type === 'select') {
    return (
      <div style={S.field(def.full)}>
        <label style={S.label}>{def.label}{def.req && <span style={{ color:'var(--accent)', marginLeft:2 }}>*</span>}</label>
        <select value={value||''} onChange={e => onChange(def.key, e.target.value)} style={{ ...base, appearance:'none', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235C5448' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center', paddingRight:36 }}>
          <option value="">Selecione...</option>
          {def.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }
  if (def.type === 'textarea') {
    return (
      <div style={S.field(def.full)}>
        <label style={S.label}>{def.label}{def.req && <span style={{ color:'var(--accent)', marginLeft:2 }}>*</span>}</label>
        <textarea value={value||''} onChange={e => onChange(def.key, e.target.value)} placeholder={def.placeholder} rows={4} style={{ ...base, resize:'vertical', lineHeight:1.6 }} />
      </div>
    )
  }
  return (
    <div style={S.field(def.full)}>
      <label style={S.label}>{def.label}{def.req && <span style={{ color:'var(--accent)', marginLeft:2 }}>*</span>}</label>
      <input type={def.type} value={value||''} onChange={e => onChange(def.key, e.target.value)} placeholder={def.placeholder} style={base} />
    </div>
  )
}

// ─── PAINEL DE CLÁUSULAS IA ───────────────────────────────────────────────────

function PainelClausulas({ clausulas, alertas, sugestoes, loading, onGerar, temDados }) {
  if (loading) {
    return (
      <div style={{ ...S.card, background:'#EFF6FF', border:'1px solid #BFDBFE' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:20, height:20, border:'2px solid #1D4ED8', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'#1E40AF' }}>Claude está gerando suas cláusulas...</div>
            <div style={{ fontSize:12, color:'#3B82F6', marginTop:2 }}>Isso leva alguns segundos</div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!clausulas) {
    return (
      <div style={{ ...S.card, background:'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)', border:'1px solid #BFDBFE' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:'#1E3A8A', marginBottom:4 }}>✨ Cláusulas personalizadas com IA</div>
            <div style={{ fontSize:13, color:'#3B82F6', lineHeight:1.5 }}>
              Gere cláusulas adaptadas especificamente para o seu projeto,<br />com alertas sobre riscos e sugestões de proteção.
            </div>
          </div>
          <button onClick={onGerar} disabled={!temDados} style={{ ...S.btnAI, opacity: temDados ? 1 : .5, cursor: temDados ? 'pointer' : 'not-allowed' }}>
            ✨ Gerar com Claude
          </button>
        </div>
        {!temDados && <div style={{ fontSize:12, color:'#6B7280', marginTop:12 }}>Preencha pelo menos o escopo/descrição do projeto para gerar as cláusulas.</div>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ ...S.card, padding:'24px 28px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)' }}>✨ Cláusulas geradas por IA</div>
          <button onClick={onGerar} style={{ fontSize:12, color:'#3B82F6', background:'none', border:'none', cursor:'pointer', padding:'4px 8px' }}>↻ Regerar</button>
        </div>

        {/* Alertas */}
        {alertas?.length > 0 && (
          <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:4, padding:'12px 16px', marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#C2410C', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>⚠ Alertas identificados</div>
            {alertas.map((a, i) => <div key={i} style={{ fontSize:13, color:'#9A3412', lineHeight:1.6 }}>• {a}</div>)}
          </div>
        )}

        {/* Cláusulas */}
        {[
          ['Objeto do Contrato', clausulas.clausula_objeto],
          ['Obrigações do Contratado', clausulas.clausula_obrigacoes_contratado],
          ['Obrigações do Contratante', clausulas.clausula_obrigacoes_contratante],
          ['Propriedade Intelectual', clausulas.clausula_propriedade_intelectual],
          ['Rescisão', clausulas.clausula_rescisao],
        ].filter(([,v]) => v).map(([titulo, texto]) => (
          <details key={titulo} style={{ borderBottom:'1px solid var(--border)', paddingBottom:12, marginBottom:12 }}>
            <summary style={{ fontSize:13, fontWeight:600, color:'var(--ink)', cursor:'pointer', padding:'4px 0', listStyle:'none', display:'flex', justifyContent:'space-between' }}>
              {titulo} <span style={{ color:'var(--ink3)', fontWeight:400 }}>▾</span>
            </summary>
            <div style={{ fontSize:13, color:'var(--ink2)', lineHeight:1.8, marginTop:10, paddingLeft:12, borderLeft:'2px solid var(--border2)' }}>{texto}</div>
          </details>
        ))}

        {/* Sugestões */}
        {sugestoes?.length > 0 && (
          <div style={{ background:'var(--green-bg)', borderRadius:4, padding:'12px 16px', marginTop:8 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--green)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.04em' }}>💡 Sugestões adicionais</div>
            {sugestoes.map((s, i) => <div key={i} style={{ fontSize:13, color:'#1B4332', lineHeight:1.6 }}>• {s}</div>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PDF BUILDER — VERSÃO JURÍDICA COMPLETA ───────────────────────────────────

function buildPdfHtml(tipo, data, clausulasIA) {
  const v = (key, fb = '___________') => (data[key] && String(data[key]).trim()) ? data[key] : fb
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Cláusulas IA ou padrão
  const IA = clausulasIA || {}
  const aiBadge = clausulasIA ? ' <span style="font-size:7pt;color:#1D4ED8;background:#EFF6FF;padding:1px 5px;border-radius:2px;font-weight:600;vertical-align:middle">IA</span>' : ''

  const css = `
    @page { margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #1A1612;
      line-height: 1.8;
      margin: 0;
      padding: 28mm 22mm 24mm 28mm;
      background: #fff;
    }
    /* CABEÇALHO */
    .doc-header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 2px solid #1A1612;
    }
    .doc-marca {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: #C8502A;
      margin-bottom: 10px;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #1A1612;
      margin: 0 0 4px;
    }
    .doc-subtitle {
      font-size: 9pt;
      color: #6B6358;
      letter-spacing: .04em;
    }
    /* PREÂMBULO */
    .preambulo {
      background: #F7F5F0;
      border-left: 3px solid #C8502A;
      padding: 12px 16px;
      font-size: 10pt;
      line-height: 1.7;
      margin-bottom: 24px;
      color: #3A3530;
    }
    /* PARTES */
    .partes-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: #1A1612;
      margin: 20px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #CEC8BF;
    }
    .parte-bloco {
      margin-bottom: 14px;
      padding: 10px 14px;
      border: 1px solid #E2DDD6;
      border-radius: 2px;
    }
    .parte-bloco p {
      margin: 3px 0;
      font-size: 10.5pt;
    }
    .parte-label {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .1em;
      color: #C8502A;
      display: block;
      margin-bottom: 6px;
    }
    /* SEÇÃO */
    .sec-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .1em;
      color: #fff;
      background: #2C3E50;
      padding: 6px 12px;
      margin: 28px 0 14px;
    }
    /* CLÁUSULAS */
    .clause {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .clause-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #1A1612;
      margin-bottom: 6px;
      font-family: Arial, sans-serif;
    }
    .clause-body {
      font-size: 10.5pt;
      color: #2C2820;
      line-height: 1.85;
      text-align: justify;
    }
    .clause-body p { margin: 0 0 8px; }
    .clause-body .par {
      margin: 6px 0 6px 20px;
      font-size: 10pt;
    }
    /* TABELA DE MARCOS */
    .milestone-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin: 10px 0 14px;
    }
    .milestone-table th {
      background: #2C3E50;
      color: #fff;
      padding: 6px 10px;
      text-align: left;
      font-family: Arial, sans-serif;
      font-size: 8.5pt;
      letter-spacing: .04em;
    }
    .milestone-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #E2DDD6;
    }
    .milestone-table tr:nth-child(even) td { background: #F7F5F0; }
    /* FECHO */
    .fecho {
      margin-top: 28px;
      font-size: 10.5pt;
      color: #2C2820;
      text-align: justify;
      line-height: 1.8;
    }
    /* ASSINATURAS */
    .sig-section { margin-top: 48px; page-break-inside: avoid; }
    .sig-local { font-size: 10pt; color: #6B6358; margin-bottom: 36px; }
    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 32px;
    }
    .sig-box { }
    .sig-line {
      border-top: 1.5px solid #1A1612;
      padding-top: 10px;
      margin-top: 48px;
    }
    .sig-name { font-size: 10.5pt; font-weight: 700; margin-bottom: 2px; }
    .sig-detail { font-size: 9pt; color: #6B6358; line-height: 1.6; }
    .sig-label { font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; color: #C8502A; font-family: Arial, sans-serif; font-weight: 700; margin-bottom: 4px; }
    .testemunhas {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed #CEC8BF;
    }
    .test-title { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; color: #6B6358; margin-bottom: 20px; font-family: Arial, sans-serif; }
    .test-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .test-box .sig-line { margin-top: 36px; }
    /* RODAPÉ */
    .doc-footer {
      margin-top: 32px;
      padding-top: 10px;
      border-top: 1px solid #E2DDD6;
      font-size: 8pt;
      color: #A09890;
      text-align: center;
      font-family: Arial, sans-serif;
    }
  `

  // ─── BLOCO DE ASSINATURAS REUTILIZÁVEL ────────────────────────────────────
  const sigBlock = (parte1, parte2) => `
    <div class="sig-section">
      <div class="fecho">
        <p>E por estarem assim justas e acordadas, as partes assinam o presente instrumento em duas vias de igual teor e forma, juntamente com as testemunhas abaixo, para que produza os devidos efeitos legais.</p>
      </div>
      <div class="sig-local">${v('cidade_foro', v('sw_cidade_foro', v('dg_cidade', v('inf_cidade', '_____________'))))}, ${hoje}</div>
      <div class="sig-grid">
        <div class="sig-box">
          <div class="sig-line">
            <div class="sig-label">Contratante / ${parte1.role}</div>
            <div class="sig-name">${parte1.nome}</div>
            <div class="sig-detail">CPF/CNPJ: ${parte1.doc}</div>
            ${parte1.extra || ''}
          </div>
        </div>
        <div class="sig-box">
          <div class="sig-line">
            <div class="sig-label">Contratado(a) / ${parte2.role}</div>
            <div class="sig-name">${parte2.nome}</div>
            <div class="sig-detail">CPF/CNPJ: ${parte2.doc}</div>
            ${parte2.extra || ''}
          </div>
        </div>
      </div>
      <div class="testemunhas">
        <div class="test-title">Testemunhas (facultativo, recomendado para maior validade probatória)</div>
        <div class="test-grid">
          <div class="test-box">
            <div class="sig-line">
              <div class="sig-detail">Nome: ________________________________________</div>
              <div class="sig-detail">CPF: _______________________</div>
            </div>
          </div>
          <div class="test-box">
            <div class="sig-line">
              <div class="sig-detail">Nome: ________________________________________</div>
              <div class="sig-detail">CPF: _______________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="doc-footer">Documento gerado por TRACT · ${hoje} · Este contrato é regido pela legislação brasileira, em especial pelo Código Civil (Lei nº 10.406/2002) e demais normas aplicáveis.</div>
  `

  // ─── TEMPLATE: PRESTAÇÃO DE SERVIÇOS ──────────────────────────────────────
  const tmplServicos = () => `
    <div class="doc-header">
      <div class="doc-marca">TRACT · Gerador de Contratos</div>
      <div class="doc-title">Contrato de Prestação de Serviços</div>
      <div class="doc-subtitle">Instrumento Particular de Prestação de Serviços Autônomos</div>
    </div>

    <div class="preambulo">
      Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas e condições seguintes, em conformidade com os artigos 593 a 609 do Código Civil Brasileiro (Lei nº 10.406/2002).
    </div>

    <div class="sec-title">I — Qualificação das Partes</div>

    <div class="partes-title">Contratante</div>
    <div class="parte-bloco">
      <span class="parte-label">Quem contrata o serviço</span>
      <p><strong>Nome / Razão Social:</strong> ${v('cont_nome')}</p>
      <p><strong>CPF / CNPJ:</strong> ${v('cont_cpf')}</p>
      <p><strong>Endereço:</strong> ${v('cont_endereco')}</p>
      <p><strong>E-mail:</strong> ${v('cont_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('cont_telefone')}</p>
    </div>

    <div class="partes-title">Contratado(a)</div>
    <div class="parte-bloco">
      <span class="parte-label">Prestador do serviço</span>
      <p><strong>Nome / Razão Social:</strong> ${v('tado_nome')}</p>
      <p><strong>CPF / CNPJ:</strong> ${v('tado_cpf')}</p>
      <p><strong>Endereço:</strong> ${v('tado_endereco')}</p>
      <p><strong>E-mail:</strong> ${v('tado_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('tado_telefone')}</p>
    </div>

    <div class="sec-title">II — Cláusulas e Condições</div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 1ª – DO OBJETO DO CONTRATO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_objeto || `<p>O presente contrato tem por objeto a prestação, pelo CONTRATADO ao CONTRATANTE, dos seguintes serviços: <strong>${v('descricao')}</strong>.</p><p>Os serviços serão executados na modalidade <strong>${v('modalidade')}</strong>, conforme acordado entre as partes, observando-se os padrões técnicos e de qualidade inerentes à atividade.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 2ª – DO PRAZO DE EXECUÇÃO</div>
      <div class="clause-body">
        <p>Os serviços terão início em <strong>${v('data_inicio')}</strong> e deverão ser concluídos até <strong>${v('data_fim')}</strong>, salvo motivo de força maior, caso fortuito ou atraso imputável ao CONTRATANTE no fornecimento de materiais e informações necessários à execução.</p>
        <p>Estão incluídas no presente contrato <strong>${v('num_revisoes')}</strong> rodadas de revisão sobre as entregas realizadas. Revisões adicionais, caso solicitadas, serão orçadas separadamente e formalizadas por escrito. Os arquivos finais serão entregues nos seguintes formatos: ${v('formatos_entrega')}.</p>
        ${v('cronograma') !== '___________' ? `<p>O cronograma de entregas parciais acordado é o seguinte: ${v('cronograma')}.</p>` : ''}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 3ª – DO VALOR E DA FORMA DE PAGAMENTO</div>
      <div class="clause-body">
        <p>Pela prestação dos serviços ora contratados, o CONTRATANTE pagará ao CONTRATADO o valor total de <strong>${v('valor_total')}</strong>, nas condições a seguir: ${v('data_vencimento')}.</p>
        <p>O pagamento será realizado mediante <strong>${v('forma_pagamento')}</strong>, utilizando os seguintes dados: ${v('dados_bancarios')}. O primeiro pagamento deverá ocorrer até <strong>${v('data_primeiro_pag')}</strong>, sendo esta condição essencial para o início da execução dos serviços.</p>
        <p>O inadimplemento de qualquer parcela acarretará a incidência de multa moratória de 2% (dois por cento) sobre o valor em atraso, acrescida de juros de mora de 1% (um por cento) ao mês, calculados pro rata die, sem prejuízo da possibilidade de suspensão dos serviços até regularização do débito, nos termos do art. 476 do Código Civil.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 4ª – DAS OBRIGAÇÕES DO CONTRATADO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_obrigacoes_contratado || `<p>São obrigações do CONTRATADO: (a) executar os serviços descritos na Cláusula 1ª com zelo, diligência e qualidade técnica compatíveis com a atividade profissional; (b) cumprir rigorosamente os prazos estipulados, comunicando imediatamente qualquer impedimento; (c) manter sigilo absoluto sobre todas as informações, dados e documentos do CONTRATANTE obtidos durante a execução do contrato, obrigação esta que persiste após o término do vínculo; (d) não subcontratar total ou parcialmente os serviços sem autorização prévia e escrita do CONTRATANTE; (e) realizar as revisões contratadas e entregar os arquivos nos formatos acordados.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 5ª – DAS OBRIGAÇÕES DO CONTRATANTE${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_obrigacoes_contratante || `<p>São obrigações do CONTRATANTE: (a) efetuar os pagamentos nas datas e condições acordadas; (b) fornecer ao CONTRATADO, no prazo de até <strong>${v('prazo_retorno')}</strong> dias após a solicitação, todos os materiais, informações, acessos e subsídios necessários à execução dos serviços; (c) revisar e aprovar ou solicitar alterações nas entregas parciais em até <strong>${v('prazo_aprovacao')}</strong> dias úteis, sendo que a ausência de manifestação nesse prazo implicará aprovação tácita; (d) abster-se de solicitar serviços fora do escopo contratado sem a formalização de aditivo.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 6ª – DA PROPRIEDADE INTELECTUAL${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_propriedade_intelectual || `<p>Os direitos patrimoniais de autor sobre os trabalhos desenvolvidos especificamente para o CONTRATANTE serão a ele cedidos após a quitação integral de todos os valores contratados, nos termos da Lei nº 9.610/1998. Enquanto houver pendência financeira, o CONTRATADO reserva-se o direito de reter os arquivos definitivos.</p><p>O CONTRATADO mantém o direito moral de autoria, irrenunciável por força de lei, bem como o direito de utilizar os trabalhos realizados em seu portfólio profissional, salvo expressa proibição formalizada em cláusula adicional específica. Ferramentas, metodologias e conhecimentos pré-existentes do CONTRATADO permanecem de sua propriedade exclusiva.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 7ª – DA RESCISÃO CONTRATUAL${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_rescisao || `<p>O presente contrato poderá ser rescindido por qualquer das partes mediante comunicação escrita com antecedência mínima de <strong>${v('prazo_aviso')}</strong> dias. Em caso de rescisão unilateral sem justa causa por parte do CONTRATANTE após o início da execução dos serviços, ficará devida ao CONTRATADO multa equivalente a <strong>${v('multa_rescisao')}%</strong> sobre o valor total do contrato, além do pagamento proporcional pelos serviços já prestados.</p><p>Em caso de rescisão por parte do CONTRATADO sem justa causa, este deverá restituir, proporcionalmente, os valores recebidos referentes a serviços não realizados, descontados os custos já incorridos devidamente comprovados.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 8ª – DA AUSÊNCIA DE VÍNCULO EMPREGATÍCIO</div>
      <div class="clause-body">
        <p>O presente contrato não estabelece qualquer relação de emprego ou vínculo empregatício entre as partes, sendo o CONTRATADO profissional autônomo, integralmente responsável pelo recolhimento de seus próprios encargos tributários, previdenciários e fiscais decorrentes da prestação dos serviços aqui contratados, incluindo, mas não se limitando a: ISS, INSS e Imposto de Renda. Não haverá qualquer responsabilidade trabalhista ou previdenciária por parte do CONTRATANTE, nos termos do art. 593 do Código Civil.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 9ª – DAS DISPOSIÇÕES GERAIS E DO FORO</div>
      <div class="clause-body">
        <p>O presente instrumento constitui o acordo integral entre as partes sobre o objeto aqui tratado, prevalecendo sobre quaisquer negociações, propostas ou entendimentos anteriores, verbais ou escritos. Eventuais alterações somente produzirão efeitos se formalizadas por escrito e assinadas por ambas as partes.</p>
        <p>As partes elegem o foro da Comarca de <strong>${v('cidade_foro')}</strong> para dirimir quaisquer dúvidas, litígios ou controvérsias oriundas do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja, nos termos do art. 63 do Código de Processo Civil.</p>
      </div>
    </div>

    ${sigBlock(
      { role: 'Contratante', nome: v('cont_nome'), doc: v('cont_cpf') },
      { role: 'Prestador de Serviços', nome: v('tado_nome'), doc: v('tado_cpf') }
    )}
  `

  // ─── TEMPLATE: DESENVOLVIMENTO DE SOFTWARE ────────────────────────────────
  const tmplSoftware = () => `
    <div class="doc-header">
      <div class="doc-marca">TRACT · Gerador de Contratos</div>
      <div class="doc-title">Contrato de Desenvolvimento de Software</div>
      <div class="doc-subtitle">Instrumento Particular de Desenvolvimento e Entrega de Produto Digital</div>
    </div>

    <div class="preambulo">
      Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Desenvolvimento de Software, regido pela Lei nº 10.406/2002 (Código Civil), Lei nº 9.609/1998 (Software) e Lei nº 9.610/1998 (Direitos Autorais), vinculando as partes e seus sucessores.
    </div>

    <div class="sec-title">I — Qualificação das Partes</div>

    <div class="partes-title">Cliente (Contratante)</div>
    <div class="parte-bloco">
      <span class="parte-label">Quem contrata o desenvolvimento</span>
      <p><strong>Nome / Razão Social:</strong> ${v('cli_nome')}</p>
      <p><strong>CPF / CNPJ:</strong> ${v('cli_cpf')}</p>
      <p><strong>Representante Legal:</strong> ${v('cli_rep')}</p>
      <p><strong>E-mail:</strong> ${v('cli_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('cli_tel')}</p>
    </div>

    <div class="partes-title">Desenvolvedor(a) / Empresa (Contratado)</div>
    <div class="parte-bloco">
      <span class="parte-label">Quem executa o desenvolvimento</span>
      <p><strong>Nome / Razão Social:</strong> ${v('dev_nome')}</p>
      <p><strong>CPF / CNPJ:</strong> ${v('dev_cpf')}</p>
      <p><strong>E-mail:</strong> ${v('dev_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('dev_tel')}</p>
    </div>

    <div class="sec-title">II — Objeto e Especificações do Projeto</div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 1ª – DO OBJETO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_objeto || `<p>O presente contrato tem por objeto o desenvolvimento do seguinte produto digital: <strong>${v('proj_nome')}</strong>, classificado como <strong>${v('proj_tipo')}</strong>, destinado às plataformas <strong>${v('proj_plataformas')}</strong>, utilizando a stack tecnológica: ${v('proj_stack')}.</p><p>O escopo funcional do projeto compreende: ${v('proj_escopo')}. Qualquer funcionalidade não expressamente descrita acima está fora do escopo e será desenvolvida somente mediante aditivo contratual e pagamento adicional.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 2ª – DAS FASES, ENTREGAS E MARCOS</div>
      <div class="clause-body">
        <p>O desenvolvimento será organizado em fases, conforme cronograma abaixo. Cada fase será iniciada após aprovação formal da fase anterior e quitação da parcela correspondente:</p>
        <table class="milestone-table">
          <thead><tr><th>Fase</th><th>Entregável</th><th>Prazo</th><th>Valor</th></tr></thead>
          <tbody>
            ${['1','2','3'].map(n => data[`ms${n}_fase`] ? `<tr><td><strong>${data[`ms${n}_fase`]}</strong></td><td>${v(`ms${n}_entrega`)}</td><td>${v(`ms${n}_prazo`)}</td><td>${v(`ms${n}_valor`)}</td></tr>` : '').join('')}
          </tbody>
        </table>
        <p>O CONTRATANTE terá acesso a ambiente de homologação (staging) para validação de cada entrega. A aprovação deverá ser formalizada por e-mail em até <strong>${v('sw_prazo_aceite')}</strong> dias úteis. Decorrido esse prazo sem manifestação, a entrega será considerada tacitamente aceita e a próxima fase será iniciada.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 3ª – DO VALOR E FORMA DE PAGAMENTO</div>
      <div class="clause-body">
        <p>O valor total contratado é de <strong>${v('sw_valor_total')}</strong>, pago conforme o cronograma de fases acima. A título de sinal, correspondente a <strong>${v('sw_pct_entrada')}%</strong> do valor total (<strong>${v('sw_valor_entrada')}</strong>), deverá ser pago antes do início do desenvolvimento, sendo condição suspensiva para o início dos trabalhos. O pagamento final, equivalente a <strong>${v('sw_pct_final')}%</strong> (<strong>${v('sw_valor_final')}</strong>), será devido na entrega definitiva.</p>
        <p>Os pagamentos serão realizados por <strong>${v('sw_forma_pag')}</strong>, nos seguintes dados: ${v('sw_dados_banco')}. O atraso superior a 15 (quinze) dias corridos no pagamento de qualquer parcela autoriza o CONTRATADO a suspender o desenvolvimento, sem que isso configure inadimplemento de sua parte, até a regularização do débito acrescido de multa de 2% e juros de 1% ao mês.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 4ª – DO CONTROLE DE MUDANÇAS DE ESCOPO</div>
      <div class="clause-body">
        <p>Qualquer alteração no escopo original — incluindo novas funcionalidades, modificações substanciais nas já previstas ou mudanças na stack tecnológica — deverá ser formalizada mediante Pedido de Mudança (Change Request) assinado por ambas as partes, contendo: descrição detalhada da alteração, impacto estimado no prazo de entrega e custo adicional correspondente. Nenhuma alteração de escopo será implementada sem aprovação formal, e o CONTRATADO não poderá ser responsabilizado por atrasos decorrentes de solicitações de mudança não formalizadas.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 5ª – DA PROPRIEDADE INTELECTUAL E LICENCIAMENTO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_propriedade_intelectual || `<p>Após a quitação integral de todos os valores contratados, o CONTRATANTE receberá a cessão plena dos direitos patrimoniais sobre o código-fonte desenvolvido especificamente para este projeto, incluindo documentação técnica e acesso a todos os repositórios, nos termos da Lei nº 9.609/1998.</p><p>Bibliotecas, frameworks, componentes de terceiros e módulos open-source utilizados permanecem sujeitos às suas respectivas licenças, sendo de responsabilidade do CONTRATANTE verificar a adequação dessas licenças ao uso comercial pretendido. O CONTRATADO reserva o direito de reutilizar componentes genéricos e módulos não específicos deste projeto em outros trabalhos.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 6ª – DA GARANTIA TÉCNICA</div>
      <div class="clause-body">
        <p>Após o aceite formal da entrega final, o CONTRATADO oferece garantia técnica de <strong>${v('sw_garantia')}</strong> dias para correção, sem custo adicional, de bugs e falhas funcionais identificados nas funcionalidades desenvolvidas conforme o escopo contratado. Não estão cobertos pela garantia: (a) problemas causados por alterações realizadas pelo CONTRATANTE ou terceiros após a entrega; (b) incompatibilidades com atualizações de sistemas, navegadores ou plataformas lançadas após a entrega definitiva; (c) novas funcionalidades solicitadas após o encerramento do contrato.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 7ª – DA CONFIDENCIALIDADE</div>
      <div class="clause-body">
        <p>Ambas as partes obrigam-se a manter sigilo absoluto sobre todas as informações confidenciais trocadas durante a execução deste contrato — incluindo dados de negócio, estratégias comerciais, dados de clientes e código-fonte — pelo período de <strong>${v('sw_nda_anos')}</strong> anos após o encerramento do vínculo contratual, sob pena de responsabilização civil e criminal. Esta obrigação persiste independentemente da causa de término do contrato.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 8ª – DA RESCISÃO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_rescisao || `<p>Em caso de rescisão unilateral pelo CONTRATANTE antes da conclusão do projeto, serão devidos ao CONTRATADO todos os valores referentes às fases já concluídas e entregues, acrescidos de indenização de 20% sobre o valor remanescente não executado. Em caso de rescisão pelo CONTRATADO sem justa causa, este deverá restituir os valores pagos relativos a etapas não entregues, descontadas as despesas já incorridas e devidamente comprovadas.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 9ª – DISPOSIÇÕES GERAIS E FORO</div>
      <div class="clause-body">
        <p>Custos de infraestrutura, hospedagem, domínios, APIs de terceiros e demais serviços externos necessários à operação em produção não estão incluídos neste contrato e são de responsabilidade exclusiva do CONTRATANTE. As partes elegem o foro da Comarca de <strong>${v('sw_cidade_foro')}</strong> para dirimir eventuais controvérsias, com renúncia a qualquer outro.</p>
      </div>
    </div>

    ${sigBlock(
      { role: 'Cliente', nome: v('cli_nome'), doc: v('cli_cpf'), extra: v('cli_rep') !== '___________' ? `<div class="sig-detail">Representante: ${v('cli_rep')}</div>` : '' },
      { role: 'Desenvolvedor(a)', nome: v('dev_nome'), doc: v('dev_cpf') }
    )}
  `

  // ─── TEMPLATE: DESIGN / CRIATIVO ──────────────────────────────────────────
  const tmplDesign = () => `
    <div class="doc-header">
      <div class="doc-marca">TRACT · Gerador de Contratos</div>
      <div class="doc-title">Contrato de Prestação de Serviços de Design</div>
      <div class="doc-subtitle">Identidade Visual · UI/UX · Branding · Criação Gráfica</div>
    </div>

    <div class="preambulo">
      Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços de Design, regido pelo Código Civil Brasileiro e pela Lei nº 9.610/1998 (Direitos Autorais), obrigando-se mutuamente às condições a seguir estabelecidas.
    </div>

    <div class="sec-title">I — Qualificação das Partes</div>

    <div class="partes-title">Contratante</div>
    <div class="parte-bloco">
      <span class="parte-label">Quem contrata os serviços de design</span>
      <p><strong>Nome / Empresa:</strong> ${v('dc_nome')}</p>
      <p><strong>CPF / CNPJ:</strong> ${v('dc_cpf')}</p>
      <p><strong>E-mail:</strong> ${v('dc_email')} &nbsp;&nbsp; <strong>Instagram / Site:</strong> ${v('dc_redes')}</p>
    </div>

    <div class="partes-title">Designer / Estúdio (Contratado)</div>
    <div class="parte-bloco">
      <span class="parte-label">Quem executa os serviços criativos</span>
      <p><strong>Nome / Estúdio:</strong> ${v('ds_nome')}</p>
      <p><strong>CPF / CNPJ:</strong> ${v('ds_cpf')}</p>
      <p><strong>E-mail:</strong> ${v('ds_email')} &nbsp;&nbsp; <strong>Portfólio:</strong> ${v('ds_portfolio')}</p>
    </div>

    <div class="sec-title">II — Escopo e Condições do Projeto</div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 1ª – DO OBJETO E ESCOPO CRIATIVO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_objeto || `<p>O presente contrato tem por objeto o desenvolvimento de <strong>${v('dg_tipo')}</strong> pelo CONTRATADO ao CONTRATANTE, compreendendo as seguintes entregas: <strong>${v('dg_entregas')}</strong>.</p><p>Os arquivos serão entregues nos formatos: <strong>${v('dg_formatos')}</strong>. O projeto contempla <strong>${v('dg_opcoes')}</strong> opções de conceito inicial, <strong>${v('dg_versoes')}</strong> versões completas e <strong>${v('dg_revisoes')}</strong> rodadas de ajuste por entrega. Entende-se por "revisão" pequenos ajustes de cor, texto ou posicionamento; alterações conceituais significativas após aprovação de uma direção serão tratadas como novo escopo e cobradas separadamente.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 2ª – DO PROCESSO CRIATIVO E PRAZOS</div>
      <div class="clause-body">
        <p>O projeto será conduzido nas seguintes etapas: (1) preenchimento de briefing pelo CONTRATANTE; (2) apresentação de opções de conceito inicial em até <strong>${v('dg_prazo_conceito')}</strong> dias úteis após recebimento de todos os materiais; (3) escolha de uma direção pelo CONTRATANTE e desenvolvimento completo; (4) apresentação da versão final para aprovação; (5) rodadas de ajuste conforme contratado; (6) entrega dos arquivos finais após quitação integral.</p>
        <p>O CONTRATANTE compromete-se a fornecer feedback claro e objetivo em até <strong>${v('dg_prazo_feedback')}</strong> dias úteis após cada apresentação. Atrasos no retorno do CONTRATANTE impactarão diretamente nos prazos de entrega, sem que isso implique responsabilidade ou inadimplemento por parte do CONTRATADO.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 3ª – DO VALOR E FORMA DE PAGAMENTO</div>
      <div class="clause-body">
        <p>O valor total pelos serviços contratados é de <strong>${v('dg_valor')}</strong>, pago em duas parcelas: sinal de 50% (<strong>${v('dg_sinal')}</strong>) no início do projeto, antes do início de qualquer trabalho, e o saldo final de 50% (<strong>${v('dg_final')}</strong>) na entrega dos arquivos definitivos. O pagamento será realizado por <strong>${v('dg_forma')}</strong>, nos seguintes dados: ${v('dg_dados')}.</p>
        <p>Os arquivos finais editáveis (incluindo .AI, .PSD, .Figma e outros formatos-fonte) serão entregues somente após a confirmação do pagamento integral. Durante o processo criativo, são compartilhados apenas arquivos em baixa resolução ou formatos não editáveis, para fins de aprovação. O atraso no pagamento implicará nas mesmas penalidades previstas no art. 395 do Código Civil.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 4ª – DOS DIREITOS AUTORAIS E USO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_propriedade_intelectual || `<p>Após a quitação integral dos valores contratados, os direitos patrimoniais sobre as criações desenvolvidas especificamente para o CONTRATANTE neste projeto são a ele cedidos para uso comercial irrestrito no território nacional, nos termos da Lei nº 9.610/1998.</p><p>O CONTRATADO mantém, em caráter irrenunciável nos termos da lei, o direito moral de autoria sobre as obras criadas, bem como o direito de apresentar os trabalhos realizados em seu portfólio, site e redes sociais profissionais, salvo proibição expressa formalizada em cláusula adicional específica. Fontes tipográficas, bancos de imagem e elementos de terceiros utilizados estão sujeitos às licenças de seus respectivos detentores, sendo responsabilidade do CONTRATANTE verificar e adquirir as licenças adequadas ao uso comercial pretendido.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 5ª – DA RESCISÃO E REEMBOLSOS${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_rescisao || `<p>Em caso de cancelamento pelo CONTRATANTE: (a) antes da apresentação do conceito inicial, será reembolsado 70% do sinal pago, retendo-se 30% a título de ressarcimento por horas de pesquisa e planejamento já realizadas; (b) após a apresentação do conceito e antes da entrega final, o sinal pago não será reembolsado, e o material produzido até o momento de cancelamento permanecerá de propriedade do CONTRATADO.</p><p>Em caso de cancelamento pelo CONTRATADO sem justa causa após o início dos trabalhos, este reembolsará integralmente o sinal recebido, acrescido de 10% do valor total do contrato a título de multa compensatória.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 6ª – DISPOSIÇÕES GERAIS E FORO</div>
      <div class="clause-body">
        <p>O CONTRATANTE declara que todos os materiais, textos, logotipos e referências fornecidos ao CONTRATADO são de sua propriedade ou de uso devidamente autorizado, eximindo o CONTRATADO de qualquer responsabilidade perante terceiros decorrente de materiais fornecidos pelo CONTRATANTE. As partes elegem o foro da Comarca de <strong>${v('dg_cidade')}</strong> para dirimir eventuais litígios, renunciando a qualquer outro.</p>
      </div>
    </div>

    ${sigBlock(
      { role: 'Contratante', nome: v('dc_nome'), doc: v('dc_cpf') },
      { role: 'Designer / Estúdio', nome: v('ds_nome'), doc: v('ds_cpf') }
    )}
  `

  // ─── TEMPLATE: INFLUENCER MARKETING ───────────────────────────────────────
  const tmplInfluencer = () => `
    <div class="doc-header">
      <div class="doc-marca">TRACT · Gerador de Contratos</div>
      <div class="doc-title">Contrato de Influencer Marketing</div>
      <div class="doc-subtitle">Instrumento Particular de Parceria Comercial para Divulgação Paga</div>
    </div>

    <div class="preambulo">
      Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Influencer Marketing, em conformidade com o Código Civil Brasileiro, as diretrizes do CONAR, a Resolução nº 163/2021 do CONANDA e demais normas aplicáveis à publicidade e ao marketing digital no Brasil.
    </div>

    <div class="sec-title">I — Qualificação das Partes</div>

    <div class="partes-title">Marca / Empresa (Contratante)</div>
    <div class="parte-bloco">
      <span class="parte-label">Empresa que contrata a divulgação</span>
      <p><strong>Razão Social / Nome:</strong> ${v('mk_nome')}</p>
      <p><strong>CNPJ / CPF:</strong> ${v('mk_cnpj')}</p>
      <p><strong>Representante Legal:</strong> ${v('mk_rep')}</p>
      <p><strong>E-mail:</strong> ${v('mk_email')} &nbsp;&nbsp; <strong>Telefone:</strong> ${v('mk_tel')}</p>
    </div>

    <div class="partes-title">Influenciador(a) / Criador(a) de Conteúdo (Contratado)</div>
    <div class="parte-bloco">
      <span class="parte-label">Criador(a) que realizará a divulgação</span>
      <p><strong>Nome / Nome Artístico:</strong> ${v('inf_nome')}</p>
      <p><strong>CPF / CNPJ:</strong> ${v('inf_cpf')}</p>
      <p><strong>E-mail:</strong> ${v('inf_email')}</p>
      <p><strong>Perfis:</strong> ${v('inf_arrobas')} &nbsp;&nbsp; <strong>Seguidores na data:</strong> ${v('inf_seguidores')}</p>
    </div>

    <div class="sec-title">II — Objeto e Escopo da Campanha</div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 1ª – DO OBJETO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_objeto || `<p>O presente contrato tem por objeto a divulgação paga, pelo CONTRATADO, do seguinte produto ou serviço: <strong>${v('cp_produto')}</strong>, de titularidade da CONTRATANTE, nas plataformas digitais especificadas, mediante os formatos e condições estabelecidas neste instrumento.</p><p>Serão realizadas <strong>${v('cp_qtd')}</strong> publicações, nos formatos: <strong>${v('cp_formatos')}</strong>, na plataforma <strong>${v('cp_plataforma')}</strong>, no período compreendido entre <strong>${v('cp_inicio')}</strong> e <strong>${v('cp_fim')}</strong>. As publicações deverão permanecer no ar pelo período mínimo de ${v('cp_tempo_stories', 'não especificado')} horas nos Stories e ${v('cp_tempo_feed', 'não especificado')} dias no Feed.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 2ª – DAS DIRETRIZES DE CONTEÚDO E CONFORMIDADE LEGAL</div>
      <div class="clause-body">
        <p>Todo o conteúdo publicado deverá identificar de forma clara, explícita e destacada o seu caráter publicitário, mediante o uso obrigatório das marcações <strong>#publi</strong>, <strong>#parceria</strong>, <strong>#ad</strong> ou da expressão "conteúdo patrocinado", em conformidade com as normas do CONAR e da Resolução nº 163/2021 do CONANDA, quando aplicável. O descumprimento desta obrigação é de exclusiva responsabilidade do CONTRATADO.</p>
        <p>As publicações deverão incluir obrigatoriamente a menção: <strong>${v('cn_mencao')}</strong>${data.cn_link ? `, bem como o link ou código: <strong>${data.cn_link}</strong>` : ''}. O CONTRATADO terá liberdade criativa para adaptar o conteúdo ao seu estilo e linguagem, desde que respeitadas as diretrizes de marca da CONTRATANTE constantes no briefing fornecido.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 3ª – DO PROCESSO DE APROVAÇÃO DE CONTEÚDO</div>
      <div class="clause-body">
        <p>O CONTRATADO deverá enviar o conteúdo para aprovação da CONTRATANTE com antecedência mínima de <strong>${v('cn_prazo_envio')}</strong> dias úteis em relação à data prevista de publicação. A CONTRATANTE terá até <strong>${v('cn_prazo_aprov')}</strong> dias úteis para aprovar ou solicitar ajustes, sendo permitidas até <strong>${v('cn_rodadas')}</strong> rodadas de alteração sem custo adicional. Decorrido o prazo sem manifestação, o conteúdo será considerado tacitamente aprovado. O CONTRATADO não se responsabiliza por atrasos nas publicações causados por demora na aprovação pela CONTRATANTE.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 4ª – DO VALOR E FORMA DE PAGAMENTO</div>
      <div class="clause-body">
        <p>Pela execução da campanha, a CONTRATANTE pagará ao CONTRATADO o valor total de <strong>${v('inf_valor')}</strong>, mediante <strong>${v('inf_forma')}</strong>, até a data de <strong>${v('inf_data_pag')}</strong>, nos seguintes dados: ${v('inf_dados')}.${data.inf_produtos ? ` Além da remuneração em dinheiro, a CONTRATANTE fornecerá ao CONTRATADO: ${data.inf_produtos}.` : ''}</p>
        <p>O atraso no pagamento superior a 10 (dez) dias corridos autoriza o CONTRATADO a excluir os conteúdos publicados e rescindir o contrato sem penalidades, sem prejuízo da cobrança dos valores devidos acrescidos de multa de 2% e juros de 1% ao mês. Após o encerramento da campanha, o CONTRATADO deverá enviar à CONTRATANTE um relatório de métricas (alcance, impressões, engajamento) em até <strong>${v('inf_prazo_rel')}</strong> dias.</p>
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 5ª – DOS DIREITOS DE USO DO CONTEÚDO${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_propriedade_intelectual || `<p>A CONTRATANTE poderá fazer repost do conteúdo publicado em seus perfis oficiais, desde que mantida a identificação do CONTRATADO como autor. O uso do conteúdo em anúncios pagos (dark posts, boosting) ou materiais offline requer autorização específica adicional e poderá implicar remuneração suplementar a ser negociada entre as partes. Qualquer uso não previsto neste contrato deverá ser formalizado por escrito.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 6ª – DA NÃO-CONCORRÊNCIA${aiBadge}</div>
      <div class="clause-body">
        ${IA.clausula_rescisao || `<p>Durante o período da campanha e por <strong>${v('cn_excl_prazo')}</strong> dias após seu término, o CONTRATADO compromete-se a não divulgar, a qualquer título — inclusive de forma espontânea ou orgânica — produtos ou serviços que concorram diretamente com os da CONTRATANTE na categoria: <strong>${v('cn_excl_cat')}</strong>. O descumprimento desta cláusula implicará multa equivalente a 100% (cem por cento) do valor total do contrato, além de perdas e danos eventualmente apurados.</p>`}
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">CLÁUSULA 7ª – DAS RESPONSABILIDADES E FORO</div>
      <div class="clause-body">
        <p>O CONTRATADO é responsável pelo conteúdo publicado e por garantir que não viola direitos de imagem, musicais ou de propriedade intelectual de terceiros. A CONTRATANTE é responsável pela veracidade das informações sobre o produto ou serviço divulgado; reclamações de consumidores relacionadas ao produto são de sua exclusiva responsabilidade. As partes elegem o foro da Comarca de <strong>${v('inf_cidade')}</strong> para dirimir eventuais litígios.</p>
      </div>
    </div>

    ${sigBlock(
      { role: 'Marca / Empresa', nome: v('mk_nome'), doc: v('mk_cnpj'), extra: `<div class="sig-detail">Representante: ${v('mk_rep')}</div>` },
      { role: 'Influenciador(a)', nome: v('inf_nome'), doc: v('inf_cpf') }
    )}
  `

  const templates = {
    servicos:   tmplServicos(),
    software:   tmplSoftware(),
    design:     tmplDesign(),
    influencer: tmplInfluencer(),
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>${templates[tipo] || '<p>Tipo de contrato não reconhecido.</p>'}</body>
</html>`
}

// ─── GERADOR PRINCIPAL ────────────────────────────────────────────────────────

export default function Gerador() {
  const navigate = useNavigate()
  const { salvarContrato } = useContratos()

  // Lê sessão uma vez — sem useEffect, sem redirect automático
  // A proteção de rota fica na Landing (quem não está logado não chega aqui)
  const sessao  = lerSessao()
  const admin   = sessao?.plano === 'admin'
  const premium = ['mensal','vitalicio','admin'].includes(sessao?.plano)
  const limite  = verificarLimiteFree()

  // Tipo inicial — pode vir do Perfil ou Landing via sessionStorage
  const [tipo, setTipo] = useState(() => {
    try {
      const t = sessionStorage.getItem('tract_tipo_inicial')
      if (t && ['servicos','software','design','influencer'].includes(t)) {
        sessionStorage.removeItem('tract_tipo_inicial')
        return t
      }
    } catch {}
    return 'servicos'
  })

  const [step, setStep] = useState(() => {
    try {
      const t = sessionStorage.getItem('tract_tipo_inicial')
      return (t && t !== 'servicos') ? 1 : 0
    } catch { return 0 }
  })

  const [data, setData] = useState({})
  const [clausulas, setClausulas] = useState(null)
  const [alertas, setAlertas] = useState(null)
  const [sugestoes, setSugestoes] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const pdfRef = useRef(null)

  // Detecta resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Carrega contrato salvo vindo do perfil
  useEffect(() => {
    const salvo = sessionStorage.getItem('tract_carregar_contrato')
    if (salvo) {
      try {
        const contrato = JSON.parse(salvo)
        setTipo(contrato.tipo || 'servicos')
        setData(contrato.data || {})
        setClausulas(contrato.clausulasIA || null)
        setStep(STEPS[contrato.tipo || 'servicos'].length - 1)
        sessionStorage.removeItem('tract_carregar_contrato')
      } catch {}
    }
  }, [])

  const steps = STEPS[tipo]
  const stepMap = STEP_MAP[tipo]
  const fields = FIELDS[tipo]
  const isPreview = step === steps.length - 1
  const progress = Math.round((step / (steps.length - 1)) * 100)

  const handleChange = useCallback((key, value) => {
    setData(d => ({ ...d, [key]: value }))
  }, [])

  const handleTipoChange = (newTipo) => {
    setTipo(newTipo)
    setStep(1)
    setData({})
    setClausulas(null)
    setAlertas(null)
  }

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // Verifica se tem dados suficientes para gerar cláusulas
  const temDados = Object.values(data).filter(Boolean).length >= 4

  const gerarClausulas = async () => {
    setLoadingAI(true)
    setClausulas(null)
    try {
      const res = await fetch('/api/gerar-clausulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, dados: data }),
      })
      const json = await res.json()
      if (json.success && json.clausulas) {
        setClausulas(json.clausulas)
        setAlertas(json.clausulas.alertas || [])
        setSugestoes(json.clausulas.sugestoes || [])
        showToast('✨ Cláusulas geradas com sucesso!')
      } else {
        showToast(json.error || 'Erro ao gerar cláusulas', false)
      }
    } catch {
      showToast('Erro de conexão com a API', false)
    } finally {
      setLoadingAI(false)
    }
  }

  const handleDownload = () => {
    // Verifica limite free
    if (!premium && !admin) {
      const lim = verificarLimiteFree()
      if (!lim.permitido) {
        showToast('Limite de 2 contratos/mês atingido. Faça upgrade para continuar.', false)
        return
      }
    }

    setGenerating(true)
    try {
      const html      = buildPdfHtml(tipo, data, clausulas)
      const tipoLabel = TIPOS.find(t => t.id === tipo)?.label || 'Contrato'

      const win = window.open('', '_blank', 'width=900,height=700')
      if (!win) {
        // Fallback popup bloqueado
        const blob = new Blob([html], { type:'text/html;charset=utf-8' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href = url; a.target = '_blank'; a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
        if (!premium && !admin) registrarUsoContrato()
        setGenerating(false)
        showToast('Contrato aberto — use Ctrl+P para salvar como PDF')
        return
      }

      win.document.open()
      win.document.write(html)
      win.document.close()

      const afterPrint = () => {
        if (!premium && !admin) registrarUsoContrato()
        setGenerating(false)
        showToast('✓ Use "Salvar como PDF" no diálogo de impressão.')
      }

      win.onload = () => setTimeout(() => { win.focus(); win.print(); afterPrint() }, 500)
      setTimeout(() => { if (generating) { win.focus(); win.print(); afterPrint() } }, 2500)
    } catch(e) {
      console.error('[PDF]', e)
      showToast('Erro ao gerar PDF. Tente novamente.', false)
      setGenerating(false)
    }
  }

  const handleSalvar = async () => {
    setSaving(true)
    try {
      salvarContrato({ tipo, data, clausulasIA: clausulas })
      showToast('✓ Contrato salvo no seu perfil!')
    } catch {
      showToast('Erro ao salvar contrato.', false)
    } finally {
      setSaving(false)
    }
  }

  const handleNovoContrato = () => {
    setTipo('servicos')
    setStep(0)
    setData({})
    setClausulas(null)
    setAlertas(null)
    setSugestoes(null)
  }
  const currentFields = currentGroup && currentGroup !== 'preview' ? fields[currentGroup] : null
  const [stepTitle, stepDesc] = STEP_LABELS[currentGroup] || ['', '']

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* OVERLAY MOBILE */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:40 }} />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width:260, minHeight:'100vh', background:'#1A1612', color:'#F7F5F0',
        padding:'32px 24px', position:'fixed', top:0, left:0, bottom:0,
        display:'flex', flexDirection:'column', overflowY:'auto', zIndex:50,
        transition:'transform .25s ease',
        transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
      }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:'#F7F5F0', marginBottom:6, cursor:'pointer' }}
          onClick={() => { navigate('/'); setSidebarOpen(false) }}>
          TR<span style={{ color:'var(--accent2)' }}>A</span>CT
        </div>
        <div style={{ fontSize:10, color:'#5C5448', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:32 }}>Gerador com IA</div>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'#5C5448', marginBottom:10, fontWeight:700 }}>Tipo de contrato</div>
          {TIPOS.map(t => (
            <button key={t.id}
              style={{ display:'block', width:'100%', textAlign:'left', background: tipo===t.id?'rgba(200,80,42,.15)':'none', border:'none', borderLeft:`2px solid ${tipo===t.id?'#E8A87C':'transparent'}`, color: tipo===t.id?'#F7F5F0':'#7A7268', fontFamily:'var(--font-body)', fontSize:13, padding:'7px 10px', cursor:'pointer', marginBottom:2 }}
              onClick={() => { handleTipoChange(t.id); setSidebarOpen(false) }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'#5C5448', marginBottom:10, fontWeight:700 }}>Progresso</div>
          {steps.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'idle'
            return (
              <div key={i} onClick={() => i < step && setStep(i)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0', fontSize:12, color: state==='done'?'#E8A87C':state==='active'?'#F7F5F0':'#3A3530', cursor: i<step?'pointer':'default' }}>
                <div style={{ width:18, height:18, borderRadius:'50%', border:`1.5px solid ${state==='done'?'#E8A87C':state==='active'?'#E8A87C':'#3A3530'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, flexShrink:0, fontWeight:700, background:state==='done'?'#E8A87C':'none', color:state==='done'?'#1A1612':state==='active'?'#E8A87C':'#3A3530' }}>
                  {state==='done'?'✓':i+1}
                </div>
                {s}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={() => { navigate('/perfil'); setSidebarOpen(false) }}
            style={{ padding:'9px 12px', background:'rgba(255,255,255,.06)', border:'1px solid #3A3530', color:'#9A9088', borderRadius:3, fontSize:12, cursor:'pointer', textAlign:'left', fontFamily:'var(--font-body)' }}>
            👤 Meu perfil
          </button>
          <button onClick={handleNovoContrato}
            style={{ padding:'9px 12px', background:'none', border:'1px solid #3A3530', color:'#5C5448', borderRadius:3, fontSize:12, cursor:'pointer', textAlign:'left', fontFamily:'var(--font-body)' }}>
            + Novo contrato
          </button>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      {isMobile && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:52, background:'#1A1612', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', zIndex:35 }}>
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background:'none', border:'none', color:'#F7F5F0', fontSize:20, cursor:'pointer', padding:'4px 8px', lineHeight:1 }}>☰</button>
          <span style={{ fontFamily:'var(--font-display)', fontSize:18, color:'#F7F5F0' }}>
            TR<span style={{ color:'#C8502A' }}>A</span>CT
          </span>
          <button onClick={() => navigate('/perfil')}
            style={{ background:'none', border:'none', color:'#9A9088', fontSize:18, cursor:'pointer', padding:'4px 8px' }}>👤</button>
        </div>
      )}

      {/* MAIN */}
      <main style={{ marginLeft: isMobile?0:260, flex:1, padding: isMobile?'72px 16px 100px':'40px 48px', maxWidth: isMobile?'100vw':'calc(100vw - 260px)', width:'100%' }}>
        <div style={{ height:2, background:'#E2DDD6', borderRadius:1, marginBottom: isMobile?24:36, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'var(--accent)', borderRadius:1, transition:'width .4s', width:`${Math.round((step/(steps.length-1))*100)}%` }} />
        </div>

        {/* STEP 0 — TIPO */}
        {step === 0 && (
          <div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize: isMobile?24:32, color:'var(--ink)', lineHeight:1.1, marginBottom:6 }}>
                Qual tipo de <em style={{ color:'var(--accent)', fontStyle:'normal' }}>contrato</em>?
              </div>
              <div style={{ fontSize:13, color:'var(--ink3)' }}>Selecione o modelo que melhor descreve o serviço.</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {TIPOS.map(t => (
                <div key={t.id} onClick={() => handleTipoChange(t.id)}
                  style={{ background: tipo===t.id?'var(--ink)':'var(--surface)', color: tipo===t.id?'#F7F5F0':'var(--ink)', border:`1.5px solid ${tipo===t.id?'var(--ink)':'var(--border)'}`, borderRadius:6, padding: isMobile?'14px 12px':'22px 20px', cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ fontSize: isMobile?20:24, marginBottom:6 }}>{t.icon}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize: isMobile?13:16, marginBottom:2, lineHeight:1.2 }}>{t.label}</div>
                  {!isMobile && <div style={{ fontSize:12, opacity:.6 }}>{t.desc}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEPS FORMULÁRIO */}
        {step > 0 && !isPreview && currentFields && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize: isMobile?20:28, color:'var(--ink)', lineHeight:1.1, marginBottom:4 }}>{stepTitle}</div>
              <div style={{ fontSize:13, color:'var(--ink3)' }}>{stepDesc}</div>
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding: isMobile?'18px 14px':'28px 32px', marginBottom:16 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14 }}>
                {currentFields.map(f => <FieldInput key={f.key} def={f} value={data[f.key]} onChange={handleChange} />)}
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {isPreview && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize: isMobile?20:28, color:'var(--ink)', lineHeight:1.1, marginBottom:4 }}>
                Revisar e <em style={{ color:'var(--accent)', fontStyle:'normal' }}>baixar</em>
              </div>
              <div style={{ fontSize:13, color:'var(--ink3)' }}>Gere cláusulas com IA e baixe o PDF profissional.</div>
            </div>
            <PainelClausulas clausulas={clausulas} alertas={alertas} sugestoes={sugestoes} loading={loadingAI} onGerar={gerarClausulas} temDados={temDados} />

            {/* BANNER LIMITE FREE */}
            {!premium && !admin && (
              <div style={{ background: limite.permitido?'#F0FDF4':'#FEF2F2', border:`1px solid ${limite.permitido?'#BBF7D0':'#FECACA'}`, borderRadius:6, padding:'12px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color: limite.permitido?'#166534':'#B91C1C' }}>
                    {limite.permitido ? `🆓 ${limite.restantes} contrato(s) restante(s) este mês` : '🚫 Limite mensal atingido'}
                  </div>
                  <div style={{ fontSize:12, color: limite.permitido?'#15803D':'#DC2626', marginTop:2 }}>
                    {limite.permitido ? 'Faça upgrade para contratos ilimitados.' : 'Você usou seus 2 contratos gratuitos deste mês.'}
                  </div>
                </div>
                <button onClick={() => navigate('/')} style={{ padding:'7px 14px', background:'#C8502A', color:'#fff', border:'none', borderRadius:3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                  {limite.permitido ? 'Ver planos' : 'Fazer upgrade →'}
                </button>
              </div>
            )}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding: isMobile?'14px':'22px 28px', marginTop:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:12 }}>Resumo dos dados</div>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:1, background:'var(--border)', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden' }}>
                {Object.entries(data).filter(([,v]) => v).slice(0, isMobile?6:12).map(([k, v]) => (
                  <div key={k} style={{ background:'var(--surface)', padding:'8px 12px' }}>
                    <div style={{ fontSize:10, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:2 }}>{k.replace(/_/g,' ')}</div>
                    <div style={{ fontSize:12, color:'var(--ink)' }}>{String(v).slice(0,50)}{String(v).length>50?'…':''}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NAV BUTTONS */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20, flexWrap:'wrap', gap:8 }}>
          <button onClick={() => setStep(s => Math.max(0,s-1))}
            style={{ padding:'10px 18px', borderRadius:'var(--radius)', border:'1px solid var(--border2)', background:'none', color:'var(--ink2)', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, cursor:'pointer', visibility: step===0?'hidden':'visible' }}>
            ← Voltar
          </button>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {isPreview && (
              <button onClick={handleSalvar} disabled={saving}
                style={{ padding:'10px 16px', borderRadius:'var(--radius)', background:'#1D4ED8', color:'#fff', border:'none', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?.6:1 }}>
                {saving?'⏳ Salvando...':'💾 Salvar no perfil'}
              </button>
            )}
            {!isPreview ? (
              <button onClick={() => setStep(s => s+1)}
                style={{ padding:'10px 20px', borderRadius:'var(--radius)', background:'var(--ink)', color:'#F7F5F0', border:'none', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                {step===0?'Começar →':'Próximo →'}
              </button>
            ) : (
              <button onClick={handleDownload} disabled={generating}
                style={{ padding:'10px 20px', borderRadius:'var(--radius)', background:'var(--green)', color:'#fff', border:'none', fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, cursor:'pointer', opacity:generating?.6:1 }}>
                {generating?'⏳ Gerando...':'↓ Baixar PDF'}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#1A1612', borderTop:'1px solid #3A3530', display:'flex', zIndex:35 }}>
          {[
            { icon:'🏠', label:'Início', action:() => navigate('/') },
            { icon:'📄', label:'Novo', action:handleNovoContrato },
            { icon:'👤', label:'Perfil', action:() => navigate('/perfil') },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              style={{ flex:1, padding:'10px 4px', background:'none', border:'none', color:'#9A9088', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, fontFamily:'var(--font-body)' }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:9, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', bottom: isMobile?70:24, right: isMobile?16:24, left: isMobile?16:'auto', background: toast.ok?'var(--green)':'var(--accent)', color:'#fff', padding:'12px 18px', borderRadius:4, fontSize:13, fontWeight:500, boxShadow:'0 8px 32px rgba(0,0,0,.15)', zIndex:999, animation:'slideUp .25s ease', textAlign:'center' }}>
          {toast.msg}
          <style>{`@keyframes slideUp { from{transform:translateY(12px);opacity:0} to{transform:translateY(0);opacity:1} }`}</style>
        </div>
      )}
    </div>
  )
}
