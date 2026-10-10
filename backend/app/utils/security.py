import hashlib
import hmac
import secrets
import uuid

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt

from app.config import settings


def hash_password(password: str) -> str:
    """
    Secure password hashing using PBKDF2-HMAC-SHA256 with
    100,000 iterations and a cryptographically secure 16-byte salt.
    """
    salt = secrets.token_hex(16)
    iterations = 100000

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations
    )

    return f"pbkdf2_sha256${iterations}${salt}${derived.hex()}"


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verifies a plain password against the stored hash
    in constant time.
    """
    if not hashed_password:
        return False

    try:
        parts = hashed_password.split("$")

        if len(parts) == 4 and parts[0] == "pbkdf2_sha256":
            _, iterations_str, salt, stored_hash = parts
            iterations = int(iterations_str)

            computed = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations
            ).hex()

            return hmac.compare_digest(
                computed,
                stored_hash
            )

        # Fallback for bcrypt hashes if present
        import bcrypt

        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )

    except Exception:
        return False


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Creates a signed JWT access token.

    UUID values are converted to strings before JWT
    JSON serialization.
    """

    to_encode = data.copy()

    # Convert UUID objects to strings
    # so that JWT JSON serialization does not fail.
    for key, value in to_encode.items():
        if isinstance(value, uuid.UUID):
            to_encode[key] = str(value)

    now = datetime.now(timezone.utc)

    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({
        "exp": expire,
        "iat": now
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_access_token(
    token: str
) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates JWT signature and expiry.
    """

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        return payload

    except jwt.PyJWTError:
        return None