import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Engine from './pages/Engine';
import About from './pages/About';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="engine" element={<Engine />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
