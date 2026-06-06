import { scrypt, randomBytes, timingSafeEqual } from 'crypto'

const SCRYPT_N = 65536  // 2^16 — 4× Node.js default; new passwords use this cost

function scryptDeriveKey(password: string, salt: string, keylen: number, N: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, { N }, (err, key) => {
      if (err) reject(err); else resolve(key)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await scryptDeriveKey(password, salt, 64, SCRYPT_N)
  return `${SCRYPT_N}:${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  let N: number, salt: string, hash: string

  if (parts.length === 3) {
    // Current format: N:salt:hash
    N    = parseInt(parts[0], 10)
    salt = parts[1]
    hash = parts[2]
  } else if (parts.length === 2) {
    // Legacy format: salt:hash (created with Node.js default N=16384)
    N    = 16384
    salt = parts[0]
    hash = parts[1]
  } else {
    return false
  }

  if (!N || !salt || !hash) return false
  const hashBuf    = Buffer.from(hash, 'hex')
  const derivedBuf = await scryptDeriveKey(password, salt, 64, N)
  return timingSafeEqual(hashBuf, derivedBuf)
}
