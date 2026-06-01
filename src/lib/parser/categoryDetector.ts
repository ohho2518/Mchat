import type { TransactionType } from '@/types/transaction'
import type { CategoryKeywordMap } from './parseTransactionText'

// Phase 3: match text against category keywords, score by keyword length

export function detectCategory(
  text: string,
  categories: CategoryKeywordMap[],
  type: TransactionType
): string | null {
  const eligible = type === 'unknown'
    ? categories
    : categories.filter((c) => c.type === type)

  let bestName: string | null = null
  let bestScore = 0

  for (const cat of eligible) {
    let score = 0
    for (const kw of cat.keywords) {
      if (text.includes(kw)) {
        score += kw.length   // keyword ยาวกว่า = match ดีกว่า
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestName  = cat.categoryName
    }
  }

  return bestName
}
