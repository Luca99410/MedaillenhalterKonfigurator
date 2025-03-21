import React, { useState, useEffect, useContext, useRef } from 'react';
import MedalHolder from './MedalHolder';
import './Button.css';
import './Configurator.css';
import { CartContext } from '../contexts/CartContext';

const Configurator = () => {
  const [design, setDesign] = useState('Laufen');
  const [name, setName] = useState('TEXT');
  const [minWidth, setMinWidth] = useState(400);
  const [width, setWidth] = useState(400);
  const [price, setPrice] = useState(0);
  const [barCount, setBarCount] = useState(3);
  const [maxReached, setMaxReached] = useState(false);
  const { addToCart } = useContext(CartContext);

  const MAX_WIDTH = 1000;

  const backgroundImageUrl =
    design === 'Laufen'
      ? '/running.jpg'
      : design === 'Radfahren'
      ? '/cycling.jpg'
      : '/swimming.jpg';

  const fetchWidthAndPrice = async (text, design, ebene, customWidth = null) => {
    const response = await fetch('http://localhost:8000/medaillenhalter_info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        design,
        anzahl_ebenen: ebene,
        user_breite: customWidth ?? 0
      })
    });
    const data = await response.json();

    setMinWidth(data.mindestbreite);
    setWidth(data.width);
    setPrice(parseFloat(data.price.toFixed(2)));
    setMaxReached(data.width > MAX_WIDTH);
  };

  useEffect(() => {
    fetchWidthAndPrice(name, design, barCount);
  }, [name, design, barCount]);

  const handleWidthChange = (val) => {
    fetchWidthAndPrice(name, design, barCount, val);
  };

  const handleNameChange = (e) => {
    const raw = e.target.value;
    const filtered = raw.replace(/[^a-zA-Z\s]/g, '');
    const upper = filtered.toUpperCase();
    const isDeleting = upper.length < name.length;

    if (isDeleting || width < MAX_WIDTH) {
      setName(upper);
    }
  };

  const handleAddToCart = async () => {
    await fetch('http://localhost:8000/generate_medaillenhalter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: name, design, anzahl_ebenen: barCount })
    });
    addToCart({ design, name, width, barCount, price });
  };

  const containerStyle = {
    position: 'relative',
    minHeight: '100vh',
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 1,
    padding: '20px',
    textAlign: 'center',
    color: '#fff',
    fontSize: '18px'
  };

  return (
    <div style={containerStyle}>
      <div
        className="bg-image"
        style={{ backgroundImage: `url('${backgroundImageUrl}')`, '--brightness': 0.7 }}
      ></div>
      <div style={contentStyle}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Konfigurator</h1>

        <div style={{ marginBottom: '20px' }}>
          <label>Design wählen: </label>
          <select value={design} onChange={(e) => setDesign(e.target.value)}>
            <option value="Laufen">Laufen</option>
            <option value="Radfahren">Radfahren</option>
            <option value="Schwimmen">Schwimmen</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Text eingeben: </label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Nur Buchstaben A-Z und Leerzeichen"
            style={{ textTransform: 'uppercase' }}
          />
          {maxReached && (
            <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
              Maximale Breite erreicht – bitte kürzeren Text eingeben.
            </div>
          )}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Breite: {width} mm</label>
          <input
            type="range"
            min={minWidth}
            max={MAX_WIDTH}
            step={10}
            value={width}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            style={{
              appearance: 'none',
              width: '30%',
              height: '8px',
              borderRadius: '5px',
              background: '#fff',
              outline: 'none',
              marginTop: '5px'
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Anzahl Balken: </label>
          <select value={barCount} onChange={(e) => setBarCount(Number(e.target.value))}>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Preis: </label>
          <span>{price.toFixed(2)} €</span>
        </div>

        <button className="button" style={{ marginTop: '10px' }} onClick={handleAddToCart}>
          In den Warenkorb
        </button>

        <div style={{ marginTop: '40px', position: 'relative' }}>
          <MedalHolder design={design} name={name} width={width} barCount={barCount} />
          <div style={{ color: 'white' }}>{width} mm</div>
        </div>
      </div>
    </div>
  );
};

export default Configurator;
