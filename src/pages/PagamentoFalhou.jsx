import { useNavigate } from 'react-router-dom'

export default function PagamentoFalhou({ pending }) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>{pending ? '⏳' : '❌'}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--ink)', marginBottom: 12 }}>
          {pending ? 'Pagamento pendente' : 'Pagamento não aprovado'}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink2)', lineHeight: 1.7, marginBottom: 32 }}>
          {pending
            ? 'Seu pagamento está sendo processado. Isso pode levar alguns minutos. Você receberá um e-mail quando for aprovado.'
            : 'Houve um problema com o pagamento. Verifique os dados do cartão ou tente outra forma de pagamento.'}
        </p>
        <button onClick={() => navigate('/')}
          style={{ padding: '14px 32px', background: 'var(--ink)', color: '#F7F5F0', border: 'none', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Tentar novamente →
        </button>
      </div>
    </div>
  )
}
