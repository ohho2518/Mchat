import { Pencil, Trash2, Shield } from 'lucide-react'
import type { Category } from '@/types/transaction'

interface CategoryCardProps {
  category: Category
  onEdit:   (c: Category) => void
  onDelete: (c: Category) => void
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const { name, icon, color, isDefault, keywords } = category
  const kws = keywords?.map((k) => k.keyword) ?? []
  const canEdit = !isDefault

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
      {/* Icon circle */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: color ? `${color}20` : '#f3f4f6' }}
      >
        {icon ?? '📋'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
          {isDefault && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
              <Shield className="h-2.5 w-2.5" /> default
            </span>
          )}
        </div>
        {kws.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {kws.slice(0, 4).join(' · ')}{kws.length > 4 ? ' ...' : ''}
          </p>
        )}
      </div>

      {/* Actions — only for user's own categories */}
      {canEdit && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(category)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
