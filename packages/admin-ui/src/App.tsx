import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { CommunicationPanel } from './components/CommunicationPanel'
import './index.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Dashboard />
      <CommunicationPanel />
    </div>
  )
}

export default App
