/**
 * SuggestionCard component for displaying optimization suggestions.
 */

import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { OptimizationSuggestion } from "@/types"

interface SuggestionCardProps {
  suggestion: OptimizationSuggestion
  index: number
  selectionEnabled?: boolean
  isSelected?: boolean
  onToggleSelection?: () => void
}

const categoryLabels: Record<string, string> = {
  instruction: "Instruction",
  sql_example: "SQL Example",
  filter: "Filter",
  expression: "Expression",
  measure: "Measure",
  synonym: "Synonym",
  join_spec: "Join Spec",
  description: "Description",
}

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  high: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  low: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null"
  }
  if (typeof value === "string") {
    return value
  }
  return JSON.stringify(value, null, 2)
}

export function SuggestionCard({
  suggestion,
  index,
  selectionEnabled = false,
  isSelected = false,
  onToggleSelection,
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const colors = priorityColors[suggestion.priority] || priorityColors.medium
  const categoryLabel = categoryLabels[suggestion.category] || suggestion.category

  const currentValueStr = useMemo(() => formatValue(suggestion.current_value), [suggestion.current_value])
  const suggestedValueStr = useMemo(() => formatValue(suggestion.suggested_value), [suggestion.suggested_value])

  return (
    <Card className={`${colors.bg} ${colors.border} border`}>
      <CardContent className="py-4">
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {selectionEnabled && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelection}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent focus:ring-accent cursor-pointer"
                  />
                )}
                <span className="text-muted font-mono text-sm">{index + 1}.</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${colors.text} bg-white/50 dark:bg-black/20`}
                >
                  {suggestion.priority.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-secondary">
                  {categoryLabel}
                </span>
              </div>
              <p className="text-sm font-mono text-secondary break-all">{suggestion.field_path}</p>
            </div>
          </div>

          {/* Rationale */}
          <p className="text-primary text-sm">{suggestion.rationale}</p>

          {/* Checklist reference */}
          {suggestion.checklist_reference && (
            <p className="text-xs text-muted">
              Related checklist: <span className="font-mono">{suggestion.checklist_reference}</span>
            </p>
          )}

          {/* Expandable section */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {isExpanded ? "Hide changes" : "View changes"}
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-3 animate-slide-up">
              {/* Current value */}
              <div>
                <p className="text-xs font-medium text-muted mb-1">Current value:</p>
                <pre className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-default text-xs overflow-x-auto whitespace-pre-wrap break-words">
                  <code className="text-red-600 dark:text-red-400">{currentValueStr}</code>
                </pre>
              </div>

              {/* Suggested value */}
              <div>
                <p className="text-xs font-medium text-muted mb-1">Suggested value:</p>
                <pre className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-default text-xs overflow-x-auto whitespace-pre-wrap break-words">
                  <code className="text-green-600 dark:text-green-400">{suggestedValueStr}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
