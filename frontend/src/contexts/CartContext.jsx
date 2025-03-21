// frontend/src/contexts/CartContext.jsx
import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [counter, setCounter] = useState(1);

  const addToCart = (item) => {
    const newItem = { id: counter, ...item };
    setCartItems(prevItems => [...prevItems, newItem]);
    setCounter(prevCounter => prevCounter + 1);
  };

  const removeFromCart = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
