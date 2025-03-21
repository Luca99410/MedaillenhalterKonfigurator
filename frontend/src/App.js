// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Configurator from './components/Configurator';
import Warenkorb from './components/Warenkorb';
import About from "./components/About";
import Login from "./components/Login";   // <--- Login
import Profil from "./components/Profil"; // <--- Profil (optional)
import './App.css';
import { CartProvider } from './contexts/CartContext';
import { ContactProvider } from './contexts/ContactContext';

function App() {
  return (
    <CartProvider>
      <ContactProvider>
        <Router>
          <Navbar />
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/konfigurator" element={<Configurator />} />
              <Route path="/about" element={<About />} />
              <Route path="/warenkorb" element={<Warenkorb />} />
              <Route path="/login" element={<Login />} />     {/* WICHTIG */}
              <Route path="/profil" element={<Profil />} />   {/* Optional */}
            </Routes>
          </div>
        </Router>
      </ContactProvider>
    </CartProvider>
  );
}

export default App;
