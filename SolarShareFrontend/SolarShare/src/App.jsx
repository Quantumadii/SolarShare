import React, { useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MainPage from './components/MainPage'
import Login from './components/Login'
import Signup from './components/Signup'
import Logout from './components/Logout'
import Dashboard from './components/Dashboard'
import CreateListing from './components/CreateListing'
import ClusterMarketplace from './components/ClusterMarketplace'
import Profile from './components/Profile'
import Notifications from './components/Notifications'
import SolarMap from './components/SolarMap'
import AboutUs from './components/AboutUs'
import Help from './components/Help'
import ContactUs from './components/ContactUs'
import { useAuth } from './context/AuthContext'

function App() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const publicRoutes = ['/', '/about', '/help', '/contact', '/login', '/signup', '/logout']
  const isPublicRoute = publicRoutes.includes(location.pathname)
  const showSidebar = isAuthenticated && !isPublicRoute
  const showFooter = isPublicRoute

  const sidebarWidth = showSidebar ? (sidebarCollapsed ? 'ml-20' : 'ml-64') : ''

  return (
    <div className="theme-page-bg min-h-screen">
      <Toaster position="top-center" />
      
      {showSidebar && (
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      )}
      <Navbar sidebarCollapsed={showSidebar ? sidebarCollapsed : undefined} />
      
      <div className={`${sidebarWidth} transition-all duration-300`}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/clusters" element={<ClusterMarketplace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/map" element={<SolarMap />} />
        </Routes>
      </div>
      
      {showFooter && <Footer />}
    </div>
  )
}

export default App
