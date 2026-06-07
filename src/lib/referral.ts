export const DEFAULT_REFERRAL_TERMS = {
  commissions: [
    { plan: 'Pro รายเดือน',  code: 'pro_monthly',  amount: 20 },
    { plan: 'Pro รายปี',     code: 'pro_yearly',   amount: 200 },
    { plan: 'Max รายเดือน', code: 'max_monthly',  amount: 50 },
    { plan: 'Max รายปี',    code: 'max_yearly',   amount: 500 },
  ],
  holdDays:   14,
  minPayout:  300,
  payoutDay:  15,
  extraNote:  '',
}

// Generate referral code from user's name + random suffix (e.g. SOMCH7K)
export function generateReferralCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5)
    .padEnd(3, 'X')
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${base}${suffix}`
}

export const PARTNER_LEVEL_LABELS: Record<string, string> = {
  user:          'User Referral',
  affiliate:     'Affiliate Partner',
  local_partner: 'Local Sales Partner',
}
