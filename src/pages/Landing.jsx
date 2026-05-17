import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, cadastrarFree, isLoggedIn, isPremium, isAdmin, getUser } from '../lib/auth.js'

const PRECO_MENSAL   = (Number(import.meta.env.VITE_PRECO_MENSAL)   || 3700)  / 100
const PRECO_VITALICIO= (Number(import.meta.env.VITE_PRECO_VITALICIO) || 19700) / 100
const fmt = v => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size=22, onClick }) {
  return (
    <span onClick={onClick} style={{ fontFamily:'Georgia,serif', fontSize:size, color:'#1A1612', cursor:onClick?'pointer':'default', userSelect:'none', letterSpacing:'-.02em' }}>
      TR<span style={{ color:'#C8502A' }}>A</span>CT
    </span>
  )
}

// ─── INPUT HELPER ─────────────────────────────────────────────────────────────
function Input({ label, type='text', value, onChange, placeholder, autoFocus }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#5C5448', letterSpacing:'.04em', textTransform:'uppercase', marginBottom:5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        style={{ width:'100%', padding:'11px 14px', border:'1px solid #CEC8BF', borderRadius:3, fontSize:14, fontFamily:'inherit', background:'#FAFAF8', color:'#1A1612', outline:'none', boxSizing:'border-box' }} />
    </div>
  )
}

// ─── MODAL DE AUTH (LOGIN + CADASTRO) ─────────────────────────────────────────
function AuthModal({ onClose, modo: modoInicial = 'login' }) {
  const navigate = useNavigate()
  const [modo, setModo]       = useState(modoInicial) // 'login' | 'cadastro'
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [confirmar, setConf]  = useState('')
  const [erro, setErro]       = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e?.preventDefault()
    setErro(''); setLoading(true)

    setTimeout(() => {
      if (modo === 'login') {
        const res = login(email, senha)
        if (res.ok) {
          onClose()
          // Admin e premium vão para o perfil; free vai direto para o gerador
          navigate(isAdmin() || isPremium() ? '/perfil' : '/app')
        } else {
          setErro(res.erro)
          setLoading(false)
        }
      } else {
        const res = cadastrarFree(email, senha, confirmar)
        if (res.ok) {
          onClose()
          navigate('/app')
        } else {
          setErro(res.erro)
          setLoading(false)
        }
      }
    }, 400)
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(26,22,18,.65)', backdropFilter:'blur(4px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:8, padding:'36px 32px', width:'100%', maxWidth:400, position:'relative', boxShadow:'0 24px 64px rgba(0,0,0,.2)' }}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', fontSize:22, color:'#A09890', cursor:'pointer', lineHeight:1 }}>×</button>

        <Logo size={18} />

        {/* ABAS */}
        <div style={{ display:'flex', gap:2, margin:'20px 0 24px', background:'#F3F0EB', padding:3, borderRadius:4 }}>
          {[['login','Entrar'],['cadastro','Criar conta grátis']].map(([m, l]) => (
            <button key={m} onClick={() => { setModo(m); setErro('') }}
              style={{ flex:1, padding:'8px', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', background: modo===m ? '#fff' : 'transparent', color: modo===m ? '#1A1612' : '#7A7268', boxShadow: modo===m ? '0 1px 4px rgba(0,0,0,.08)' : 'none', transition:'all .15s' }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Input label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@email.com" autoFocus />
          <Input label="Senha" type="password" value={senha} onChange={setSenha} placeholder="••••••••" />
          {modo === 'cadastro' && (
            <Input label="Confirmar senha" type="password" value={confirmar} onChange={setConf} placeholder="••••••••" />
          )}

          {modo === 'cadastro' && (
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:4, padding:'10px 12px', fontSize:12, color:'#166534', lineHeight:1.6 }}>
              ✓ Conta grátis inclui <strong>2 contratos por mês</strong>.<br/>
              ✓ Sem cartão de crédito necessário.
            </div>
          )}

          {erro && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:4, padding:'10px 12px', fontSize:13, color:'#B91C1C', lineHeight:1.5 }}>
              {erro}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} onKeyDown={e => e.key==='Enter'&&handleSubmit()}
            style={{ width:'100%', padding:'13px', background: loading ? '#9CA3AF' : '#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:14, fontWeight:600, cursor: loading?'not-allowed':'pointer', fontFamily:'inherit', marginTop:4, transition:'background .15s' }}>
            {loading ? 'Verificando...' : modo==='login' ? 'Entrar →' : 'Criar conta e começar →'}
          </button>
        </div>

        {modo === 'login' && (
          <div style={{ fontSize:12, color:'#A09890', textAlign:'center', marginTop:18, lineHeight:1.6 }}>
            Não tem conta?{' '}
            <span onClick={() => { setModo('cadastro'); setErro('') }} style={{ color:'#C8502A', cursor:'pointer', fontWeight:600 }}>Crie grátis</span>
            {' '}· Quer acesso ilimitado?{' '}
            <span onClick={onClose} style={{ color:'#C8502A', cursor:'pointer', fontWeight:600 }}>Assine abaixo</span>
          </div>
        )}
        {modo === 'cadastro' && (
          <div style={{ fontSize:12, color:'#A09890', textAlign:'center', marginTop:18 }}>
            Já tem conta?{' '}
            <span onClick={() => { setModo('login'); setErro('') }} style={{ color:'#C8502A', cursor:'pointer', fontWeight:600 }}>Faça login</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate   = useNavigate()
  const [modal, setModal]         = useState(null)  // null | 'login' | 'cadastro'
  const [loadingPlano, setLoading]= useState(null)
  const [email, setEmail]         = useState('')
  const [nome, setNome]           = useState('')
  const [erroPag, setErroPag]     = useState('')

  const logado   = isLoggedIn()
  const premium  = isPremium()
  const admin    = isAdmin()
  const user     = getUser()

  const handleAcessoFree = () => {
    if (logado) { navigate('/app'); return }
    setModal('cadastro')
  }

  const handleAssinar = async (plano) => {
    if (!email || !nome) {
      setErroPag('⬆ Preencha seu nome e e-mail antes de escolher um plano.')
      document.getElementById('campos-assinatura')?.scrollIntoView({ behavior:'smooth', block:'center' })
      return
    }
    setErroPag(''); setLoading(plano)
    try {
      const res = await fetch('/api/criar-pagamento', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ plano, email, nome }),
      })
      const data = await res.json()
      if (data.init_point) {
        localStorage.setItem('tract_pag_email', email)
        localStorage.setItem('tract_pag_plano', plano)
        const url = import.meta.env.DEV ? data.sandbox_init_point : data.init_point
        window.location.href = url
      } else { setErroPag('Erro ao iniciar pagamento. Tente novamente.') }
    } catch { setErroPag('Erro de conexão. Tente novamente.') }
    finally { setLoading(null) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0' }}>
      {modal && <AuthModal onClose={() => setModal(null)} modo={modal} />}

      {/* NAV */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 32px', borderBottom:'1px solid #E2DDD6', background:'#fff', position:'sticky', top:0, zIndex:50 }}>
        <Logo size={22} onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} />
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {logado ? (
            <>
              <span style={{ fontSize:13, color:'#5C5448' }}>
                {admin ? '👑 Admin' : premium ? '⭐ '+user?.plano : '🆓 Free'}
              </span>
              <button onClick={() => navigate('/perfil')}
                style={{ padding:'8px 16px', borderRadius:3, border:'1px solid #CEC8BF', background:'none', cursor:'pointer', fontSize:13, color:'#5C5448', fontFamily:'inherit' }}>
                Meu perfil
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setModal('login')}
                style={{ padding:'8px 16px', borderRadius:3, border:'1px solid #CEC8BF', background:'none', cursor:'pointer', fontSize:13, color:'#5C5448', fontFamily:'inherit' }}>
                Entrar
              </button>
              <button onClick={() => setModal('cadastro')}
                style={{ padding:'8px 16px', borderRadius:3, border:'none', background:'#1A1612', color:'#F7F5F0', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
                Criar conta grátis
              </button>
            </>
          )}
        </div>
      </nav>

      <section style={{ maxWidth:720, margin:'0 auto', padding:'72px 24px 64px', textAlign:'center' }}>
        {/* BADGE */}
        <div style={{ display:'inline-block', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#C8502A', background:'#FEF3ED', padding:'4px 12px', borderRadius:2, marginBottom:20 }}>
          Gerador com IA · Cláusulas personalizadas
        </div>

        <h1 style={{ fontFamily:'Georgia,serif', fontSize:48, lineHeight:1.1, color:'#1A1612', marginBottom:18 }}>
          Contratos profissionais em<br />
          <em style={{ color:'#C8502A', fontStyle:'normal' }}>3 minutos.</em> Sem advogado.
        </h1>

        <p style={{ fontSize:17, color:'#5C5448', lineHeight:1.7, maxWidth:520, margin:'0 auto 44px' }}>
          Preencha o formulário, a IA gera cláusulas personalizadas e você baixa o PDF pronto para assinar.
        </p>

        {/* BENEFÍCIOS */}
        <div style={{ display:'flex', justifyContent:'center', gap:24, marginBottom:56, flexWrap:'wrap' }}>
          {['4 modelos de contrato','Cláusulas por IA','PDF em 1 clique','Legislação brasileira'].map(b => (
            <div key={b} style={{ fontSize:13, color:'#5C5448', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'#2D6A4F', fontWeight:700 }}>✓</span> {b}
            </div>
          ))}
        </div>

        {/* BLOCO FREE */}
        <div style={{ background:'#fff', border:'1px solid #E2DDD6', borderRadius:6, padding:'28px 32px', marginBottom:56, textAlign:'left' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1A1612', marginBottom:4 }}>
                {logado ? (admin || premium ? '✅ Acesso ilimitado ativo' : `🆓 Plano Gratuito — ${2-(user?.contratosEsteMes||0)} contrato(s) restante(s) este mês`) : 'Comece grátis — 2 contratos/mês'}
              </div>
              <div style={{ fontSize:13, color:'#A09890' }}>
                {logado && !admin && !premium ? 'Faça upgrade para contratos ilimitados.' : !logado ? 'Sem cartão de crédito. Acesso imediato.' : 'Todas as funcionalidades liberadas.'}
              </div>
            </div>
            <button onClick={handleAcessoFree}
              style={{ padding:'12px 24px', background:'#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {logado ? 'Ir para o gerador →' : 'Criar conta grátis →'}
            </button>
          </div>
        </div>

        {/* PLANOS */}
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:30, color:'#1A1612', marginBottom:6 }}>Planos pagos</h2>
        <p style={{ fontSize:14, color:'#A09890', marginBottom:20 }}>Contratos ilimitados e cláusulas geradas por IA</p>

        {/* AVISO CAMPOS */}
        <div id="campos-assinatura" style={{ background:'#FFFBEB', border:'1.5px solid #FCD34D', borderRadius:6, padding:'14px 18px', marginBottom:18, textAlign:'left' }}>
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

        {/* CARDS DE PLANO */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:560, margin:'0 auto' }}>
          {/* MENSAL */}
          <div style={{ background:'#fff', border:'2px solid #1A1612', borderRadius:6, padding:24, textAlign:'left' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#A09890', marginBottom:8 }}>Mensal</div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#1A1612', marginBottom:4 }}>
              {fmt(PRECO_MENSAL)}<span style={{ fontSize:13, fontFamily:'inherit', color:'#A09890', fontWeight:400 }}>/mês</span>
            </div>
            <ul style={{ fontSize:12, color:'#5C5448', listStyle:'none', marginBottom:18, lineHeight:2.1 }}>
              <li>✓ Contratos ilimitados</li>
              <li>✓ 4 modelos completos</li>
              <li>✓ Cláusulas por IA</li>
              <li>✓ PDF profissional</li>
              <li>✓ Cancele quando quiser</li>
            </ul>
            <button onClick={() => handleAssinar('mensal')} disabled={loadingPlano==='mensal'}
              style={{ width:'100%', padding:'11px', background:'#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:loadingPlano==='mensal'?.6:1 }}>
              {loadingPlano==='mensal' ? 'Carregando...' : 'Assinar agora →'}
            </button>
          </div>

          {/* VITALÍCIO */}
          <div style={{ background:'#1A1612', border:'2px solid #1A1612', borderRadius:6, padding:24, textAlign:'left', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:14, right:-22, background:'#C8502A', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 28px', transform:'rotate(45deg)', letterSpacing:'.05em' }}>POPULAR</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#C8502A', marginBottom:8 }}>Vitalício</div>
            <div style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#F7F5F0', marginBottom:4 }}>
              {fmt(PRECO_VITALICIO)}<span style={{ fontSize:13, fontFamily:'inherit', color:'#6B6358', fontWeight:400 }}> único</span>
            </div>
            <ul style={{ fontSize:12, color:'#6B6358', listStyle:'none', marginBottom:18, lineHeight:2.1 }}>
              <li style={{ color:'#C8502A' }}>✓ Tudo do Mensal</li>
              <li style={{ color:'#C8502A' }}>✓ Acesso permanente</li>
              <li style={{ color:'#C8502A' }}>✓ Atualizações inclusas</li>
              <li style={{ color:'#C8502A' }}>✓ Suporte por e-mail</li>
              <li>✓ Sem mensalidade nunca</li>
            </ul>
            <button onClick={() => handleAssinar('vitalicio')} disabled={loadingPlano==='vitalicio'}
              style={{ width:'100%', padding:'11px', background:'#C8502A', color:'#fff', border:'none', borderRadius:3, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:loadingPlano==='vitalicio'?.6:1 }}>
              {loadingPlano==='vitalicio' ? 'Carregando...' : 'Comprar acesso →'}
            </button>
          </div>
        </div>

        <p style={{ fontSize:11, color:'#A09890', marginTop:16, textAlign:'center' }}>
          Pagamento seguro via Mercado Pago · PIX, cartão e boleto aceitos
        </p>
      </section>
    </div>
  )
}
