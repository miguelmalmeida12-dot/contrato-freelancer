import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Gerador from './pages/Gerador.jsx'
import Perfil from './pages/Perfil.jsx'
import Sucesso from './pages/Sucesso.jsx'
import PagamentoFalhou from './pages/PagamentoFalhou.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Gerador />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/sucesso" element={<Sucesso />} />
      <Route path="/pagamento-falhou" element={<PagamentoFalhou />} />
      <Route path="/pagamento-pendente" element={<PagamentoFalhou pending />} />
    </Routes>
  )
}
