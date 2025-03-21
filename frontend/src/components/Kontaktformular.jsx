// frontend/src/components/Kontaktformular.jsx
import React, { useContext, useState } from 'react';
import { ContactContext } from '../contexts/ContactContext';
import './Kontaktformular.css';

const Kontaktformular = ({ submitAttempted }) => {
  const {
    deliveryAddress,
    invoiceAddress,
    useDeliveryForInvoice,
    updateDeliveryAddress,
    updateInvoiceAddress,
    toggleUseDeliveryForInvoice
  } = useContext(ContactContext);

  // Lokaler State, ob Rechnungsadresse-Formular angezeigt werden soll
  const [showInvoiceAddress, setShowInvoiceAddress] = useState(false);

  // Validierung
  const validate = () => {
    let newErrors = {};
    if (!deliveryAddress.gender) newErrors.gender = "Anrede ist erforderlich";
    if (!deliveryAddress.firstName) newErrors.firstName = "Vorname ist erforderlich";
    if (!deliveryAddress.lastName) newErrors.lastName = "Nachname ist erforderlich";
    if (!deliveryAddress.email) newErrors.email = "E-Mail ist erforderlich";
    if (!deliveryAddress.street) newErrors.street = "Straße ist erforderlich";
    if (!deliveryAddress.houseNumber) newErrors.houseNumber = "Hausnummer ist erforderlich";
    if (!deliveryAddress.postalCode) newErrors.postalCode = "PLZ ist erforderlich";
    if (!deliveryAddress.city) newErrors.city = "Stadt ist erforderlich";
    return newErrors;
  };

  const errors = submitAttempted ? validate() : {};

  return (
    <div className="kontaktformular">
      <h2>Lieferadresse</h2>
      
      <div className="form-group">
        <select
          value={deliveryAddress.gender}
          onChange={(e) => updateDeliveryAddress('gender', e.target.value)}
          className={errors.gender ? 'error' : ''}
        >
          <option value="">Anrede</option>
          <option value="Herr">Herr</option>
          <option value="Frau">Frau</option>
          <option value="Divers">Divers</option>
        </select>
        {errors.gender && <span className="error-text">{errors.gender}</span>}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Vorname"
          value={deliveryAddress.firstName}
          onChange={(e) => updateDeliveryAddress('firstName', e.target.value)}
          className={errors.firstName ? 'error' : ''}
        />
        {errors.firstName && <span className="error-text">{errors.firstName}</span>}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Nachname"
          value={deliveryAddress.lastName}
          onChange={(e) => updateDeliveryAddress('lastName', e.target.value)}
          className={errors.lastName ? 'error' : ''}
        />
        {errors.lastName && <span className="error-text">{errors.lastName}</span>}
      </div>

      <div className="form-group">
        <input
          type="email"
          placeholder="E-Mail"
          value={deliveryAddress.email}
          onChange={(e) => updateDeliveryAddress('email', e.target.value)}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Straße"
          value={deliveryAddress.street}
          onChange={(e) => updateDeliveryAddress('street', e.target.value)}
          className={errors.street ? 'error' : ''}
        />
        {errors.street && <span className="error-text">{errors.street}</span>}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Hausnummer"
          value={deliveryAddress.houseNumber}
          onChange={(e) => updateDeliveryAddress('houseNumber', e.target.value)}
          className={errors.houseNumber ? 'error' : ''}
        />
        {errors.houseNumber && <span className="error-text">{errors.houseNumber}</span>}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="PLZ"
          value={deliveryAddress.postalCode}
          onChange={(e) => updateDeliveryAddress('postalCode', e.target.value)}
          className={errors.postalCode ? 'error' : ''}
        />
        {errors.postalCode && <span className="error-text">{errors.postalCode}</span>}
      </div>

      <div className="form-group">
        <input
          type="text"
          placeholder="Stadt"
          value={deliveryAddress.city}
          onChange={(e) => updateDeliveryAddress('city', e.target.value)}
          className={errors.city ? 'error' : ''}
        />
        {errors.city && <span className="error-text">{errors.city}</span>}
      </div>

      <h2>Rechnungsadresse</h2>
      <div className="form-group checkbox-group">
        <input
          type="checkbox"
          checked={useDeliveryForInvoice}
          onChange={() => {
            toggleUseDeliveryForInvoice();
            setShowInvoiceAddress(false);
          }}
          id="useDeliveryForInvoice"
        />
        <label htmlFor="useDeliveryForInvoice">
          Rechnungsadresse aus Lieferadresse übernehmen
        </label>
      </div>

      {/* Falls Rechnungsadresse übernommen wird, nur Button zum Aufklappen */}
      {useDeliveryForInvoice && (
        <button
          type="button"
          className="button"
          onClick={() => setShowInvoiceAddress(prev => !prev)}
        >
          {showInvoiceAddress ? "Rechnungsadresse ausblenden" : "Rechnungsadresse bearbeiten"}
        </button>
      )}

      {/* Rechnungsadresse Felder nur anzeigen, wenn nicht übernommen ODER manuell aufklappen */}
      {(!useDeliveryForInvoice || showInvoiceAddress) && (
        <>
          <div className="form-group">
            <select
              value={invoiceAddress.gender}
              onChange={(e) => updateInvoiceAddress('gender', e.target.value)}
            >
              <option value="">Anrede</option>
              <option value="Herr">Herr</option>
              <option value="Frau">Frau</option>
              <option value="Divers">Divers</option>
            </select>
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Vorname"
              value={invoiceAddress.firstName}
              onChange={(e) => updateInvoiceAddress('firstName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Nachname"
              value={invoiceAddress.lastName}
              onChange={(e) => updateInvoiceAddress('lastName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="E-Mail"
              value={invoiceAddress.email}
              onChange={(e) => updateInvoiceAddress('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Straße"
              value={invoiceAddress.street}
              onChange={(e) => updateInvoiceAddress('street', e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Hausnummer"
              value={invoiceAddress.houseNumber}
              onChange={(e) => updateInvoiceAddress('houseNumber', e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="PLZ"
              value={invoiceAddress.postalCode}
              onChange={(e) => updateInvoiceAddress('postalCode', e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Stadt"
              value={invoiceAddress.city}
              onChange={(e) => updateInvoiceAddress('city', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Kontaktformular;
