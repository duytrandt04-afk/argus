import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Events } from './pages/Events'
import { Usage } from './pages/Usage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Events />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="usage" element={<Usage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
