import React from 'react'
import { Menu, User } from 'lucide-react'
import { useAuthContext } from './AuthProvider'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, signOut } = useAuthContext()

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button onClick={onMenuToggle} className="md:hidden p-2">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 ml-2 md:ml-0">
              <h1 className="text-2xl font-bold text-blue-600">PreReno</h1>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="hidden sm:block text-sm text-gray-700">
                {user.first_name} {user.last_name}
              </span>
              <div className="relative group">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button className="text-gray-600 hover:text-gray-900">Sign In</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}