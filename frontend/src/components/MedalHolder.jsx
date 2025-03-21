// frontend/src/components/MedalHolder.jsx
import React from 'react';

const MedalHolder = ({ design, name, width, barCount }) => {
  const barThickness = 10; // konstante Dicke der Balken
  const theta = 35 * Math.PI / 180; // fester Winkel in Radiant

  // Damit der vertikale Abstand zwischen den Balken immer 2 · barThickness beträgt,
  // muss der Parameter s um den Faktor 1/cos(theta) skaliert werden.
  const paramIncrement = (2 * barThickness) / Math.cos(theta);
  const s_bottom = (barCount - 1) * paramIncrement;
  
  // Rotationsfunktion: Wandelt einen Parameter s in einen Punkt (x,y) um.
  const rotatePoint = (s) => ({
    x: barThickness * Math.cos(theta) + s * Math.sin(theta),
    y: -barThickness * Math.sin(theta) + s * Math.cos(theta)
  });
  
  // Für den linken, schrägen Balken: Oben anpassen, damit x exakt barThickness beträgt.
  const originalTop = rotatePoint(0);
  const topAttachment = { x: barThickness, y: originalTop.y };
  const botAttachment = rotatePoint(s_bottom);
  
  // Polygon für den schrägen Balken (linke E-Form)
  const A = { x: 0, y: topAttachment.y };
  const B = { x: topAttachment.x, y: topAttachment.y };
  const C = { x: botAttachment.x, y: botAttachment.y };
  const D = { x: botAttachment.x, y: botAttachment.y - 0.2 + barThickness };
  const leftBarPolygonPoints = `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`;
  
  // Funktion zur Erzeugung eines horizontalen Balkens als Polygon.
  const getHorizontalBarPoints = (startPoint, index) => {
    if (index === 0) {
      return `${startPoint.x},${startPoint.y} ${width / 2},${startPoint.y} ${width / 2},${startPoint.y + barThickness} ${startPoint.x},${startPoint.y + barThickness}`;
    } else {
      return `${startPoint.x},${startPoint.y} ${width / 4 + index * barThickness},${startPoint.y} ${width / 4 + index * barThickness + Math.sin(theta) + barThickness * Math.sin(theta)},${startPoint.y + barThickness} ${startPoint.x},${startPoint.y + barThickness}`;
    }
  };

  const getMiddleHorizontalBarPoints = (startPoint, index) => {
    if (index === 0) {
      return `${startPoint.x},${startPoint.y} ${width / 2},${startPoint.y} ${width / 2},${startPoint.y + barThickness} ${startPoint.x},${startPoint.y + barThickness}`;
    } else {
      return `${width / 2},${startPoint.y} ${width / 4 + barThickness + index * barThickness},${startPoint.y} ${width / 4 + barThickness + Math.sin(theta) + index * barThickness + barThickness * Math.sin(theta)},${startPoint.y + barThickness} ${width / 2},${startPoint.y + barThickness}`;
    }
  };
  
  // Erzeuge die horizontalen Balken: Für jeden Balken wird s = i · paramIncrement gewählt.
  const horizontalBars = [];
  for (let i = 0; i < barCount; i++) {
    const s = i * paramIncrement;
    let point = rotatePoint(s);
    // Beim obersten Balken x auf barThickness setzen, um bündig mit dem schrägen Balken zu beginnen.
    if (i === 0) {
      point = { x: barThickness, y: point.y };
    }
    horizontalBars.push(point);
  }
  
  // Ermittlung des viewBox-Bereichs, sodass alle Elemente sichtbar sind.
  const yValues = [
    topAttachment.y, botAttachment.y, D.y, 
    ...horizontalBars.map(p => p.y), 
    ...horizontalBars.map(p => p.y + barThickness)
  ];
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const svgHeight = maxY - minY + 10;
  const translateY = -minY;

  // Auswahl des Bildes abhängig vom design-Prop
  const imageSrc =
    design === 'Schwimmen'
      ? 'Schwimmer.png'
      : design === 'Laufen'
      ? 'Lauefer.png'
      : design === 'Radfahren'
      ? 'Radfahrer.png'
      : null;

  // Festlegen der Bildgröße und Position
  const imageWidth = 50;
  const imageHeight = 50;
  const offset = 50; // Abstand für Bild zu Rand
  // Die Bilder werden relativ positioniert.
  const leftImageX = 0 + offset - (imageWidth/2);
  const rightImageX = width - offset - (imageWidth/2);
  // Textposition (wird auch für die vertikale Ausrichtung der Bilder genutzt)
  const textY = horizontalBars[0].y + 7;

  return (
    <svg 
      viewBox={`0 -32 ${width} ${svgHeight + 32}`} 
      preserveAspectRatio="xMidYMid meet"
      style={{ border: '0px solid #ccc', display: 'block', margin: 'auto', width: '75%' }}
    >
      <g transform={`translate(0, ${translateY})`}>
        {/* Linke E-Form */}
        <g>
          <polygon points={leftBarPolygonPoints} fill="#ffff" stroke="#ffff" />
          {horizontalBars.map((point, index) => (
            <polygon key={index} points={getHorizontalBarPoints(point, index)} fill="#ffff" stroke="#ffff" />
          ))}
          {horizontalBars.map((point, index) => (
            <polygon key={index} points={getMiddleHorizontalBarPoints(point, index)} fill="#ffff" stroke="#ffff" />
          ))}
        </g>
        {/* Rechte E-Form (gespiegelt) */}
        <g transform={`translate(${width}, 0) scale(-1, 1)`}>
          <polygon points={leftBarPolygonPoints} fill="#ffff" stroke="#ffff" />
          {horizontalBars.map((point, index) => (
            <polygon key={index} points={getHorizontalBarPoints(point, index)} fill="#ffff" stroke="#ffff" />
          ))}
          {horizontalBars.map((point, index) => (
            <polygon key={index} points={getMiddleHorizontalBarPoints(point, index)} fill="#ffff" stroke="#ffff" />
          ))}
        </g>
        {/* Vertikaler Balken in der Mitte */}
        <rect 
          x={width / 2 - barThickness / 2} 
          y={0} 
          width={barThickness} 
          height={svgHeight-20} 
          fill="#ffff" 
          stroke="#ffff" 
        />


        {/* Name als SVG-Text */}
        <text 
          x={width / 2} 
          y={textY} 
          dominantBaseline="text-after-edge" 
          textAnchor="middle" 
          fill="#ffff" 
          fontFamily="Nunito, sans-serif"  
          fontSize="32"
        >
          {name}
        </text>
        {/* Bedingtes Rendering der Bilder links und rechts vom Text */}
        {imageSrc && (
          <>
            <image 
              href={imageSrc} 
              x={leftImageX} 
              y={textY - imageHeight / 2 - 22} 
              width={imageWidth} 
              height={imageHeight} 
            />
            <image 
              href={imageSrc} 
              x={rightImageX} 
              y={textY - imageHeight / 2 - 22} 
              width={imageWidth} 
              height={imageHeight} 
            />
          </>
        )}
      </g>

      {/* Horizontale Linie ganz unten */}
      <rect 
          x={0}
          y={svgHeight - 2}
          width={width}
          height={1}
          fill="#ffffff"
        />
    </svg>
  );
};

export default MedalHolder;
