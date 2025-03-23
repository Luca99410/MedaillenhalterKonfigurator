import sys
import os
# Füge den 'extern'-Ordner zum Suchpfad hinzu
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "extern"))

import base64, json 
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy import Column, Integer, Float, String, ForeignKey, select, DateTime
from fastapi.responses import FileResponse
from generate_medaillenhalter_dxf_png_svg import get_width_of_medaillenhalter, get_medaillenhalter

# Importiere WebAuthn-Funktionen aus dem extern-Ordner
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    options_to_json,
    generate_authentication_options,
    verify_authentication_response,
    base64url_to_bytes,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorAttachment,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    PublicKeyCredentialHint,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)

# ------------------------------------------------------------------------
# Datenbankkonfiguration und Modelle
# ------------------------------------------------------------------------
DATABASE_URL = "sqlite+aiosqlite:///./MedaillenDatenbank.db"
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# In-Memory Challenge-Speicher (in Produktion bitte persistent speichern)
registration_challenges = {}
authentication_challenges = {}

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Lieferadresse
    lieferadresse_gender = Column(String, nullable=True)
    lieferadresse_firstName = Column(String, nullable=True)
    lieferadresse_lastName = Column(String, nullable=True)
    lieferadresse_email = Column(String, unique=True, index=True, nullable=False)
    lieferadresse_street = Column(String, nullable=True)
    lieferadresse_houseNumber = Column(String, nullable=True)
    lieferadresse_postalCode = Column(String, nullable=True)
    lieferadresse_city = Column(String, nullable=True)
    # Rechnungsadresse
    rechnungsadresse_gender = Column(String, nullable=True)
    rechnungsadresse_firstName = Column(String, nullable=True)
    rechnungsadresse_lastName = Column(String, nullable=True)
    rechnungsadresse_email = Column(String, nullable=False)
    rechnungsadresse_street = Column(String, nullable=True)
    rechnungsadresse_houseNumber = Column(String, nullable=True)
    rechnungsadresse_postalCode = Column(String, nullable=True)
    rechnungsadresse_city = Column(String, nullable=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    design = Column(String)
    name = Column(String)
    width = Column(Integer)
    barCount = Column(Integer)
    price = Column(Float)
    status = Column(String, default="bestellt")
    customer_id = Column(Integer, ForeignKey("customers.id"))
    customer = relationship("Customer")

class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    credential_id = Column(String, unique=True, index=True)
    public_key = Column(String)
    sign_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    customer = relationship("Customer")

# ------------------------------------------------------------------------
# Pydantic-Modelle
# ------------------------------------------------------------------------
class CartItem(BaseModel):
    id: int
    design: str
    name: str
    width: int
    barCount: int
    price: float

class Address(BaseModel):
    gender: str = Field(..., example="Herr")
    firstName: str = Field(..., example="Max")
    lastName: str = Field(..., example="Mustermann")
    email: str = Field(..., example="max@example.com")
    street: str = Field(..., example="Musterstraße")
    houseNumber: str = Field(..., example="1A")
    postalCode: str = Field(..., example="12345")
    city: str = Field(..., example="Musterstadt")

class PurchaseRequest(BaseModel):
    items: List[CartItem]
    lieferadresse: Address
    rechnungsadresse: Address

# WebAuthn-Optionen (vereinfacht)
class WebAuthnOptions(BaseModel):
    challenge: str
    rp: Dict[str, Any]
    user: Dict[str, Any]
    allowCredentials: List[dict] = []

class WebAuthnEmailRequest(BaseModel):
    customer_email: str

class WebAuthnCompleteRequest(BaseModel):
    customer_email: str
    credential: dict

# ------------------------------------------------------------------------
# FastAPI-Konfiguration
# ------------------------------------------------------------------------
app = FastAPI()
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    print("Initialisiere die Datenbank...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Datenbank bereit!")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from generate_medaillenhalter_dxf_png_svg import get_width_of_medaillenhalter, get_medaillenhalter

# ------------------------------------------------------------------------
# Konfiguration -> Warenkorb
# ------------------------------------------------------------------------

from pydantic import BaseModel

class MedaillenhalterRequest(BaseModel):
    text: str
    design: str
    anzahl_ebenen: int
    user_breite: int = 0  # optionales Feld mit Defaultwert
    mindestbreite: int = 0  # optionales Feld mit Defaultwert


@app.post("/medaillenhalter_info")
async def medaillenhalter_info(req: MedaillenhalterRequest):
    breite, _, _, _, mindestbreite = get_width_of_medaillenhalter(text=req.text, user_breite=req.user_breite)
    preis = round(20 + (req.anzahl_ebenen * 2.5) + len(req.text) * 0.3 + (breite - 400) * 0.01, 2)
    print("user_breite", req.user_breite, " und berechnet", breite, " mit Text ", req.text)
    return {
        "width": int(breite),
        "mindestbreite": int(mindestbreite),
        "price": preis
    }


@app.post("/generate_medaillenhalter")
async def generate_handler(req: MedaillenhalterRequest):
    get_medaillenhalter(
        benennung_nach_konfiguration=True,
        design=req.design,
        text=req.text,
        anzahl_ebenen=req.anzahl_ebenen,
        user_breite=req.user_breite
    )
    return {"status": "generated"}

@app.get("/get_image_url")
async def get_image_url(text: str, design: str, anzahl_ebenen: int, gesamtbreite:int):
    import os
    import urllib.parse

    id = f"{text}_{design}_{anzahl_ebenen}"
    image_path = os.path.join("Warenkorb", "PNG", f"{id}_{gesamtbreite}.png")

    if not os.path.exists(image_path):
        return {"error": "Bild nicht gefunden."}

    # Optional: Bild als direkte URL referenzieren
    return FileResponse(image_path, media_type="image/png", filename=f"{id}.png")

# ------------------------------------------------------------------------
# Kauf-Endpunkt (/purchase)
# ------------------------------------------------------------------------
@app.post("/purchase")
async def purchase(purchase_request: PurchaseRequest):
    async with async_session() as session:
        async with session.begin():
            stmt = select(Customer).filter(
                Customer.lieferadresse_email == purchase_request.lieferadresse.email,
                Customer.rechnungsadresse_email == purchase_request.rechnungsadresse.email,
            )
            result = await session.execute(stmt)
            customer = result.scalars().first()
            if not customer:
                customer = Customer(
                    # Lieferadresse
                    lieferadresse_gender = purchase_request.lieferadresse.gender,
                    lieferadresse_firstName = purchase_request.lieferadresse.firstName,
                    lieferadresse_lastName = purchase_request.lieferadresse.lastName,
                    lieferadresse_email = purchase_request.lieferadresse.email,
                    lieferadresse_street = purchase_request.lieferadresse.street,
                    lieferadresse_houseNumber = purchase_request.lieferadresse.houseNumber,
                    lieferadresse_postalCode = purchase_request.lieferadresse.postalCode,
                    lieferadresse_city = purchase_request.lieferadresse.city,
                    # Rechnungsadresse
                    rechnungsadresse_gender = purchase_request.rechnungsadresse.gender,
                    rechnungsadresse_firstName = purchase_request.rechnungsadresse.firstName,
                    rechnungsadresse_lastName = purchase_request.rechnungsadresse.lastName,
                    rechnungsadresse_email = purchase_request.rechnungsadresse.email,
                    rechnungsadresse_street = purchase_request.rechnungsadresse.street,
                    rechnungsadresse_houseNumber = purchase_request.rechnungsadresse.houseNumber,
                    rechnungsadresse_postalCode = purchase_request.rechnungsadresse.postalCode,
                    rechnungsadresse_city = purchase_request.rechnungsadresse.city
                )
                session.add(customer)
                await session.flush()
            for item in purchase_request.items:
                product = Product(
                    design=item.design,
                    name=item.name,
                    width=item.width,
                    barCount=item.barCount,
                    price=item.price,
                    status="bestellt",
                    customer_id=customer.id
                )
                session.add(product)
        await session.commit()
    return {"status": "success", "message": "Kauf abgeschlossen!"}

# ------------------------------------------------------------------------
# WebAuthn-Registrierungs-Endpunkte
# ------------------------------------------------------------------------
@app.post("/webauthn/register/options")
async def webauthn_register_options(payload: WebAuthnEmailRequest):
    """
    Erzeuge echte Registrierungsoptionen mittels py_webauthn.
    """
    customer_email = payload.customer_email
    options = generate_registration_options(
        rp_id="localhost",
        rp_name="MedalProject",
        user_id=customer_email.encode('utf-8'),
        user_name=customer_email,
        user_display_name=customer_email,
        attestation=AttestationConveyancePreference.DIRECT,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.REQUIRED,
        ),
        challenge=None,  # Automatisch generiert
        supported_pub_key_algs=[COSEAlgorithmIdentifier.ECDSA_SHA_512],
        timeout=12000,
        hints=[PublicKeyCredentialHint.CLIENT_DEVICE],
    )
    # Speichere die Challenge für den Benutzer (für die Verifikation)
    registration_challenges[customer_email] = options.challenge
    return json.loads(options_to_json(options))

@app.post("/webauthn/register/complete")
async def webauthn_register_complete(payload: WebAuthnCompleteRequest):
    """
    Verifiziere den Registrierungsresponse und speichere das Credential.
    """
    customer_email = payload.customer_email
    credential = payload.credential
    expected_challenge = registration_challenges.get(customer_email)
    if not expected_challenge:
        raise HTTPException(status_code=400, detail="Kein Challenge gefunden")

    try:
        verification = verify_registration_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_origin="http://localhost:3000",  # Passe Deine Origin an
            expected_rp_id="localhost",
            require_user_verification=True,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registrierungsverifikation fehlgeschlagen: {str(e)}")

    # Registrierungsresponse erfolgreich – Credential in DB speichern
    async with async_session() as session:
        async with session.begin():
            stmt = select(Customer).filter(Customer.lieferadresse_email == customer_email)
            result = await session.execute(stmt)
            customer = result.scalars().first()
            if not customer:
                # Es werden nur die E-Mail-Felder gesetzt, alle weiteren Felder bleiben NULL
                customer = Customer(
                    lieferadresse_email=customer_email,
                    rechnungsadresse_email=customer_email,
                )
                session.add(customer)
                await session.flush()
            new_cred = WebAuthnCredential(
                customer_id=customer.id,
                credential_id=(
                    base64.urlsafe_b64encode(verification.credential_id).decode('utf-8')
                    if isinstance(verification.credential_id, bytes)
                    else verification.credential_id
                ),
                public_key=(
                    base64.urlsafe_b64encode(verification.credential_public_key).decode('utf-8')
                    if isinstance(verification.credential_public_key, bytes)
                    else verification.credential_public_key
                ),
                sign_count=0  # Beim ersten Registrieren wird der Sign Count auf 0 gesetzt.
            )
            session.add(new_cred)
        await session.commit()
    return {"status": "success", "message": "Registration complete"}


# ------------------------------------------------------------------------
# WebAuthn-Login-Endpunkte
# ------------------------------------------------------------------------
@app.post("/webauthn/login/options")
async def webauthn_login_options(payload: WebAuthnEmailRequest):
    """
    Erzeuge echte Loginoptionen mittels py_webauthn.
    """
    customer_email = payload.customer_email
    async with async_session() as session:
        async with session.begin():
            stmt = select(Customer).filter(Customer.lieferadresse_email == customer_email)
            result = await session.execute(stmt)
            customer = result.scalars().first()
            if not customer:
                raise HTTPException(status_code=400, detail="User not registered")
            stmt = select(WebAuthnCredential).filter(WebAuthnCredential.customer_id == customer.id)
            result = await session.execute(stmt)
            credential = result.scalars().first()
            if not credential:
                raise HTTPException(status_code=400, detail="Kein WebAuthn-Credential gefunden")
            options = generate_authentication_options(
                rp_id="localhost",
                challenge=None,  # Automatisch generiert
                timeout=12000,
                allow_credentials=[PublicKeyCredentialDescriptor(id=credential.credential_id.encode('utf-8'))],
                user_verification=UserVerificationRequirement.REQUIRED,
            )
            authentication_challenges[customer_email] = options.challenge
            return json.loads(options_to_json(options))

@app.post("/webauthn/login/complete")
async def webauthn_login_complete(payload: WebAuthnCompleteRequest):
    """
    Verifiziere den Loginresponse und aktualisiere den Sign Count.
    """
    customer_email = payload.customer_email
    credential = payload.credential
    expected_challenge = authentication_challenges.get(customer_email)
    if not expected_challenge:
        raise HTTPException(status_code=400, detail="Kein gültiger Challenge gefunden")
    async with async_session() as session:
        async with session.begin():
            stmt = select(Customer).filter(Customer.lieferadresse_email == customer_email)
            result = await session.execute(stmt)
            customer = result.scalars().first()
            if not customer:
                raise HTTPException(status_code=400, detail="User not registered")
            stmt = select(WebAuthnCredential).filter(WebAuthnCredential.customer_id == customer.id)
            result = await session.execute(stmt)
            stored_credential = result.scalars().first()
            if not stored_credential:
                raise HTTPException(status_code=400, detail="Kein WebAuthn-Credential gefunden")
    try:
        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_rp_id="localhost",
            expected_origin="http://localhost:3000",  
            credential_public_key=base64url_to_bytes(stored_credential.public_key),
            credential_current_sign_count=stored_credential.sign_count,
            require_user_verification=True,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentifizierung fehlgeschlagen: {str(e)}")
    async with async_session() as session:
        async with session.begin():
            stmt = select(WebAuthnCredential).filter(WebAuthnCredential.id == stored_credential.id)
            result = await session.execute(stmt)
            cred_obj = result.scalars().first()
            if cred_obj:
                cred_obj.sign_count = verification.new_sign_count
                await session.commit()
    customer_data = {"id": customer.id, "email": customer.lieferadresse_email}
    return {"status": "success", "customer": customer_data}

# ------------------------------------------------------------------------
# Zusätzlicher Endpunkt: Registrierung prüfen
# ------------------------------------------------------------------------
@app.post("/webauthn/is_registered")
async def webauthn_is_registered(payload: WebAuthnEmailRequest):
    async with async_session() as session:
        async with session.begin():
            stmt = select(Customer).filter(Customer.lieferadresse_email == payload.customer_email)
            result = await session.execute(stmt)
            customer = result.scalars().first()
            if not customer:
                return {"registered": False}
            stmt = select(WebAuthnCredential).filter(WebAuthnCredential.customer_id == customer.id)
            result = await session.execute(stmt)
            credential = result.scalars().first()
            return {"registered": True} if credential else {"registered": False}

# ------------------------------------------------------------------------
# Profil-Endpunkt
# ------------------------------------------------------------------------
@app.get("/profile/{customer_id}")
async def get_profile(customer_id: int):
    async with async_session() as session:
        async with session.begin():
            stmt = select(Product).filter(Product.customer_id == customer_id).order_by(Product.created_at.desc())
            result = await session.execute(stmt)
            products = result.scalars().all()
    return {"products": [
         {
             "id": p.id,
             "design": p.design,
             "name": p.name,
             "width": p.width,
             "barCount": p.barCount,
             "price": p.price,
             "status": p.status,
             "created_at": p.created_at.isoformat()
         } for p in products
    ]}
