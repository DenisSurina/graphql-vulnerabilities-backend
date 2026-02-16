import jwt from 'jsonwebtoken';

// VULN: Weak, hardcoded secret — easy to brute-force or guess
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

export function signToken(payload) {
  // VULN: No expiration set on token
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
