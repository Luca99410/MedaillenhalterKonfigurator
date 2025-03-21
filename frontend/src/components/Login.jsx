// frontend/src/components/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactContext } from '../contexts/ContactContext';
import './Login.css';

// Hilfsfunktionen zum Umwandeln von Base64URL-Strings in ArrayBuffers und umgekehrt:
function base64urlToBuffer(base64urlString) {
  const padding = '='.repeat((4 - (base64urlString.length % 4)) % 4);
  const base64 = (base64urlString + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Vorformatierung der Registrierungsoptionen:
// Konvertiere challenge und user.id (als Base64URL) in ArrayBuffer
function preformatMakeCredReq(makeCredRequest) {
  makeCredRequest.challenge = base64urlToBuffer(makeCredRequest.challenge);
  makeCredRequest.user.id = base64urlToBuffer(makeCredRequest.user.id);
  return makeCredRequest;
}

// Vorformatierung der Authentifizierungsoptionen:
function preformatGetAssertReq(getAssert) {
  getAssert.challenge = base64urlToBuffer(getAssert.challenge);
  if (getAssert.allowCredentials) {
    getAssert.allowCredentials = getAssert.allowCredentials.map(cred => ({
      ...cred,
      id: base64urlToBuffer(cred.id)
    }));
  }
  return getAssert;
}

// Transformation des vom Browser zurückgegebenen Credential-Objekts in ein JSON-kompatibles Format
function transformNewCredential(credential) {
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
      // Bei Registrierung: attestationObject; bei Login: authenticatorData und signature
      attestationObject: credential.response.attestationObject
        ? bufferToBase64url(credential.response.attestationObject)
        : undefined,
      authenticatorData: credential.response.authenticatorData
        ? bufferToBase64url(credential.response.authenticatorData)
        : undefined,
      signature: credential.response.signature
        ? bufferToBase64url(credential.response.signature)
        : undefined,
      userHandle: credential.response.userHandle
        ? bufferToBase64url(credential.response.userHandle)
        : undefined,
    }
  };
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { setLoggedInUser } = useContext(ContactContext);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Registrierungsoptionen vom Backend abrufen
      const optionsRes = await fetch('http://localhost:8000/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_email: email })
      });
      if (!optionsRes.ok) {
        setError("Fehler beim Abrufen der Registrierungsoptionen");
        setLoading(false);
        return;
      }
      let options = await optionsRes.json();
      // Konvertiere Strings (Challenge, user.id) in ArrayBuffer
      options = preformatMakeCredReq(options);

      // 2. Registrierung via WebAuthn-API
      const credential = await navigator.credentials.create({ publicKey: options });
      if (!credential) {
        setError("Registrierung abgebrochen");
        setLoading(false);
        return;
      }
      const attestationResponse = transformNewCredential(credential);

      // 3. Sende den Response an das Backend zur Verifikation
      const regCompleteRes = await fetch('http://localhost:8000/webauthn/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_email: email, credential: attestationResponse })
      });
      const regData = await regCompleteRes.json();
      if (regData.status === "success") {
        alert("Registrierung erfolgreich, bitte loggen Sie sich ein.");
        setIsRegistering(false);
      } else {
        setError("Registrierung fehlgeschlagen: " + regData.message);
      }
    } catch (err) {
      console.error(err);
      setError("Fehler bei der Registrierung");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Loginoptionen vom Backend abrufen
      const optionsRes = await fetch('http://localhost:8000/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_email: email })
      });
      if (!optionsRes.ok) {
        setError("Fehler beim Abrufen der Loginoptionen");
        setLoading(false);
        return;
      }
      let options = await optionsRes.json();
      options = preformatGetAssertReq(options);

      // 2. Authentifizierung via WebAuthn-API
      const assertion = await navigator.credentials.get({ publicKey: options });
      if (!assertion) {
        setError("Login abgebrochen");
        setLoading(false);
        return;
      }
      const assertionResponse = transformNewCredential(assertion);

      // 3. Sende den Response an das Backend zur Verifikation
      const loginRes = await fetch('http://localhost:8000/webauthn/login/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_email: email, credential: assertionResponse })
      });
      const loginData = await loginRes.json();
      if (loginData.status === "success") {
        setLoggedInUser(loginData.customer);
        navigate("/");
      } else {
        setError("Login fehlgeschlagen: " + loginData.detail);
      }
    } catch (err) {
      console.error(err);
      setError("Fehler beim Login");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <h2>{isRegistering ? "Registrieren mit WebAuthn" : "Login mit WebAuthn"}</h2>
      {error && <p className="error">{error}</p>}
      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginBottom: '10px', padding: '8px' }}
      />
      <br />
      {isRegistering ? (
        <button className="button" onClick={handleRegister} disabled={loading || !email}>
          {loading ? "Bitte warten..." : "Registrieren"}
        </button>
      ) : (
        <button className="button" onClick={handleLogin} disabled={loading || !email}>
          {loading ? "Bitte warten..." : "Login"}
        </button>
      )}
      <br />
      <button className="toggle-button" onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? "Bereits registriert? Zum Login wechseln" : "Noch nicht registriert? Registrieren"}
      </button>
    </div>
  );
};

export default Login;
