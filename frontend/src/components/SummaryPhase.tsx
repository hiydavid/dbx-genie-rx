/**
 * Summary phase component showing overall results.
 */

import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChecklistProgress } from "@/components/ChecklistProgress"
import { cn } from "@/lib/utils"
import type { SectionAnalysis } from "@/types"

interface SummaryPhaseProps {
  genieSpaceId: string
  sectionAnalyses: SectionAnalysis[]
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
}

export function SummaryPhase({
  genieSpaceId,
  sectionAnalyses,
  expandedSections,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
}: SummaryPhaseProps) {
  // Calculate totals
  const totalChecklist = sectionAnalyses.reduce(
    (sum, a) => sum + a.checklist.length,
    0
  )
  const passedChecklist = sectionAnalyses.reduce(
    (sum, a) => sum + a.checklist.filter((c) => c.passed).length,
    0
  )
  const percentage = totalChecklist > 0 ? (passedChecklist / totalChecklist) * 100 : 0

  const getScoreClass = () => {
    if (percentage >= 80) return "gradient-success"
    if (percentage >= 60) return "gradient-warning"
    return "gradient-primary"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Analysis Summary</h2>
        <p className="text-sm text-slate-500">
          Space ID: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{genieSpaceId}</code>
        </p>
      </div>

      {/* Score Card */}
      <div className="flex justify-center">
        <div
          className={cn(
            "px-12 py-8 rounded-2xl text-white text-center shadow-lg",
            getScoreClass()
          )}
        >
          <div className="text-5xl font-extrabold">
            {passedChecklist}/{totalChecklist}
          </div>
          <div className="text-sm opacity-90 mt-2">Checklist Items Passed</div>
        </div>
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
            {sectionAnalyses.map((analysis) => {
              const displayName = formatSectionName(analysis.section_name)
              const passed = analysis.checklist.filter((c) => c.passed).length
              const total = analysis.checklist.length
              const isExpanded = expandedSections[analysis.section_name] ?? false

              return (
                <div
                  key={analysis.section_name}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => onToggleSection(analysis.section_name)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">
                        {displayName}
                      </span>
                      <span
                        className={cn(
                          "text-sm px-2 py-0.5 rounded-full",
                          passed === total
                            ? "bg-success/10 text-success"
                            : passed >= total * 0.6
                            ? "bg-warning/10 text-warning"
                            : "bg-danger/10 text-danger"
                        )}
                      >
                        {passed}/{total} passed
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
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
                      <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 space-y-4">
                        {analysis.summary && (
                          <div className="flex items-start gap-3 p-3 bg-info/10 rounded-lg">
                            <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">
                              {analysis.summary}
                            </p>
                          </div>
                        )}

                        {analysis.checklist.length > 0 ? (
                          <ChecklistProgress checklist={analysis.checklist} />
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-4">
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

