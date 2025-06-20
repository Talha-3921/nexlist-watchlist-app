import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Watchlist from './pages/Watchlist';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import MediaDetails from './pages/MediaDetails';
import SharedWatchlist from './pages/SharedWatchlist';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isSharedPage = location.pathname.startsWith('/shared/');
  const shouldShowNavbar = !isHomePage && !isAuthPage && !isSharedPage;

  return (
    <div className="App">
      {shouldShowNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/Watchlist" element={
          <ProtectedRoute>
            <Watchlist />
          </ProtectedRoute>
        } />
        <Route path="/discover" element={
          <ProtectedRoute>
            <Discover />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/media/:id" element={
          <ProtectedRoute>
            <MediaDetails />
          </ProtectedRoute>
        } />
        <Route path="/shared/:shareId/:userId?" element={<SharedWatchlist />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer position="bottom-right" theme="dark" />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
