import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContratos } from '../hooks/useContratos.js'
import { lerSessao, logout, isPremium, isAdmin, verificarLimiteFree, labelPlano } from '../lib/auth.js'

const TIPO_CORES = {
  servicos:   { bg:'#EEF2FF', text:'#3730A3', label:'Prestação de Serviços' },
  software:   { bg:'#F0FDF4', text:'#166534', label:'Desenvolvimento de Software' },
  design:     { bg:'#FFF7ED', text:'#9A3412', label:'Design / Criação' },
  influencer: { bg:'#FDF4FF', text:'#7E22CE', label:'Influencer Marketing' },
}
const STATUS_CORES = {
  rascunho: { bg:'#F3F4F6', text:'#374151', label:'Rascunho' },
  assinado: { bg:'#D1FAE5', text:'#065F46', label:'Assinado' },
}

function fmt(iso) {
  try { return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }) }
  catch { return '—' }
}

// ─── CARD DE CONTRATO ─────────────────────────────────────────────────────────
function ContratoCard({ contrato, onAbrir, onRemover, onStatus }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const tipo   = TIPO_CORES[contrato.tipo]   || TIPO_CORES.servicos
  const status = STATUS_CORES[contrato.status] || STATUS_CORES.rascunho

  return (
    <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding:'16px 18px', position:'relative', transition:'box-shadow .15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:tipo.bg, color:tipo.text }}>{tipo.label}</span>
            <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:status.bg, color:status.text }}>{status.label}</span>
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:'#1A1612', lineHeight:1.3, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{contrato.titulo}</div>
          {contrato.descricao && <div style={{ fontSize:12, color:'#A09890', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{contrato.descricao}</div>}
        </div>
        <div style={{ position:'relative', marginLeft:8, flexShrink:0 }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px', color:'#A09890', fontSize:18, lineHeight:1 }}>⋯</button>
          {menuOpen && <>
            <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:10 }} />
            <div style={{ position:'absolute', right:0, top:'100%', background:'#fff', border:'1px solid #E2DDD6', borderRadius:6, boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:20, minWidth:180, overflow:'hidden' }}>
              <button onClick={() => { onAbrir(contrato); setMenuOpen(false) }} style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 16px', fontSize:13, color:'#1A1612', background:'none', border:'none', cursor:'pointer', borderBottom:'1px solid #F3F0EB' }}>✏️ Abrir / Baixar PDF</button>
              {contrato.status === 'rascunho'
                ? <button onClick={() => { onStatus(contrato.id,'assinado'); setMenuOpen(false) }} style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 16px', fontSize:13, color:'#065F46', background:'none', border:'none', cursor:'pointer', borderBottom:'1px solid #F3F0EB' }}>✅ Marcar como assinado</button>
                : <button onClick={() => { onStatus(contrato.id,'rascunho'); setMenuOpen(false) }} style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 16px', fontSize:13, color:'#6B7280', background:'none', border:'none', cursor:'pointer', borderBottom:'1px solid #F3F0EB' }}>↩ Voltar para rascunho</button>
              }
              <button onClick={() => { if(confirm('Remover este contrato?')) { onRemover(contrato.id); setMenuOpen(false) } }} style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 16px', fontSize:13, color:'#C8502A', background:'none', border:'none', cursor:'pointer' }}>🗑 Remover</button>
            </div>
          </>}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:10, borderTop:'1px solid #F3F0EB' }}>
        <span style={{ fontSize:11, color:'#A09890' }}>{fmt(contrato.criadoEm)}</span>
        <button onClick={() => onAbrir(contrato)} style={{ fontSize:12, fontWeight:600, color:'#C8502A', background:'none', border:'none', cursor:'pointer', padding:'4px 8px' }}>Baixar PDF →</button>
      </div>
    </div>
  )
}

// ─── PERFIL PRINCIPAL ─────────────────────────────────────────────────────────
export default function Perfil() {
  const navigate = useNavigate()
  const { contratos, removerContrato, atualizarStatus } = useContratos()
  const [aba, setAba]     = useState('contratos')
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca]   = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  // ── GUARD: lê localStorage diretamente, sem import indireto ───────────────
  const sessaoRef = useRef(lerSessao())
  useEffect(() => {
    const s = lerSessao()
    if (!s) {
      navigate('/', { replace:true })
    }
    const fn = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  // Se não tem sessão, não renderiza nada
  if (!sessaoRef.current) return null
  // ────────────────────────────────────────────────────────────────────────

  const sessao  = sessaoRef.current
  const admin   = sessao.plano === 'admin'
  const premium = ['mensal','vitalicio','admin'].includes(sessao.plano)
  const limite  = verificarLimiteFree()

  const contratosFiltrados = contratos.filter(c => {
    const okFiltro = filtro === 'todos' || c.status === filtro
    const okBusca  = !busca || c.titulo.toLowerCase().includes(busca.toLowerCase()) || (c.descricao||'').toLowerCase().includes(busca.toLowerCase())
    return okFiltro && okBusca
  })

  // ── FIX: navega para /app passando o tipo selecionado via sessionStorage ──
  const irParaGerador = useCallback((tipo = null) => {
    if (tipo) sessionStorage.setItem('tract_tipo_inicial', tipo)
    // Pequeno delay para garantir que sessionStorage está gravado antes do navigate
    setTimeout(() => navigate('/app'), 10)
  }, [navigate])

  const handleAbrir = useCallback((contrato) => {
    sessionStorage.setItem('tract_carregar_contrato', JSON.stringify(contrato))
    setTimeout(() => navigate('/app'), 10)
  }, [navigate])

  const handleLogout = () => { logout(); navigate('/') }

  const stats = {
    total:     contratos.length,
    rascunhos: contratos.filter(c => c.status==='rascunho').length,
    assinados: contratos.filter(c => c.status==='assinado').length,
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0' }}>

      {/* NAV */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: isMobile?'14px 16px':'16px 32px', background:'#1A1612', position:'sticky', top:0, zIndex:50 }}>
        <span onClick={() => navigate('/')} style={{ fontFamily:'Georgia,serif', fontSize:20, color:'#F7F5F0', cursor:'pointer', letterSpacing:'-.02em' }}>
          TR<span style={{ color:'#C8502A' }}>A</span>CT
        </span>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {/* FIX: usa irParaGerador em vez de navigate('/app') direto */}
          <button onClick={() => irParaGerador()}
            style={{ padding: isMobile?'7px 12px':'8px 18px', background:'#C8502A', color:'#fff', border:'none', borderRadius:3, fontSize: isMobile?12:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            + Novo contrato
          </button>
          <button onClick={handleLogout}
            style={{ padding:'7px 12px', background:'none', border:'1px solid #3A3530', color:'#9A9088', borderRadius:3, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            Sair
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:900, margin:'0 auto', padding: isMobile?'20px 16px':'32px 24px' }}>

        {/* HEADER DO PERFIL */}
        <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding: isMobile?'20px 16px':'24px 28px', marginBottom:20, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'#1A1612', color:'#F7F5F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, flexShrink:0 }}>
            {sessao.email[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:600, color:'#1A1612', marginBottom:4 }}>{sessao.email}</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20,
                background: admin?'#7E22CE': premium?'#FEF3ED':'#F3F4F6',
                color:      admin?'#fff':    premium?'#9A3412':'#374151' }}>
                {admin?'👑 Administrador': premium?`⭐ ${labelPlano(sessao.plano)}`:'🆓 Plano Gratuito'}
              </span>
              {!premium && !admin && (
                <span style={{ fontSize:11, color:'#6B7280' }}>{limite.usados}/2 contratos usados este mês</span>
              )}
              {sessao.desde && <span style={{ fontSize:11, color:'#A09890' }}>Desde {fmt(sessao.desde)}</span>}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { label:'Total', value:stats.total,     icon:'📄' },
            { label:'Rascunhos', value:stats.rascunhos, icon:'✏️' },
            { label:'Assinados', value:stats.assinados, icon:'✅' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding: isMobile?'12px':'16px 20px', textAlign:'center' }}>
              <div style={{ fontSize: isMobile?22:28, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize: isMobile?22:28, fontWeight:700, color:'#1A1612', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#A09890', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ABAS */}
        <div style={{ display:'flex', gap:2, marginBottom:20, background:'#E2DDD6', borderRadius:6, padding:3 }}>
          {[['contratos','📄 Meus Contratos'],['conta','👤 Minha Conta']].map(([id,label]) => (
            <button key={id} onClick={() => setAba(id)}
              style={{ flex:1, padding: isMobile?'9px 8px':'9px 16px', borderRadius:4, border:'none', cursor:'pointer', fontSize: isMobile?12:13, fontWeight:600, fontFamily:'inherit',
                background: aba===id?'#fff':'transparent', color: aba===id?'#1A1612':'#7A7268',
                boxShadow: aba===id?'0 1px 4px rgba(0,0,0,.08)':'none', transition:'all .15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ABA CONTRATOS */}
        {aba === 'contratos' && (
          <div>
            {/* FILTROS */}
            <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
              <input type="text" placeholder="Buscar contrato..." value={busca} onChange={e => setBusca(e.target.value)}
                style={{ flex:1, minWidth:160, padding:'9px 14px', border:'1px solid #CEC8BF', borderRadius:4, fontSize:13, fontFamily:'inherit', background:'#fff', color:'#1A1612', outline:'none' }} />
              <div style={{ display:'flex', gap:6 }}>
                {['todos','rascunho','assinado'].map(f => (
                  <button key={f} onClick={() => setFiltro(f)}
                    style={{ padding:'8px 14px', borderRadius:4, border:'1px solid #CEC8BF', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                      background: filtro===f?'#1A1612':'#fff', color: filtro===f?'#F7F5F0':'#5C5448' }}>
                    {f==='todos'?'Todos':f==='rascunho'?'Rascunhos':'Assinados'}
                  </button>
                ))}
              </div>
            </div>

            {/* LISTA */}
            {contratosFiltrados.length === 0 ? (
              <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding:'48px 24px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:16 }}>📄</div>
                <div style={{ fontSize:16, fontWeight:600, color:'#1A1612', marginBottom:8 }}>
                  {contratos.length===0 ? 'Nenhum contrato salvo ainda' : 'Nenhum contrato encontrado'}
                </div>
                <div style={{ fontSize:13, color:'#A09890', marginBottom:24, lineHeight:1.6 }}>
                  {contratos.length===0 ? 'Seus contratos gerados ficarão salvos aqui.' : 'Tente ajustar o filtro ou a busca.'}
                </div>
                {contratos.length===0 && (
                  <button onClick={() => irParaGerador()}
                    style={{ padding:'11px 24px', background:'#1A1612', color:'#F7F5F0', border:'none', borderRadius:4, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    Criar meu primeiro contrato →
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
                {contratosFiltrados.map(c => (
                  <ContratoCard key={c.id} contrato={c} onAbrir={handleAbrir} onRemover={removerContrato} onStatus={atualizarStatus} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA CONTA */}
        {aba === 'conta' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding:'20px 24px' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#1A1612', marginBottom:16, textTransform:'uppercase', letterSpacing:'.06em' }}>Dados da conta</div>
              {[
                { label:'E-mail', value:sessao.email },
                { label:'Plano', value: admin?'Administrador (acesso total)': premium?`${labelPlano(sessao.plano)} — ilimitado`:`Gratuito — ${limite.restantes} contrato(s) restante(s)` },
                { label:'Verificado', value: sessao.pagamentoVerificado?'✅ Pagamento confirmado': sessao.plano==='free'?'🆓 Plano gratuito':'—' },
                { label:'Membro desde', value: sessao.desde ? fmt(sessao.desde) : '—' },
                { label:'Contratos salvos', value:String(stats.total) },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F3F0EB', flexWrap:'wrap', gap:4 }}>
                  <span style={{ fontSize:13, color:'#5C5448' }}>{row.label}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#1A1612' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background:'#FEF3ED', border:'1px solid #FDBA74', borderRadius:8, padding:'16px 20px' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#9A3412', marginBottom:8 }}>⚠ Backup dos seus contratos</div>
              <div style={{ fontSize:13, color:'#C2410C', lineHeight:1.6, marginBottom:12 }}>Seus contratos são salvos neste navegador. Exporte uma cópia para não perder o histórico.</div>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(contratos,null,2)], { type:'application/json' })
                  const url  = URL.createObjectURL(blob)
                  const a    = document.createElement('a')
                  a.href = url; a.download = `TRACT_backup_${new Date().toISOString().slice(0,10)}.json`; a.click()
                  URL.revokeObjectURL(url)
                }}
                style={{ padding:'9px 18px', background:'#C8502A', color:'#fff', border:'none', borderRadius:4, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                ↓ Exportar backup (.json)
              </button>
            </div>

            <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding:'16px 20px' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#1A1612', marginBottom:8 }}>Encerrar sessão</div>
              <div style={{ fontSize:13, color:'#5C5448', marginBottom:12 }}>Você será redirecionado para a página inicial.</div>
              <button onClick={handleLogout}
                style={{ padding:'9px 18px', background:'none', border:'1.5px solid #E2DDD6', color:'#5C5448', borderRadius:4, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Sair da conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
