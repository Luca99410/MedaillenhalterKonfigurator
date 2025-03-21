// frontend/src/components/Profil.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ContactContext } from '../contexts/ContactContext';
import './Warenkorb.css'; // Wiederverwenden der gleichen Styles wie im Warenkorb
import './Profil.css'; // Optional: zusätzliche Styles für das Profil

const Profil = () => {
  const { loggedInUser } = useContext(ContactContext);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (loggedInUser && loggedInUser.id) {
        try {
          const res = await fetch(`http://localhost:8000/profile/${loggedInUser.id}`);
          const data = await res.json();
          setProducts(data.products);
        } catch (err) {
          console.error("Fehler beim Laden des Profils", err);
        }
      }
    };
    fetchProfile();
  }, [loggedInUser]);

  if (!loggedInUser) {
    return <p>Bitte logge dich ein, um dein Profil anzuzeigen.</p>;
  }

  return (
    <div className="profil-container" style={{ padding: '20px' }}>
      <h2>Dein Profil</h2>
      <table className="warenkorb-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Datum</th>
            <th>Design</th>
            <th>Name</th>
            <th>Breite</th>
            <th>Anzahl Balken</th>
            <th>Preis</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="8">Keine Bestellungen gefunden.</td>
            </tr>
          ) : (
            products.map(prod => (
              <tr key={prod.id}>
                <td>{prod.id}</td>
                <td>{new Date(prod.created_at).toLocaleString()}</td>
                <td>{prod.design}</td>
                <td>{prod.name}</td>
                <td>{prod.width}</td>
                <td>{prod.barCount}</td>
                <td>{prod.price} €</td>
                <td>{prod.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Profil;
