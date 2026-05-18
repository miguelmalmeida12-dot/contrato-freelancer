import { useNavigate } from 'react-router-dom'

export default function PagamentoFalhou({ pending }) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh', background:'#F7F5F0', display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
      <div style={{ maxWidth:480, textAlign:'center' }}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:26, color:'#1A1612', marginBottom:20 }}>
          TR<span style={{ color:'#C8502A' }}>A</span>CT
        </div>
        <div style={{ fontSize:56, marginBottom:20 }}>{pending ? '⏳' : '❌'}</div>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:32, color:'#1A1612', marginBottom:12 }}>
          {pending ? 'Pagamento pendente' : 'Pagamento não aprovado'}
        </h1>
        <p style={{ fontSize:15, color:'#5C5448', lineHeight:1.7, marginBottom:28 }}>
          {pending
            ? 'Seu pagamento está sendo processado. Você receberá acesso assim que for confirmado.'
            : 'Houve um problema com o pagamento. Verifique os dados ou tente outra forma de pagamento.'}
        </p>
        <button onClick={() => navigate('/')}
          style={{ padding:'12px 28px', background:'#1A1612', color:'#F7F5F0', border:'none', borderRadius:3, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          Tentar novamente →
        </button>
      </div>
    </div>
  )
}
