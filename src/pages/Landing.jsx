import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PRECO_MENSAL = (Number(import.meta.env.VITE_PRECO_MENSAL) || 3700) / 100
const PRECO_VITALICIO = (Number(import.meta.env.VITE_PRECO_VITALICIO) || 19700) / 100

const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Landing() {
  const navigate = useNavigate()
  const [loadingPlano, setLoadingPlano] = useState(null)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')

  const handleAssinar = async (plano) => {
    if (!email || !nome) {
      setErro('Preencha seu nome e e-mail para continuar.')
      return
    }
    setErro('')
    setLoadingPlano(plano)
    try {
      const res = await fetch('/api/criar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano, email, nome }),
      })
      const data = await res.json()
      if (data.init_point) {
        // Em produção usa init_point; em dev usa sandbox_init_point
        const url = import.meta.env.DEV ? data.sandbox_init_point : data.init_point
        window.location.href = url
      } else {
        setErro('Erro ao iniciar pagamento. Tente novamente.')
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoadingPlano(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)' }}>
          Contrato<span style={{ color: 'var(--accent)' }}>Freelancer</span>
        </span>
        <button onClick={() => navigate('/app')} style={{ padding: '8px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--border2)', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink2)' }}>
          Já sou assinante →
        </button>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px 64px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', background: '#FEF3ED', padding: '4px 12px', borderRadius: 2, marginBottom: 24 }}>
          Gerador com IA · Cláusulas personalizadas
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 1.1, color: 'var(--ink)', marginBottom: 20 }}>
          Contratos profissionais em<br /><em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>3 minutos.</em> Sem advogado.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--ink2)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 48px' }}>
          Preencha o formulário, a IA gera cláusulas personalizadas para o seu projeto e você baixa o PDF pronto para assinar.
        </p>

        {/* SOCIAL PROOF */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 64, flexWrap: 'wrap' }}>
          {['4 modelos de contrato', 'Cláusulas geradas por IA', 'PDF em 1 clique', 'Legislação brasileira'].map(item => (
            <div key={item} style={{ fontSize: 14, color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span> {item}
            </div>
          ))}
        </div>

        {/* DEMO BLOCK */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: 32, marginBottom: 64, textAlign: 'left' }}>
          <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 16 }}>Experimente grátis</div>
          <button onClick={() => navigate('/app')} style={{ width: '100%', padding: '14px 24px', background: 'var(--ink)', color: '#F7F5F0', border: 'none', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
            Gerar contrato grátis (2 contratos/mês) →
          </button>
          <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center' }}>Sem cartão · Acesso imediato</div>
        </div>

        {/* PRICING */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--ink)', marginBottom: 8 }}>Planos</h2>
        <p style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 32 }}>Assine para contratos ilimitados e cláusulas geradas por IA</p>

        {/* EMAIL/NOME INPUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, maxWidth: 560, margin: '0 auto 24px' }}>
          <input
            type="text" placeholder="Seu nome completo"
            value={nome} onChange={e => setNome(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'var(--font-body)', background: 'var(--surface)', color: 'var(--ink)', outline: 'none' }}
          />
          <input
            type="email" placeholder="Seu melhor e-mail"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', fontSize: 14, fontFamily: 'var(--font-body)', background: 'var(--surface)', color: 'var(--ink)', outline: 'none' }}
          />
        </div>
        {erro && <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 16 }}>{erro}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600, margin: '0 auto' }}>
          {/* PLANO MENSAL */}
          <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', borderRadius: 6, padding: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 8 }}>Mensal</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--ink)', marginBottom: 4 }}>
              {fmt(PRECO_MENSAL)}<span style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink3)', fontWeight: 400 }}>/mês</span>
            </div>
            <ul style={{ fontSize: 13, color: 'var(--ink2)', listStyle: 'none', marginBottom: 20, lineHeight: 2 }}>
              <li>✓ Contratos ilimitados</li>
              <li>✓ 4 modelos completos</li>
              <li>✓ Cláusulas geradas por IA</li>
              <li>✓ PDF profissional</li>
              <li>✓ Cancele quando quiser</li>
            </ul>
            <button onClick={() => handleAssinar('mensal')} disabled={loadingPlano === 'mensal'}
              style={{ width: '100%', padding: '12px 0', background: 'var(--ink)', color: '#F7F5F0', border: 'none', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: loadingPlano === 'mensal' ? .6 : 1 }}>
              {loadingPlano === 'mensal' ? 'Carregando...' : 'Assinar agora →'}
            </button>
          </div>

          {/* PLANO VITALÍCIO */}
          <div style={{ background: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 6, padding: 28, textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 14, right: -22, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 32px', transform: 'rotate(45deg)', letterSpacing: '.05em' }}>POPULAR</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent2)', marginBottom: 8 }}>Vitalício</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: '#F7F5F0', marginBottom: 4 }}>
              {fmt(PRECO_VITALICIO)}<span style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink3)', fontWeight: 400 }}> único</span>
            </div>
            <ul style={{ fontSize: 13, color: '#9A9088', listStyle: 'none', marginBottom: 20, lineHeight: 2 }}>
              <li style={{ color: 'var(--accent2)' }}>✓ Tudo do Mensal</li>
              <li style={{ color: 'var(--accent2)' }}>✓ Acesso permanente</li>
              <li style={{ color: 'var(--accent2)' }}>✓ Atualizações inclusas</li>
              <li style={{ color: 'var(--accent2)' }}>✓ Suporte por e-mail</li>
              <li>✓ Sem mensalidade nunca</li>
            </ul>
            <button onClick={() => handleAssinar('vitalicio')} disabled={loadingPlano === 'vitalicio'}
              style={{ width: '100%', padding: '12px 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: loadingPlano === 'vitalicio' ? .6 : 1 }}>
              {loadingPlano === 'vitalicio' ? 'Carregando...' : 'Comprar acesso →'}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 20, textAlign: 'center' }}>
          Pagamento seguro via Mercado Pago · PIX, cartão e boleto aceitos
        </p>
      </section>
    </div>
  )
}
