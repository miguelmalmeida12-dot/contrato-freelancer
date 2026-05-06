import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'

export default function Sucesso() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const plano = params.get('plano') || 'mensal'

  useEffect(() => {
    // Aqui você pode salvar o status de pagamento no localStorage
    // para liberar o acesso no frontend enquanto o webhook processa
    localStorage.setItem('plano_ativo', plano)
    localStorage.setItem('plano_desde', new Date().toISOString())
  }, [plano])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--ink)', marginBottom: 12 }}>
          Pagamento aprovado!
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink2)', lineHeight: 1.7, marginBottom: 32 }}>
          Seu acesso ao plano <strong>{plano === 'vitalicio' ? 'Vitalício' : 'Pro Mensal'}</strong> está liberado.
          Você receberá um e-mail de confirmação em breve.
        </p>
        <button
          onClick={() => navigate('/app')}
          style={{ padding: '14px 32px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Gerar meu primeiro contrato →
        </button>
      </div>
    </div>
  )
}
