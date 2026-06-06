// Omise Node.js client — server-side only
// eslint-disable-next-line @typescript-eslint/no-require-imports
const OmiseLib = require('omise')

export interface OmiseCharge {
  id: string
  status: 'pending' | 'successful' | 'failed' | 'expired' | 'reversed'
  amount: number
  currency: string
  source?: {
    id: string
    type: string
    scannable_code?: {
      image?: {
        download_uri?: string
        filename?: string
      }
    }
  }
}

export interface OmiseEvent {
  id: string
  key: string
  data: {
    object: OmiseCharge
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getOmiseClient(): any {
  if (!process.env.OMISE_SECRET_KEY) throw new Error('OMISE_SECRET_KEY not set')
  if (!_client) {
    _client = OmiseLib({ secretKey: process.env.OMISE_SECRET_KEY })
  }
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function promisify<T>(fn: (cb: (err: any, res: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => fn((err, res) => (err ? reject(err) : resolve(res))))
}

export async function createPromptPayCharge(amountSatang: number, metadata: Record<string, string>) {
  const omise = getOmiseClient()
  const source: OmiseCharge['source'] & { id: string } = await promisify((cb) =>
    omise.sources.create({ type: 'promptpay', amount: amountSatang, currency: 'thb' }, cb)
  )
  const charge: OmiseCharge = await promisify((cb) =>
    omise.charges.create({ amount: amountSatang, currency: 'thb', source: source.id, metadata }, cb)
  )
  return charge
}

export async function createCardCharge(amountSatang: number, token: string, metadata: Record<string, string>) {
  const omise = getOmiseClient()
  const charge: OmiseCharge = await promisify((cb) =>
    omise.charges.create({ amount: amountSatang, currency: 'thb', card: token, metadata }, cb)
  )
  return charge
}

export async function retrieveEvent(eventId: string): Promise<OmiseEvent> {
  const omise = getOmiseClient()
  return promisify((cb) => omise.events.retrieve(eventId, cb))
}

export const OMISE_ENABLED = Boolean(process.env.OMISE_SECRET_KEY)
