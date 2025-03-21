// frontend/src/components/Home.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const containerStyle = {
    position: 'relative',
    minHeight: '100vh',
    /* Falls du den Abstand zur Navbar verringern möchtest, 
       kannst du hier z.B. kein zusätzliches Padding verwenden */
  };

  const contentStyle = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    color: '#fff',
    textAlign: 'center',
    padding: '20px'
  };

  const [hover, setHover] = useState(false);

  const buttonStyle = {
    padding: '15px 30px',
    border: '2px solid #fff',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'background-color 0.3s, color 0.3s',
    marginTop: '20px'
  };

  const buttonHoverStyle = {
    backgroundColor: '#fff',
    color: '#333'
  };

  return (
    <div style={containerStyle}>
      {/* Hintergrundbild über die bg-image Klasse; --brightness kann hier angepasst werden */}
      <div 
        className="bg-image"
        style={{ backgroundImage: "url('/winner.jpg')", '--brightness': '0.7' }}
      ></div>
      <div style={contentStyle}>
        <div style={{
          fontWeight: 'bold',
          fontSize: '50px',  // Größere Schrift
          lineHeight: '1.2',
          marginBottom: '20px',
        }}>
          Du hast jede Menge Medaillen gewonnen,<br />
          aber weißt nicht, wohin damit?
        </div>
        <Link to="/konfigurator" style={{ textDecoration: 'none' }}>
          <button 
            style={{ ...buttonStyle, ...(hover ? buttonHoverStyle : {}) }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            Zum Konfigurator
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
