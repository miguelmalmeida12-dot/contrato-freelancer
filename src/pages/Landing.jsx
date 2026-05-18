import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lerSessao, login, cadastrarFree, logout, labelPlano } from '../lib/auth.js'
import { useContratos } from '../hooks/useContratos.js'

const PRECO_MENSAL    = (Number(import.meta.env.VITE_PRECO_MENSAL)    || 3700)  / 100
const PRECO_VITALICIO = (Number(import.meta.env.VITE_PRECO_VITALICIO) || 19700) / 100
const fmt$ = v => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) } catch { return '' } }

const TIPOS = [
  { id:'servicos',   icon:'◆', label:'Prestação de Serviços',      cor:'#3730A3', bg:'#EEF2FF' },
  { id:'software',   icon:'◈', label:'Desenvolvimento de Software', cor:'#166534', bg:'#F0FDF4' },
  { id:'design',     icon:'◉', label:'Design / Criação',            cor:'#9A3412', bg:'#FFF7ED' },
  { id:'influencer', icon:'◎', label:'Influencer Marketing',        cor:'#7E22CE', bg:'#FDF4FF' },
]

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ onClick }) {
  return (
    <span onClick={onClick} style={{ fontFamily:'Georgia,serif', fontSize:22, color:'#1A1612', cursor:onClick?'pointer':'default', userSelect:'none', letterSpacing:'-.02em' }}>
      TR<span style={{ color:'#C8502A' }}>A</span>CT
    </span>
  )
}

// ─── MODAL DE AUTH ────────────────────────────────────────────────────────────
function AuthModal({ onClose, modoInicial='login', onSuccess }) {
  const [modo, setModo]     = useState(modoInicial)
  const [email, setEmail]   = useState('')
  const [senha, setSenha]   = useState('')
  const [conf, setConf]     = useState('')
  const [erro, setErro]     = useState('')
  const [loading, setLoad]  = useState(false)

  const inp = { width:'100%', padding:'11px 14px', border:'1px solid #CEC8BF', borderRadius:3, fontSize:14, fontFamily:'inherit', background:'#FAFAF8', color:'#1A1612', outline:'none', boxSizing:'border-box' }

  const submit = () => {
    setErro(''); setLoad(true)
    setTimeout(() => {
      if (modo === 'login') {
        const r = login(email, senha)
        if (r.ok) { onSuccess(r.user) }
        else { setErro(r.erro); setLoad(false) }
      } else {
        const r = cadastrarFree(email, senha, conf)
        if (r.ok) { onSuccess(r.user) }
        else { setErro(r.erro); setLoad(false) }
      }
    }, 350)
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(26,22,18,.65)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding:'36px 32px', width:'100%', maxWidth:400, position:'relative', boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', fontSize:22, color:'#A09890', cursor:'pointer', lineHeight:1 }}>×</button>
        <Logo />
        <div style={{ display:'flex', gap:2, margin:'20px 0 24px', background:'#F3F0EB', padding:3, borderRadius:4 }}>
          {[['login','Entrar'],['cadastro','Criar conta grátis']].map(([m,l]) => (
            <button key={m} onClick={() => { setModo(m); setErro('') }}
              style={{ flex:1, padding:'8px', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background:modo===m?'#fff':'transparent', color:modo===m?'#1A1612':'#7A7268', transition:'all .15s' }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#5C5448', letterSpacing:'.04em', textTransform:'uppercase', marginBottom:5 }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#5C5448', letterSpacing:'.04em', textTransform:'uppercase', marginBottom:5 }}>Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" style={inp} onKeyDown={e => e.key==='Enter'&&submit()} />
          </div>
          {modo==='cadastro' && (
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#5C5448', letterSpacing:'.04em', textTransform:'uppercase', marginBottom:5 }}>Confirmar senha</label>
              <input type="password" value={conf} onChange={e => setConf(e.target.value)} placeholder="••••••••" style={inp} onKeyDown={e => e.key==='Enter'&&submit()} />
            </div>
          )}
          {modo==='cadastro' && (
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:4, padding:'10px 12px', fontSize:12, color:'#166534', lineHeight:1.6 }}>
              ✓ Conta grátis — 2 contratos por mês · Sem cartão de crédito
            </div>
          )}
          {erro && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:4, padding:'10px 12px', fontSize:13, color:'#B91C1C', lineHeight:1.5 }}>{erro}</div>}
          <button onClick={submit} disabled={loading}
            style={{ width:'100%', padding:'13px', background:loading?'#9CA3AF':'#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', marginTop:4 }}>
            {loading ? 'Verificando...' : modo==='login' ? 'Entrar →' : 'Criar conta e começar →'}
          </button>
        </div>
        <div style={{ fontSize:12, color:'#A09890', textAlign:'center', marginTop:18, lineHeight:1.6 }}>
          {modo==='login'
            ? <>Não tem conta? <span onClick={() => { setModo('cadastro'); setErro('') }} style={{ color:'#C8502A', cursor:'pointer', fontWeight:600 }}>Crie grátis</span></>
            : <>Já tem conta? <span onClick={() => { setModo('login'); setErro('') }} style={{ color:'#C8502A', cursor:'pointer', fontWeight:600 }}>Faça login</span></>
          }
        </div>
      </div>
    </div>
  )
}

// ─── VISÃO PARA USUÁRIO LOGADO ─────────────────────────────────────────────────
function HomeLogado({ sessao, contratos, onLogout }) {
  const navigate  = useNavigate()
  const admin     = sessao.plano === 'admin'
  const premium   = ['mensal','vitalicio','admin'].includes(sessao.plano)
  const recentes  = contratos.slice(0, 4)

  const irParaTipo = (tipo) => {
    sessionStorage.setItem('tract_tipo_inicial', tipo)
    setTimeout(() => navigate('/app'), 10)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0' }}>
      {/* NAV */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 32px', borderBottom:'1px solid #E2DDD6', background:'#fff', position:'sticky', top:0, zIndex:50 }}>
        <Logo />
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
            background:admin?'#7E22CE':premium?'#FEF3ED':'#F3F4F6',
            color:admin?'#fff':premium?'#9A3412':'#374151' }}>
            {admin?'👑 Admin':premium?`⭐ ${labelPlano(sessao.plano)}`:'🆓 Free'}
          </span>
          <button onClick={() => navigate('/perfil')}
            style={{ padding:'8px 16px', borderRadius:3, border:'1px solid #CEC8BF', background:'none', cursor:'pointer', fontSize:13, color:'#5C5448', fontFamily:'inherit' }}>
            Meu perfil
          </button>
          <button onClick={onLogout}
            style={{ padding:'8px 14px', borderRadius:3, border:'1px solid #CEC8BF', background:'none', cursor:'pointer', fontSize:13, color:'#A09890', fontFamily:'inherit' }}>
            Sair
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'48px 24px' }}>
        {/* BOAS VINDAS */}
        <div style={{ marginBottom:36 }}>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#1A1612', marginBottom:6, lineHeight:1.2 }}>
            Olá, <em style={{ color:'#C8502A', fontStyle:'normal' }}>{sessao.email.split('@')[0]}</em> 👋
          </h1>
          <p style={{ fontSize:15, color:'#5C5448' }}>
            {admin || premium
              ? 'Você tem acesso ilimitado. Escolha um tipo de contrato para começar.'
              : `Plano gratuito — você ainda pode gerar contratos este mês.`}
          </p>
        </div>

        {/* CARDS DE TIPO DE CONTRATO */}
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#A09890', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:16 }}>
            Criar novo contrato
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => irParaTipo(t.id)}
                style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding:'20px 18px', cursor:'pointer', textAlign:'left', transition:'all .15s', fontFamily:'inherit', display:'flex', flexDirection:'column', gap:10 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=t.cor; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#E2DDD6'; e.currentTarget.style.boxShadow='none' }}>
                <span style={{ fontSize:28, lineHeight:1 }}>{t.icon}</span>
                <span style={{ fontSize:13, fontWeight:600, color:'#1A1612', lineHeight:1.3 }}>{t.label}</span>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:t.bg, color:t.cor, display:'inline-block', width:'fit-content' }}>
                  Criar →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* HISTÓRICO RÁPIDO */}
        {contratos.length > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#A09890', textTransform:'uppercase', letterSpacing:'.08em' }}>
                Contratos recentes
              </div>
              <button onClick={() => navigate('/perfil')}
                style={{ fontSize:12, color:'#C8502A', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                Ver todos ({contratos.length}) →
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {recentes.map(c => {
                const tipo = TIPOS.find(t => t.id === c.tipo) || TIPOS[0]
                return (
                  <div key={c.id}
                    onClick={() => { sessionStorage.setItem('tract_carregar_contrato', JSON.stringify(c)); setTimeout(() => navigate('/app'), 10) }}
                    style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:6, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', transition:'all .15s', gap:12 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#CEC8BF'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='#E2DDD6'}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>{tipo.icon}</span>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#1A1612', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.titulo}</div>
                        <div style={{ fontSize:11, color:'#A09890', marginTop:1 }}>{tipo.label} · {fmtDate(c.criadoEm)}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20,
                        background:c.status==='assinado'?'#D1FAE5':'#F3F4F6',
                        color:c.status==='assinado'?'#065F46':'#374151' }}>
                        {c.status==='assinado'?'Assinado':'Rascunho'}
                      </span>
                      <span style={{ fontSize:12, color:'#C8502A', fontWeight:600 }}>↓ PDF</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {contratos.length === 0 && (
          <div style={{ background:'#fff', border:'1px dashed #CEC8BF', borderRadius:8, padding:'32px 24px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📄</div>
            <div style={{ fontSize:14, color:'#5C5448', marginBottom:4 }}>Nenhum contrato gerado ainda</div>
            <div style={{ fontSize:12, color:'#A09890' }}>Escolha um tipo acima para criar seu primeiro contrato.</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── VISÃO PARA VISITANTE ──────────────────────────────────────────────────────
function HomeVisitante({ onLogin, onCadastro }) {
  const navigate     = useNavigate()
  const [email, setEmail]       = useState('')
  const [nome, setNome]         = useState('')
  const [loadingPlano, setLoad] = useState(null)
  const [erroPag, setErroPag]   = useState('')

  const handleAssinar = async (plano) => {
    if (!email || !nome) {
      setErroPag('⬆ Preencha nome e e-mail antes de escolher um plano.')
      document.getElementById('campos-ass')?.scrollIntoView({ behavior:'smooth', block:'center' })
      return
    }
    setErroPag(''); setLoad(plano)
    try {
      const res = await fetch('/api/criar-pagamento', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ plano, email, nome }) })
      const d   = await res.json()
      if (d.init_point) {
        localStorage.setItem('tract_pag_email', email)
        localStorage.setItem('tract_pag_plano', plano)
        window.location.href = import.meta.env.DEV ? d.sandbox_init_point : d.init_point
      } else { setErroPag('Erro ao iniciar pagamento.') }
    } catch { setErroPag('Erro de conexão.') }
    finally { setLoad(null) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0' }}>
      {/* NAV */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 32px', borderBottom:'1px solid #E2DDD6', background:'#fff', position:'sticky', top:0, zIndex:50 }}>
        <Logo />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onLogin} style={{ padding:'8px 16px', borderRadius:3, border:'1px solid #CEC8BF', background:'none', cursor:'pointer', fontSize:13, color:'#5C5448', fontFamily:'inherit' }}>Entrar</button>
          <button onClick={onCadastro} style={{ padding:'8px 16px', borderRadius:3, border:'none', background:'#1A1612', color:'#F7F5F0', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>Criar conta grátis</button>
        </div>
      </nav>

      <section style={{ maxWidth:720, margin:'0 auto', padding:'72px 24px 64px', textAlign:'center' }}>
        <div style={{ display:'inline-block', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#C8502A', background:'#FEF3ED', padding:'4px 12px', borderRadius:2, marginBottom:20 }}>
          Gerador com IA · Cláusulas personalizadas
        </div>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:44, lineHeight:1.1, color:'#1A1612', marginBottom:18 }}>
          Contratos profissionais em<br /><em style={{ color:'#C8502A', fontStyle:'normal' }}>3 minutos.</em> Sem advogado.
        </h1>
        <p style={{ fontSize:16, color:'#5C5448', lineHeight:1.7, maxWidth:500, margin:'0 auto 44px' }}>
          Preencha o formulário, a IA gera cláusulas personalizadas e você baixa o PDF pronto para assinar.
        </p>

        <div style={{ display:'flex', justifyContent:'center', gap:24, marginBottom:48, flexWrap:'wrap' }}>
          {['4 modelos de contrato','Cláusulas por IA','PDF em 1 clique','Legislação brasileira'].map(b => (
            <div key={b} style={{ fontSize:13, color:'#5C5448', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'#2D6A4F', fontWeight:700 }}>✓</span> {b}
            </div>
          ))}
        </div>

        {/* CTA FREE */}
        <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:6, padding:'24px 28px', marginBottom:56, textAlign:'left' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#1A1612', marginBottom:3 }}>Comece grátis — 2 contratos/mês</div>
              <div style={{ fontSize:13, color:'#A09890' }}>Sem cartão de crédito. Acesso imediato.</div>
            </div>
            <button onClick={onCadastro}
              style={{ padding:'12px 24px', background:'#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              Criar conta grátis →
            </button>
          </div>
        </div>

        {/* PLANOS */}
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:28, color:'#1A1612', marginBottom:6 }}>Planos pagos</h2>
        <p style={{ fontSize:14, color:'#A09890', marginBottom:20 }}>Contratos ilimitados e cláusulas geradas por IA</p>

        <div id="campos-ass" style={{ background:'#FFFBEB', border:'1.5px solid #FCD34D', borderRadius:6, padding:'14px 18px', marginBottom:18, textAlign:'left' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#92400E', marginBottom:4 }}>⚠ Preencha seus dados antes de escolher um plano</div>
          <div style={{ fontSize:12, color:'#B45309', marginBottom:12 }}>Este e-mail será usado para ativar seu acesso após o pagamento.</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <input type="text" placeholder="Seu nome completo" value={nome} onChange={e => setNome(e.target.value)}
              style={{ padding:'10px 14px', border:`1.5px solid ${erroPag&&!nome?'#C8502A':'#FCD34D'}`, borderRadius:3, fontSize:13, fontFamily:'inherit', background:'#fff', color:'#1A1612', outline:'none' }} />
            <input type="email" placeholder="Seu melhor e-mail" value={email} onChange={e => setEmail(e.target.value)}
              style={{ padding:'10px 14px', border:`1.5px solid ${erroPag&&!email?'#C8502A':'#FCD34D'}`, borderRadius:3, fontSize:13, fontFamily:'inherit', background:'#fff', color:'#1A1612', outline:'none' }} />
          </div>
          {erroPag && <div style={{ fontSize:13, color:'#C8502A', marginTop:10, fontWeight:500 }}>{erroPag}</div>}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:540, margin:'0 auto' }}>
          {/* MENSAL */}
          <div style={{ background:'#fff', border:'2px solid #1A1612', borderRadius:6, padding:24, textAlign:'left' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#A09890', marginBottom:8 }}>Mensal</div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:30, color:'#1A1612', marginBottom:4 }}>
              {fmt$(PRECO_MENSAL)}<span style={{ fontSize:13, fontFamily:'inherit', color:'#A09890', fontWeight:400 }}>/mês</span>
            </div>
            <ul style={{ fontSize:12, color:'#5C5448', listStyle:'none', marginBottom:18, lineHeight:2.1 }}>
              <li>✓ Contratos ilimitados</li><li>✓ 4 modelos completos</li>
              <li>✓ Cláusulas por IA</li><li>✓ PDF profissional</li>
              <li>✓ Cancele quando quiser</li>
            </ul>
            <button onClick={() => handleAssinar('mensal')} disabled={loadingPlano==='mensal'}
              style={{ width:'100%', padding:'11px', background:'#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:loadingPlano==='mensal'?.6:1 }}>
              {loadingPlano==='mensal'?'Carregando...':'Assinar agora →'}
            </button>
          </div>

          {/* VITALÍCIO */}
          <div style={{ background:'#1A1612', border:'2px solid #1A1612', borderRadius:6, padding:24, textAlign:'left', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:14, right:-22, background:'#C8502A', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 28px', transform:'rotate(45deg)', letterSpacing:'.05em' }}>POPULAR</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#C8502A', marginBottom:8 }}>Vitalício</div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:30, color:'#F7F5F0', marginBottom:4 }}>
              {fmt$(PRECO_VITALICIO)}<span style={{ fontSize:13, fontFamily:'inherit', color:'#6B6358', fontWeight:400 }}> único</span>
            </div>
            <ul style={{ fontSize:12, color:'#6B6358', listStyle:'none', marginBottom:18, lineHeight:2.1 }}>
              <li style={{ color:'#C8502A' }}>✓ Tudo do Mensal</li>
              <li style={{ color:'#C8502A' }}>✓ Acesso permanente</li>
              <li style={{ color:'#C8502A' }}>✓ Atualizações inclusas</li>
              <li>✓ Sem mensalidade nunca</li>
            </ul>
            <button onClick={() => handleAssinar('vitalicio')} disabled={loadingPlano==='vitalicio'}
              style={{ width:'100%', padding:'11px', background:'#C8502A', color:'#fff', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:loadingPlano==='vitalicio'?.6:1 }}>
              {loadingPlano==='vitalicio'?'Carregando...':'Comprar acesso →'}
            </button>
          </div>
        </div>
        <p style={{ fontSize:11, color:'#A09890', marginTop:16 }}>Pagamento seguro via Mercado Pago · PIX, cartão e boleto</p>
      </section>
    </div>
  )
}

// ─── LANDING PRINCIPAL ────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { contratos } = useContratos()
  const [modal, setModal] = useState(null) // null | 'login' | 'cadastro'
  const [sessao, setSessao] = useState(() => lerSessao())

  const handleSuccess = (user) => {
    setSessao(user)
    setModal(null)
    // Free vai ao gerador, premium/admin fica na landing logada
    const ehPremium = ['mensal','vitalicio','admin'].includes(user.plano)
    if (!ehPremium) {
      setTimeout(() => navigate('/app'), 10)
    }
  }

  const handleLogout = () => { logout(); setSessao(null) }

  if (sessao) {
    return (
      <>
        {modal && <AuthModal onClose={() => setModal(null)} modoInicial={modal} onSuccess={handleSuccess} />}
        <HomeLogado sessao={sessao} contratos={contratos} onLogout={handleLogout} />
      </>
    )
  }

  return (
    <>
      {modal && <AuthModal onClose={() => setModal(null)} modoInicial={modal} onSuccess={handleSuccess} />}
      <HomeVisitante onLogin={() => setModal('login')} onCadastro={() => setModal('cadastro')} />
    </>
  )
}
