/**
 * OptimizationPage component displaying AI-generated optimization suggestions.
 */

import { useMemo } from "react"
import { ArrowLeft, Loader2, Sparkles, AlertTriangle, GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SuggestionCard } from "@/components/SuggestionCard"
import type { OptimizationSuggestion } from "@/types"

interface OptimizationPageProps {
  suggestions: OptimizationSuggestion[] | null
  summary: string | null
  isLoading: boolean
  error: string | null
  selectedSuggestions: Set<number>
  onBack: () => void
  onToggleSuggestionSelection: (index: number) => void
  onSelectAllSuggestions: () => void
  onDeselectAllSuggestions: () => void
  onCreateNewGenie: () => void
}

export function OptimizationPage({
  suggestions,
  summary,
  isLoading,
  error,
  selectedSuggestions,
  onBack,
  onToggleSuggestionSelection,
  onSelectAllSuggestions,
  onDeselectAllSuggestions,
  onCreateNewGenie,
}: OptimizationPageProps) {
  // Group suggestions by priority with original indices
  const groupedSuggestions = useMemo(() => {
    if (!suggestions) return { high: [], medium: [], low: [] }

    type SuggestionWithIndex = { suggestion: OptimizationSuggestion; originalIndex: number }
    const grouped: { high: SuggestionWithIndex[]; medium: SuggestionWithIndex[]; low: SuggestionWithIndex[] } = {
      high: [],
      medium: [],
      low: [],
    }

    suggestions.forEach((suggestion, index) => {
      const item = { suggestion, originalIndex: index }
      if (suggestion.priority === "high") {
        grouped.high.push(item)
      } else if (suggestion.priority === "medium") {
        grouped.medium.push(item)
      } else {
        grouped.low.push(item)
      }
    })

    return grouped
  }, [suggestions])

  const totalCount = suggestions?.length || 0
  const selectedCount = selectedSuggestions.size

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">
            Optimization Suggestions
          </h1>
          <p className="text-muted">
            {isLoading
              ? "Analyzing your configuration..."
              : `${totalCount} suggestions generated`}
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feedback
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-accent animate-spin" />
              <Sparkles className="w-5 h-5 text-accent absolute animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-primary">
                Generating optimization suggestions
              </p>
              <p className="text-sm text-muted mt-1">
                AI is analyzing your Genie Space configuration and labeling feedback...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <CardContent className="py-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">
                Failed to generate suggestions
              </p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary card */}
      {summary && !isLoading && (
        <Card className="border-accent/30 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary mb-1">Optimization Strategy</p>
                <p className="text-secondary text-sm">{summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats and Selection Controls */}
      {suggestions && suggestions.length > 0 && !isLoading && (
        <div className="space-y-4">
          {/* Priority stats */}
          <div className="flex gap-4 flex-wrap">
            {groupedSuggestions.high.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-secondary">
                  {groupedSuggestions.high.length} high priority
                </span>
              </div>
            )}
            {groupedSuggestions.medium.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-secondary">
                  {groupedSuggestions.medium.length} medium priority
                </span>
              </div>
            )}
            {groupedSuggestions.low.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-secondary">
                  {groupedSuggestions.low.length} low priority
                </span>
              </div>
            )}
          </div>

          {/* Selection controls */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-elevated rounded-lg border border-default">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onSelectAllSuggestions}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={onDeselectAllSuggestions}>
                Deselect All
              </Button>
              <span className="text-sm text-muted">
                {selectedCount} of {totalCount} selected
              </span>
            </div>
            {selectedCount > 0 && (
              <Button onClick={onCreateNewGenie}>
                <GitCompare className="w-4 h-4 mr-2" />
                Create New Genie
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Suggestions grouped by priority */}
      {suggestions && suggestions.length > 0 && !isLoading && (
        <div className="space-y-8">
          {/* High priority */}
          {groupedSuggestions.high.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                High Priority
              </h2>
              <div className="space-y-4">
                {groupedSuggestions.high.map(({ suggestion, originalIndex }) => (
                  <SuggestionCard
                    key={`high-${originalIndex}`}
                    suggestion={suggestion}
                    index={originalIndex}
                    selectionEnabled={true}
                    isSelected={selectedSuggestions.has(originalIndex)}
                    onToggleSelection={() => onToggleSuggestionSelection(originalIndex)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Medium priority */}
          {groupedSuggestions.medium.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Medium Priority
              </h2>
              <div className="space-y-4">
                {groupedSuggestions.medium.map(({ suggestion, originalIndex }) => (
                  <SuggestionCard
                    key={`medium-${originalIndex}`}
                    suggestion={suggestion}
                    index={originalIndex}
                    selectionEnabled={true}
                    isSelected={selectedSuggestions.has(originalIndex)}
                    onToggleSelection={() => onToggleSuggestionSelection(originalIndex)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Low priority */}
          {groupedSuggestions.low.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Low Priority
              </h2>
              <div className="space-y-4">
                {groupedSuggestions.low.map(({ suggestion, originalIndex }) => (
                  <SuggestionCard
                    key={`low-${originalIndex}`}
                    suggestion={suggestion}
                    index={originalIndex}
                    selectionEnabled={true}
                    isSelected={selectedSuggestions.has(originalIndex)}
                    onToggleSelection={() => onToggleSuggestionSelection(originalIndex)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state */}
      {suggestions && suggestions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-lg font-medium text-primary">
              No optimization suggestions generated
            </p>
            <p className="text-sm text-muted mt-1">
              Your Genie Space configuration looks good based on the labeling feedback.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
