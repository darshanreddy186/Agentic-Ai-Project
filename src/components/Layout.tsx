// src/components/Layout.tsx

import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  Home, 
  BookOpen, 
  Heart, 
  Users, 
  LogOut,
  Menu,
  X,
  Sparkles, // For AI Chat
  UserCircle // For Profile
} from 'lucide-react'

export function Layout() {
  const { signOut } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Diary', href: '/diary', icon: BookOpen },
    { name: 'AI Chat', href: '/ai-chat', icon: Sparkles }, // Added AI Chat
    { name: 'Relaxation', href: '/relaxation', icon: Heart },
    { name: 'Community', href: '/community', icon: Users },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-green-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center shadow-md">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  MindfulYou
                </span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 shadow-inner'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            <div className="hidden md:flex items-center space-x-4">
               <Link to="/profile" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 transition-all shadow-md">
                 <UserCircle className="w-5 h-5" />
                 <span>Profile</span>
               </Link>
               <button onClick={handleSignOut} className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                  <LogOut className="w-5 h-5" />
               </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-blue-600 p-2">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)} /* ... */ >
                  <item.icon className="w-5 h-5 mr-3" /> {item.name}
                </Link>
              ))}
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} /* ... */ >
                <UserCircle className="w-5 h-5 mr-3" /> Profile
              </Link>
              <button onClick={handleSignOut} /* ... */ >
                <LogOut className="w-5 h-5 mr-3" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}