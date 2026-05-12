import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './app/Layout'

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard }))
)
const Events = lazy(() =>
  import('./features/events/EventsPage').then((module) => ({ default: module.EventsPage }))
)
const Usage = lazy(() =>
  import('./features/usage/UsagePage').then((module) => ({ default: module.UsagePage }))
)
const Sessions = lazy(() =>
  import('./features/sessions/SessionsPage').then((m) => ({ default: m.SessionsPage }))
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={null}>
                <Events />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={null}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="usage"
            element={
              <Suspense fallback={null}>
                <Usage />
              </Suspense>
            }
          />
          <Route
            path="sessions"
            element={
              <Suspense fallback={null}>
                <Sessions />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
