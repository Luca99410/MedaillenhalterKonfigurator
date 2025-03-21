// frontend/src/contexts/ContactContext.jsx
import React, { createContext, useState } from 'react';

export const ContactContext = createContext();

const initialAddress = {
  gender: '',
  firstName: '',
  lastName: '',
  email: '',
  street: '',
  houseNumber: '',
  postalCode: '',
  city: ''
};

export const ContactProvider = ({ children }) => {
  const [deliveryAddress, setDeliveryAddress] = useState({ ...initialAddress });
  const [invoiceAddress, setInvoiceAddress] = useState({ ...initialAddress });
  const [useDeliveryForInvoice, setUseDeliveryForInvoice] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const updateDeliveryAddress = (field, value) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
    if (useDeliveryForInvoice) {
      setInvoiceAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const updateInvoiceAddress = (field, value) => {
    setInvoiceAddress(prev => ({ ...prev, [field]: value }));
  };

  const toggleUseDeliveryForInvoice = () => {
    setUseDeliveryForInvoice(prev => {
      const newVal = !prev;
      if (newVal) {
        setInvoiceAddress({ ...deliveryAddress });
      } else {
        setInvoiceAddress({ ...initialAddress });
      }
      return newVal;
    });
  };

  const clearContactData = () => {
    setDeliveryAddress({ ...initialAddress });
    setInvoiceAddress({ ...initialAddress });
    setUseDeliveryForInvoice(false);
  };

  const isDeliveryAddressValid = () => {
    return (
      deliveryAddress.gender &&
      deliveryAddress.firstName &&
      deliveryAddress.lastName &&
      deliveryAddress.email &&
      deliveryAddress.street &&
      deliveryAddress.houseNumber &&
      deliveryAddress.postalCode &&
      deliveryAddress.city
    );
  };

  return (
    <ContactContext.Provider value={{
      deliveryAddress,
      invoiceAddress,
      useDeliveryForInvoice,
      updateDeliveryAddress,
      updateInvoiceAddress,
      toggleUseDeliveryForInvoice,
      clearContactData,
      isDeliveryAddressValid,
      loggedInUser,
      setLoggedInUser
    }}>
      {children}
    </ContactContext.Provider>
  );
};
