// frontend/src/components/Warenkorb.jsx
import React, { useContext, useState } from 'react';
import { CartContext } from '../contexts/CartContext';
import { ContactContext } from '../contexts/ContactContext';
import Kontaktformular from './Kontaktformular';
import './Warenkorb.css';

const Warenkorb = () => {
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
  const { deliveryAddress, invoiceAddress, isDeliveryAddressValid, clearContactData } = useContext(ContactContext);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const handleBuyNow = async () => {
    setSubmitAttempted(true);
    if (!isDeliveryAddressValid()) {
      alert("Bitte füllen Sie alle Pflichtfelder der Lieferadresse aus.");
      return;
    }

    const payload = {
      items: cartItems,
      lieferadresse: deliveryAddress,
      rechnungsadresse: invoiceAddress,
    };
    

    try {
      const response = await fetch('http://localhost:8000/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      alert("Kauf abgeschlossen!");
      clearCart();
      clearContactData();
    } catch (error) {
      console.error("Fehler beim Kauf:", error);
      alert("Beim Kauf ist ein Fehler aufgetreten.");
    }
  };

  const getImageUrl = (item) =>
    `http://localhost:8000/get_image_url?text=${encodeURIComponent(item.name)}&design=${encodeURIComponent(item.design)}&anzahl_ebenen=${item.barCount}&gesamtbreite=${item.width}`;

      return (
        <div style={{ padding: '10px' }}>
          <h1>Warenkorb</h1>
    
          {cartItems.length === 0 ? (
            <p>Ihr Warenkorb ist leer.</p>
          ) : (
            <>
              {/* Warenkorb-Tabelle */}
              <table className="warenkorb-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bild</th>
                    <th>Design</th>
                    <th>Name</th>
                    <th>Breite</th>
                    <th>Anzahl Balken</th>
                    <th>Preis</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        <img
                          src={getImageUrl(item)}
                          alt="Produktbild"
                          className="thumbnail"
                          onClick={() => setZoomedImage(getImageUrl(item))}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/fallback.png';
                          }}
                        />
                      </td>
                      <td>{item.design}</td>
                      <td>{item.name}</td>
                      <td>{item.width}</td>
                      <td>{item.barCount}</td>
                      <td>{item.price} €</td>
                      <td>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="button"
                        >
                          Entfernen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
    
              {/* Kontaktformular */}
              <Kontaktformular submitAttempted={submitAttempted} />
    
              {/* "Jetzt kaufen"-Button zentriert */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button 
                  className="button" 
                  onClick={handleBuyNow}
                >
                  Jetzt kaufen
                </button>
              </div>
            </>
          )}
    
          {/* Zoom Overlay */}
          {zoomedImage && (
            <div className="image-overlay" onClick={() => setZoomedImage(null)}>
              <div className="image-popup" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setZoomedImage(null)}>
                  ×
                </button>
                <img src={zoomedImage} alt="Zoom" />
              </div>
            </div>
          )}
        </div>
      );
    };
    
    export default Warenkorb;
    

