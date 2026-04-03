import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      <div className="ambient-bg">
        {/* Orbs removed for monochrome look */}
      </div>

      <nav className="navbar">
        <NavLink to="/" className="nav-brand">V-AUTH</NavLink>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <NavLink to="/engine" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Engine</NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>About</NavLink>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
