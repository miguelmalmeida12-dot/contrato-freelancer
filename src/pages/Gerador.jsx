import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

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

// ─── PDF BUILDER ──────────────────────────────────────────────────────────────

function buildPdfHtml(tipo, data, clausulasIA) {
  const v = (key) => data[key] || '___________'
  const tipoLabels = { servicos:'Prestação de Serviços', software:'Desenvolvimento de Software', design:'Design e Criação', influencer:'Influencer Marketing' }

  const css = `
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #1A1612; line-height: 1.7; margin: 0; padding: 0; }
    .header { border-bottom: 3px solid #1A1612; padding-bottom: 16px; margin-bottom: 24px; }
    .tipo { font-size: 9pt; text-transform: uppercase; letter-spacing: .1em; color: #C8502A; margin-bottom: 6px; }
    .title { font-size: 22pt; font-weight: 700; }
    .sec-title { font-size: 9pt; text-transform: uppercase; letter-spacing: .08em; background: #F7F5F0; padding: 5px 10px; color: #5C5448; font-weight: 700; border-left: 3px solid #C8502A; margin: 20px 0 10px; }
    .clause { margin-bottom: 16px; page-break-inside: avoid; }
    .clause-title { font-size: 11pt; font-weight: 700; color: #1A1612; margin-bottom: 6px; border-bottom: 1px solid #E2DDD6; padding-bottom: 4px; }
    .clause-body { font-size: 10pt; color: #3A3530; line-height: 1.8; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10pt; }
    th { background: #1A1612; color: #fff; padding: 6px 10px; text-align: left; }
    td { padding: 6px 10px; border-bottom: 1px solid #E2DDD6; }
    tr:nth-child(even) td { background: #F7F5F0; }
    .lbl { font-weight: 600; color: #5C5448; width: 38%; }
    .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; }
    .sig { border-top: 1.5px solid #1A1612; padding-top: 10px; }
    .sig-role { font-size: 9pt; text-transform: uppercase; letter-spacing: .06em; color: #A09890; }
    .sig-name { font-size: 11pt; font-weight: 600; margin-top: 4px; }
    .ai-badge { font-size: 8pt; color: #1D4ED8; background: #EFF6FF; padding: 2px 6px; border-radius: 2px; margin-left: 6px; }
  `

  // Seleciona cláusulas (IA ou padrão)
  const obj = clausulasIA?.clausula_objeto
  const obrig_tado = clausulasIA?.clausula_obrigacoes_contratado
  const obrig_tante = clausulasIA?.clausula_obrigacoes_contratante
  const pi = clausulasIA?.clausula_propriedade_intelectual
  const rescisao = clausulasIA?.clausula_rescisao

  const aiBadge = clausulasIA ? '<span class="ai-badge">✨ IA</span>' : ''

  const partesServicos = `
    <p style="font-size:10pt;font-weight:700;margin:0 0 6px">CONTRATANTE:</p>
    <table><tr><td class="lbl">Nome</td><td>${v('cont_nome')}</td></tr><tr><td class="lbl">CPF/CNPJ</td><td>${v('cont_cpf')}</td></tr><tr><td class="lbl">E-mail</td><td>${v('cont_email')}</td></tr><tr><td class="lbl">Telefone</td><td>${v('cont_telefone')}</td></tr><tr><td class="lbl">Endereço</td><td>${v('cont_endereco')}</td></tr></table>
    <p style="font-size:10pt;font-weight:700;margin:12px 0 6px">CONTRATADO(A):</p>
    <table><tr><td class="lbl">Nome</td><td>${v('tado_nome')}</td></tr><tr><td class="lbl">CPF/CNPJ</td><td>${v('tado_cpf')}</td></tr><tr><td class="lbl">E-mail</td><td>${v('tado_email')}</td></tr></table>
  `

  const clausulasServicos = `
    <div class="clause"><div class="clause-title">Cláusula 1ª – Do Objeto ${aiBadge}</div><div class="clause-body">${obj || `O presente contrato tem por objeto a prestação dos seguintes serviços: ${v('descricao')}. Modalidade: ${v('modalidade')}.`}</div></div>
    <div class="clause"><div class="clause-title">Cláusula 2ª – Do Prazo</div><div class="clause-body">Início: ${v('data_inicio')} | Conclusão prevista: ${v('data_fim')}</div></div>
    <div class="clause"><div class="clause-title">Cláusula 3ª – Do Valor e Pagamento</div><div class="clause-body">Valor total: <strong>${v('valor_total')}</strong> | Forma: ${v('forma_pagamento')} | Vencimento: ${v('data_vencimento')}<br>Dados: ${v('dados_bancarios')} | Primeiro pagamento: ${v('data_primeiro_pag')}<br>Multa por atraso: 2% + juros de 1% a.m.</div></div>
    <div class="clause"><div class="clause-title">Cláusula 4ª – Das Obrigações do Contratado ${aiBadge}</div><div class="clause-body">${obrig_tado || `Executar os serviços com qualidade. Revisões incluídas: ${v('num_revisoes')}. Formatos: ${v('formatos_entrega')}. Manter sigilo das informações do contratante.`}</div></div>
    <div class="clause"><div class="clause-title">Cláusula 5ª – Das Obrigações do Contratante ${aiBadge}</div><div class="clause-body">${obrig_tante || `Pagar nas datas acordadas. Fornecer materiais em até ${v('prazo_retorno')} dias. Aprovar entregas em até ${v('prazo_aprovacao')} dias úteis.`}</div></div>
    <div class="clause"><div class="clause-title">Cláusula 6ª – Da Propriedade Intelectual ${aiBadge}</div><div class="clause-body">${pi || 'Os direitos patrimoniais são transferidos ao CONTRATANTE após quitação integral. O CONTRATADO mantém o direito de uso em portfólio.'}</div></div>
    <div class="clause"><div class="clause-title">Cláusula 7ª – Da Rescisão ${aiBadge}</div><div class="clause-body">${rescisao || `Rescisão mediante aviso de ${v('prazo_aviso')} dias. Multa de ${v('multa_rescisao')}% sobre o total.`}</div></div>
    <div class="clause"><div class="clause-title">Cláusula 8ª – Da Relação entre as Partes</div><div class="clause-body">Não há vínculo empregatício. O CONTRATADO é autônomo e responsável pelos próprios tributos (Art. 593, CC).</div></div>
    <div class="clause"><div class="clause-title">Cláusula 9ª – Do Foro</div><div class="clause-body">Foro eleito: comarca de ${v('cidade_foro')}.</div></div>
  `

  const templates = {
    servicos: `
      <div class="header"><div class="tipo">Contrato · Prestação de Serviços</div><div class="title">Contrato de Prestação de Serviços</div></div>
      <div class="sec-title">Qualificação das Partes</div>${partesServicos}
      <div class="sec-title">Cláusulas Contratuais</div>${clausulasServicos}
      <div class="sigs">
        <div class="sig"><div class="sig-role">Contratante</div><div class="sig-name">${v('cont_nome')}</div><div style="font-size:9pt;color:#A09890">CPF/CNPJ: ${v('cont_cpf')}</div></div>
        <div class="sig"><div class="sig-role">Contratado(a)</div><div class="sig-name">${v('tado_nome')}</div><div style="font-size:9pt;color:#A09890">CPF/CNPJ: ${v('tado_cpf')}</div></div>
      </div>
    `,
    software: `
      <div class="header"><div class="tipo">Contrato · Desenvolvimento de Software</div><div class="title">Contrato de Desenvolvimento de Software</div></div>
      <div class="sec-title">Qualificação das Partes</div>
      <p style="font-size:10pt;font-weight:700;margin:0 0 6px">CLIENTE:</p>
      <table><tr><td class="lbl">Nome</td><td>${v('cli_nome')}</td></tr><tr><td class="lbl">CPF/CNPJ</td><td>${v('cli_cpf')}</td></tr><tr><td class="lbl">Representante</td><td>${v('cli_rep')}</td></tr><tr><td class="lbl">E-mail</td><td>${v('cli_email')}</td></tr></table>
      <p style="font-size:10pt;font-weight:700;margin:12px 0 6px">DESENVOLVEDOR(A):</p>
      <table><tr><td class="lbl">Nome</td><td>${v('dev_nome')}</td></tr><tr><td class="lbl">CPF/CNPJ</td><td>${v('dev_cpf')}</td></tr><tr><td class="lbl">E-mail</td><td>${v('dev_email')}</td></tr></table>
      <div class="sec-title">Dados do Projeto</div>
      <table><tr><td class="lbl">Nome</td><td>${v('proj_nome')}</td></tr><tr><td class="lbl">Tipo</td><td>${v('proj_tipo')}</td></tr><tr><td class="lbl">Plataformas</td><td>${v('proj_plataformas')}</td></tr><tr><td class="lbl">Stack</td><td>${v('proj_stack')}</td></tr></table>
      <div class="sec-title">Milestones e Pagamentos</div>
      <table><tr><th>Fase</th><th>Entregável</th><th>Prazo</th><th>Valor</th></tr>${['1','2','3'].map(n => data[`ms${n}_fase`] ? `<tr><td>${data[`ms${n}_fase`]}</td><td>${v(`ms${n}_entrega`)}</td><td>${v(`ms${n}_prazo`)}</td><td>${v(`ms${n}_valor`)}</td></tr>` : '').join('')}</table>
      <div class="sec-title">Cláusulas Contratuais</div>
      <div class="clause"><div class="clause-title">Cláusula 1ª – Do Objeto ${aiBadge}</div><div class="clause-body">${obj || `Desenvolvimento do projeto ${v('proj_nome')}: ${v('proj_escopo')}`}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 2ª – Controle de Mudanças de Escopo</div><div class="clause-body">Qualquer alteração deverá ser formalizada via Change Request, com impacto em prazo, custo adicional e assinatura das partes. Mudanças sem aprovação não serão desenvolvidas.</div></div>
      <div class="clause"><div class="clause-title">Cláusula 3ª – Pagamento</div><div class="clause-body">Total: <strong>${v('sw_valor_total')}</strong> | Entrada (${v('sw_pct_entrada')}%): ${v('sw_valor_entrada')} | Final (${v('sw_pct_final')}%): ${v('sw_valor_final')}<br>Forma: ${v('sw_forma_pag')} | Dados: ${v('sw_dados_banco')}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 4ª – Obrigações ${aiBadge}</div><div class="clause-body">${obrig_tado || 'Executar o desenvolvimento conforme o escopo acordado, comunicar impedimentos e realizar testes antes de cada entrega.'}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 5ª – Propriedade Intelectual ${aiBadge}</div><div class="clause-body">${pi || 'Código-fonte e documentação transferidos ao CLIENTE após quitação integral. Bibliotecas open-source sujeitas às suas licenças.'}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 6ª – Garantia Técnica</div><div class="clause-body">Garantia de ${v('sw_garantia')} dias após entrega. Aceite em ${v('sw_prazo_aceite')} dias úteis. Ausência de resposta = aceite tácito.</div></div>
      <div class="clause"><div class="clause-title">Cláusula 7ª – Confidencialidade</div><div class="clause-body">NDA de ${v('sw_nda_anos')} anos após encerramento. Foro: ${v('sw_cidade_foro')}.</div></div>
      <div class="sigs">
        <div class="sig"><div class="sig-role">Cliente</div><div class="sig-name">${v('cli_nome')}</div></div>
        <div class="sig"><div class="sig-role">Desenvolvedor(a)</div><div class="sig-name">${v('dev_nome')}</div></div>
      </div>
    `,
    design: `
      <div class="header"><div class="tipo">Contrato · Design e Criação</div><div class="title">Contrato de Prestação de Serviços de Design</div></div>
      <div class="sec-title">Qualificação das Partes</div>
      <table><tr><td class="lbl">Contratante</td><td>${v('dc_nome')}</td></tr><tr><td class="lbl">CPF/CNPJ</td><td>${v('dc_cpf')}</td></tr><tr><td class="lbl">E-mail</td><td>${v('dc_email')}</td></tr></table>
      <table><tr><td class="lbl">Designer / Estúdio</td><td>${v('ds_nome')}</td></tr><tr><td class="lbl">CPF/CNPJ</td><td>${v('ds_cpf')}</td></tr><tr><td class="lbl">E-mail</td><td>${v('ds_email')}</td></tr></table>
      <div class="sec-title">Escopo Criativo</div>
      <table><tr><td class="lbl">Tipo</td><td>${v('dg_tipo')}</td></tr><tr><td class="lbl">Formatos</td><td>${v('dg_formatos')}</td></tr><tr><td class="lbl">Opções de conceito</td><td>${v('dg_opcoes')}</td></tr><tr><td class="lbl">Versões</td><td>${v('dg_versoes')}</td></tr><tr><td class="lbl">Rodadas de ajuste</td><td>${v('dg_revisoes')}</td></tr></table>
      <div class="sec-title">Cláusulas Contratuais</div>
      <div class="clause"><div class="clause-title">Cláusula 1ª – Do Objeto ${aiBadge}</div><div class="clause-body">${obj || `Desenvolvimento de ${v('dg_tipo')} com as seguintes entregas: ${v('dg_entregas')}`}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 2ª – Pagamento</div><div class="clause-body">Total: <strong>${v('dg_valor')}</strong> | Sinal (50%): ${v('dg_sinal')} | Final: ${v('dg_final')}<br>Forma: ${v('dg_forma')} | Dados: ${v('dg_dados')}<br>Arquivos editáveis entregues apenas após quitação integral.</div></div>
      <div class="clause"><div class="clause-title">Cláusula 3ª – Direitos Autorais ${aiBadge}</div><div class="clause-body">${pi || 'Direitos patrimoniais transferidos após quitação. O designer mantém autoria moral (Lei 9.610/98) e direito de exibição em portfólio.'}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 4ª – Rescisão ${aiBadge}</div><div class="clause-body">${rescisao || 'Cancelamento antes do conceito: reembolso de 70% do sinal. Após conceito: sem reembolso.'}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 5ª – Foro</div><div class="clause-body">Comarca de ${v('dg_cidade')}.</div></div>
      <div class="sigs">
        <div class="sig"><div class="sig-role">Contratante</div><div class="sig-name">${v('dc_nome')}</div></div>
        <div class="sig"><div class="sig-role">Designer / Estúdio</div><div class="sig-name">${v('ds_nome')}</div></div>
      </div>
    `,
    influencer: `
      <div class="header"><div class="tipo">Contrato · Influencer Marketing</div><div class="title">Contrato de Influencer Marketing / Publipost</div></div>
      <div class="sec-title">Qualificação das Partes</div>
      <table><tr><td class="lbl">Marca</td><td>${v('mk_nome')}</td></tr><tr><td class="lbl">CNPJ/CPF</td><td>${v('mk_cnpj')}</td></tr><tr><td class="lbl">Representante</td><td>${v('mk_rep')}</td></tr><tr><td class="lbl">E-mail</td><td>${v('mk_email')}</td></tr></table>
      <table><tr><td class="lbl">Influencer</td><td>${v('inf_nome')}</td></tr><tr><td class="lbl">CPF/CNPJ</td><td>${v('inf_cpf')}</td></tr><tr><td class="lbl">Perfis</td><td>${v('inf_arrobas')}</td></tr><tr><td class="lbl">Seguidores</td><td>${v('inf_seguidores')}</td></tr></table>
      <div class="sec-title">Campanha</div>
      <table><tr><td class="lbl">Produto</td><td>${v('cp_produto')}</td></tr><tr><td class="lbl">Plataforma</td><td>${v('cp_plataforma')}</td></tr><tr><td class="lbl">Formatos</td><td>${v('cp_formatos')}</td></tr><tr><td class="lbl">Publicações</td><td>${v('cp_qtd')}</td></tr><tr><td class="lbl">Período</td><td>${v('cp_inicio')} a ${v('cp_fim')}</td></tr></table>
      <div class="sec-title">Cláusulas Contratuais</div>
      <div class="clause"><div class="clause-title">Cláusula 1ª – Do Objeto ${aiBadge}</div><div class="clause-body">${obj || `Divulgação paga de ${v('cp_produto')} em ${v('cp_plataforma')}: ${v('cp_formatos')}.`}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 2ª – Conteúdo e CONAR</div><div class="clause-body">Todo conteúdo deve identificar o caráter publicitário (#publi, #parceria, #ad). Menção obrigatória: ${v('cn_mencao')}. ${data.cn_link ? 'Link: ' + data.cn_link : ''}<br>Envio para aprovação: ${v('cn_prazo_envio')} dias antes. Aprovação da marca: ${v('cn_prazo_aprov')} dias úteis. Máx. ajustes: ${v('cn_rodadas')} rodadas.</div></div>
      <div class="clause"><div class="clause-title">Cláusula 3ª – Pagamento</div><div class="clause-body">Total: <strong>${v('inf_valor')}</strong> | Forma: ${v('inf_forma')} | Data: ${v('inf_data_pag')}<br>${data.inf_produtos ? 'Brindes: ' + data.inf_produtos + '<br>' : ''}Relatório de métricas: ${v('inf_prazo_rel')} dias após encerramento.</div></div>
      <div class="clause"><div class="clause-title">Cláusula 4ª – Não-Concorrência ${aiBadge}</div><div class="clause-body">${rescisao || `Por ${v('cn_excl_prazo')} dias após a campanha, o influencer não divulgará concorrentes na categoria: ${v('cn_excl_cat')}.`}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 5ª – Direitos de Uso do Conteúdo ${aiBadge}</div><div class="clause-body">${pi || 'A marca pode fazer repost nos perfis oficiais. Uso em anúncios pagos requer autorização expressa adicional.'}</div></div>
      <div class="clause"><div class="clause-title">Cláusula 6ª – Foro</div><div class="clause-body">Comarca de ${v('inf_cidade')}.</div></div>
      <div class="sigs">
        <div class="sig"><div class="sig-role">Marca / Empresa</div><div class="sig-name">${v('mk_nome')}</div></div>
        <div class="sig"><div class="sig-role">Influenciador(a)</div><div class="sig-name">${v('inf_nome')}</div></div>
      </div>
    `,
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>${templates[tipo] || ''}</body></html>`
}

// ─── GERADOR PRINCIPAL ────────────────────────────────────────────────────────

export default function Gerador() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState('servicos')
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})
  const [clausulas, setClausulas] = useState(null)
  const [alertas, setAlertas] = useState(null)
  const [sugestoes, setSugestoes] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)
  const pdfRef = useRef(null)

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

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default

      // Cria elemento temporário
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;background:#fff'
      wrapper.innerHTML = buildPdfHtml(tipo, data, clausulas)
      document.body.appendChild(wrapper)

      const tipoLabel = TIPOS.find(t => t.id === tipo)?.label || 'Contrato'
      const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')

      await html2pdf().set({
        margin: [14, 12, 14, 12],
        filename: `Contrato_${tipoLabel.replace(/ /g, '_')}_${hoje}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css'] },
      }).from(wrapper).save()

      document.body.removeChild(wrapper)
      showToast('✓ PDF baixado com sucesso!')
    } catch (e) {
      console.error(e)
      showToast('Erro ao gerar PDF', false)
    } finally {
      setGenerating(false)
    }
  }

  const currentGroup = stepMap[step]
  const currentFields = currentGroup && currentGroup !== 'preview' ? fields[currentGroup] : null
  const [stepTitle, stepDesc] = STEP_LABELS[currentGroup] || ['', '']

  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>Contrato<span style={{ color:'var(--accent)' }}>Freelancer</span></div>
        <div style={S.sidebarSub}>Gerador com IA</div>

        <div style={{ marginBottom:36 }}>
          <div style={S.sidebarSecLabel}>Tipo de contrato</div>
          {TIPOS.map(t => (
            <button key={t.id} style={S.typeBtn(tipo === t.id)} onClick={() => handleTipoChange(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom:36 }}>
          <div style={S.sidebarSecLabel}>Progresso</div>
          {steps.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'idle'
            return (
              <div key={i} style={S.stepItem(state)}>
                <div style={S.stepDot(state)}>{state === 'done' ? '✓' : i + 1}</div>
                {s}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop:'auto', fontSize:11, color:'#3A3530', lineHeight:1.7 }}>
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'#5C5448', fontSize:11, cursor:'pointer', padding:0 }}>← Voltar à landing</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        <div style={S.progressBar}><div style={S.progressFill(progress)} /></div>

        {/* STEP 0 — TIPO */}
        {step === 0 && (
          <div>
            <div style={{ marginBottom:32 }}>
              <div style={S.pageTitle}>Qual tipo de <em style={{ color:'var(--accent)', fontStyle:'normal' }}>contrato</em>?</div>
              <div style={S.pageDesc}>Selecione o modelo que melhor descreve o serviço que você vai prestar.</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {TIPOS.map(t => (
                <div key={t.id}
                  onClick={() => handleTipoChange(t.id)}
                  style={{ background: tipo===t.id ? 'var(--ink)' : 'var(--surface)', color: tipo===t.id ? '#F7F5F0' : 'var(--ink)', border:`1.5px solid ${tipo===t.id ? 'var(--ink)' : 'var(--border)'}`, borderRadius:6, padding:'24px 22px', cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ fontSize:26, marginBottom:10 }}>{t.icon}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:17, marginBottom:4 }}>{t.label}</div>
                  <div style={{ fontSize:13, opacity:.6 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEPS DE FORMULÁRIO */}
        {step > 0 && !isPreview && currentFields && (
          <div>
            <div style={{ marginBottom:28 }}>
              <div style={S.pageTitle}>{stepTitle}</div>
              <div style={S.pageDesc}>{stepDesc}</div>
            </div>
            <div style={S.card}>
              <div style={S.fieldGrid(2)}>
                {currentFields.map(f => (
                  <FieldInput key={f.key} def={f} value={data[f.key]} onChange={handleChange} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {isPreview && (
          <div>
            <div style={{ marginBottom:28 }}>
              <div style={S.pageTitle}>Revisar e <em style={{ color:'var(--accent)', fontStyle:'normal' }}>baixar</em></div>
              <div style={S.pageDesc}>Gere cláusulas personalizadas com IA e depois baixe o PDF.</div>
            </div>

            {/* PAINEL IA */}
            <PainelClausulas
              clausulas={clausulas}
              alertas={alertas}
              sugestoes={sugestoes}
              loading={loadingAI}
              onGerar={gerarClausulas}
              temDados={temDados}
            />

            {/* RESUMO */}
            <div style={{ ...S.card, marginTop:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginBottom:16 }}>Resumo dos dados</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:'var(--border)', border:'1px solid var(--border)', borderRadius:4, overflow:'hidden' }}>
                {Object.entries(data).filter(([,v]) => v).slice(0, 12).map(([k, v]) => (
                  <div key={k} style={{ background:'var(--surface)', padding:'8px 14px' }}>
                    <div style={{ fontSize:10, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:2 }}>{k.replace(/_/g,' ')}</div>
                    <div style={{ fontSize:13, color:'var(--ink)' }}>{String(v).slice(0,60)}{String(v).length > 60 ? '…' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NAV */}
        <div style={S.nav}>
          <button style={{ ...S.btnGhost, visibility: step === 0 ? 'hidden' : 'visible' }} onClick={() => setStep(s => Math.max(0, s - 1))}>
            ← Voltar
          </button>
          {!isPreview ? (
            <button style={S.btnPrimary} onClick={() => setStep(s => s + 1)}>
              {step === 0 ? 'Começar →' : 'Próximo →'}
            </button>
          ) : (
            <button style={{ ...S.btnDownload, opacity: generating ? .6 : 1 }} onClick={handleDownload} disabled={generating}>
              {generating ? '⏳ Gerando PDF...' : '↓ Baixar PDF'}
            </button>
          )}
        </div>
      </main>

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', bottom:28, right:28, background: toast.ok ? 'var(--green)' : 'var(--accent)', color:'#fff', padding:'12px 20px', borderRadius:4, fontSize:14, fontWeight:500, boxShadow:'0 8px 32px rgba(0,0,0,.15)', zIndex:999, animation:'slideUp .25s ease' }}>
          {toast.msg}
          <style>{`@keyframes slideUp { from { transform:translateY(12px);opacity:0 } to { transform:translateY(0);opacity:1 } }`}</style>
        </div>
      )}
    </div>
  )
}
