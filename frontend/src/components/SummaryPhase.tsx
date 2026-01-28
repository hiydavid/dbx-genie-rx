/**
 * Summary phase component showing overall results.
 */

import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChecklistProgress } from "@/components/ChecklistProgress"
import { ScoreGauge } from "@/components/ScoreGauge"
import { cn } from "@/lib/utils"
import type { SectionAnalysis } from "@/types"

interface SummaryPhaseProps {
  genieSpaceId: string
  sectionAnalyses: SectionAnalysis[]
  selectedSections: number[]
  expandedSections: Record<string, boolean>
  onToggleSection: (sectionName: string) => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

function formatSectionName(sectionName: string): string {
  return sectionName
    .replace(/_/g, " ")
    .replace(/\./g, " → ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Sql/g, "SQL")
}

function getScoreColorClasses(percentage: number): string {
  if (percentage === 100) {
    return "bg-success/10 text-success dark:bg-success/20"
  }
  if (percentage >= 60) {
    return "bg-warning/10 text-warning dark:bg-warning/20"
  }
  return "bg-danger/10 text-danger dark:bg-danger/20"
}

export function SummaryPhase({
  genieSpaceId,
  sectionAnalyses,
  selectedSections,
  expandedSections,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
}: SummaryPhaseProps) {
  // Filter analyses to only show selected sections
  const filteredAnalyses = selectedSections
    .map((index) => sectionAnalyses[index])
    .filter((a): a is SectionAnalysis => a !== undefined)

  // Calculate totals from filtered analyses
  const totalChecklist = filteredAnalyses.reduce(
    (sum, a) => sum + a.checklist.length,
    0
  )
  const passedChecklist = filteredAnalyses.reduce(
    (sum, a) => sum + a.checklist.filter((c) => c.passed).length,
    0
  )

  return (
    <div className="space-y-8 animate-stagger">
      {/* Header */}
      <div>
        <h2 className="text-lg font-display font-semibold text-primary">
          Analysis Summary
        </h2>
        <p className="text-sm text-muted">
          Space ID:{" "}
          <code className="px-1.5 py-0.5 bg-elevated rounded text-secondary font-mono text-xs">
            {genieSpaceId}
          </code>
        </p>
      </div>

      {/* Score Gauge - Hero element */}
      <div className="flex justify-center py-4">
        <ScoreGauge
          passed={passedChecklist}
          total={totalChecklist}
          size={220}
          animationDuration={1200}
        />
      </div>

      {/* Section Results */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Section Results</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onExpandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={onCollapseAll}>
              Collapse All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAnalyses.map((analysis, index) => {
              const displayName = formatSectionName(analysis.section_name)
              const passed = analysis.checklist.filter((c) => c.passed).length
              const total = analysis.checklist.length
              const isExpanded = expandedSections[analysis.section_name] ?? false
              const percentage = total > 0 ? (passed / total) * 100 : 100

              return (
                <div
                  key={analysis.section_name}
                  className="border border-default rounded-lg overflow-hidden dark:card-glow"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleSection(analysis.section_name)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left bg-surface hover:bg-elevated transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-primary">
                        {displayName}
                      </span>
                      <span
                        className={cn(
                          "text-sm px-2.5 py-0.5 rounded-full font-medium",
                          getScoreColorClasses(percentage)
                        )}
                      >
                        {passed}/{total}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted" />
                    )}
                  </button>

                  <div
                    className={cn(
                      "grid transition-all duration-200 ease-in-out",
                      isExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 py-4 bg-elevated border-t border-default space-y-4">
                        {analysis.summary && (
                          <div className="flex items-start gap-3 p-3 bg-info/10 dark:bg-info/15 rounded-lg">
                            <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-secondary">
                              {analysis.summary}
                            </p>
                          </div>
                        )}

                        {analysis.checklist.length > 0 ? (
                          <ChecklistProgress checklist={analysis.checklist} />
                        ) : (
                          <p className="text-sm text-muted text-center py-4">
                            No checklist items for this section.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
