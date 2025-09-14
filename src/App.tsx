import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { Auth } from './components/Auth'
import { Home } from './pages/Home'
import { Diary } from './pages/Diary'
import { Relaxation } from './pages/Relaxation'
import { Community } from './pages/Community'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="diary" element={<Diary />} />
          <Route path="relaxation" element={<Relaxation />} />
          <Route path="community" element={<Community />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App