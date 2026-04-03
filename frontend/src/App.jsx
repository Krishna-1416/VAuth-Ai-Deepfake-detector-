import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Engine from './pages/Engine';
import Settings from './pages/Settings';
import LiveStream from './pages/LiveStream';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="engine" element={<Engine />} />
          <Route path="settings" element={<Settings />} />
          <Route path="live" element={<LiveStream />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
