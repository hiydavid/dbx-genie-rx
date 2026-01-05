/**
 * Sidebar navigation component showing analysis progress.
 */

import {
  Download,
  BarChart3,
  ClipboardCheck,
  RotateCcw,
  Check,
  AlertTriangle,
  Circle,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Phase, SectionInfo, SectionAnalysis } from "@/types"

interface SidebarNavProps {
  phase: Phase
  sections: SectionInfo[]
  currentSectionIndex: number
  sectionAnalyses: SectionAnalysis[]
  allSectionsAnalyzed: boolean
  showChecklist: boolean
  onGoToIngest: () => void
  onGoToSection: (index: number) => void
  onGoToSummary: () => void
  onToggleChecklist: () => void
  onReset: () => void
}

function getShortSectionName(sectionName: string): string {
  return sectionName
    .split(".")
    .pop()!
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Sql/g, "SQL")
}

export function SidebarNav({
  phase,
  sections,
  currentSectionIndex,
  sectionAnalyses,
  allSectionsAnalyzed,
  showChecklist,
  onGoToIngest,
  onGoToSection,
  onGoToSummary,
  onToggleChecklist,
  onReset,
}: SidebarNavProps) {
  const completedCount = sectionAnalyses.length
  const progressPercentage = sections.length > 0 ? (completedCount / sections.length) * 100 : 0

  if (phase === "input") {
    return (
      <aside className="w-64 bg-surface border-r border-default p-4 min-h-screen">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-primary mb-1">Progress</h2>
          <p className="text-xs text-muted">
            Enter a Genie Space ID to begin
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-surface border-r border-default p-4 min-h-screen flex flex-col relative overflow-hidden">
      {/* Subtle inner shadow for depth */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border-strong to-transparent opacity-50" />

      {/* Progress header */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-primary mb-2">Progress</h2>
        <div className="flex items-center justify-between text-xs text-muted mb-2">
          <span>{completedCount}/{sections.length} sections</span>
          <span className="font-mono">{Math.round(progressPercentage)}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out dark:shadow-[0_0_8px_rgba(79,70,229,0.5)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {/* Ingest step */}
        <button
          onClick={onGoToIngest}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
            phase === "ingest" && !showChecklist
              ? "gradient-accent text-white shadow-lg shadow-accent/20 dark:glow-accent"
              : "bg-success/10 text-success hover:bg-success/20 dark:bg-success/15"
          )}
        >
          {phase === "ingest" && !showChecklist ? (
            <Download className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Ingest Preview
        </button>

        <hr className="border-default my-3" />

        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Sections
        </div>

        {/* Section steps */}
        <div className="space-y-1">
          {sections.map((section, index) => {
            const shortName = getShortSectionName(section.name)
            const isMissing = !section.has_data
            const isCurrent =
              phase === "analysis" && index === currentSectionIndex && !showChecklist
            const isCompleted = index < completedCount

            let icon = <Circle className="w-4 h-4" />
            let className =
              "bg-elevated text-muted cursor-not-allowed opacity-60"

            if (isCurrent) {
              icon = isMissing ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )
              className = "gradient-accent text-white shadow-lg shadow-accent/20 dark:glow-accent dark:animate-pulse-glow"
            } else if (isCompleted) {
              icon = isMissing ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )
              className = isMissing
                ? "bg-warning/10 text-warning hover:bg-warning/20 cursor-pointer dark:bg-warning/15"
                : "bg-success/10 text-success hover:bg-success/20 cursor-pointer dark:bg-success/15"
            } else if (isMissing) {
              icon = <AlertTriangle className="w-4 h-4" />
              className = "bg-warning/10 text-warning opacity-50"
            }

            return (
              <button
                key={section.name}
                onClick={() => isCompleted && onGoToSection(index)}
                disabled={!isCompleted}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                  className
                )}
              >
                {icon}
                <span className="truncate">{shortName}</span>
              </button>
            )
          })}
        </div>

        <hr className="border-default my-3" />

        {/* Summary step */}
        <button
          onClick={onGoToSummary}
          disabled={!allSectionsAnalyzed && completedCount !== sections.length}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
            phase === "summary" && !showChecklist
              ? "gradient-accent text-white shadow-lg shadow-accent/20 dark:glow-accent"
              : allSectionsAnalyzed || completedCount === sections.length
              ? "bg-elevated text-secondary hover:bg-sunken cursor-pointer"
              : "bg-elevated text-muted cursor-not-allowed opacity-60"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Summary
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="mt-6 space-y-2">
        <hr className="border-default mb-3" />

        <Button
          variant="ghost"
          className="w-full justify-start text-secondary"
          onClick={onToggleChecklist}
        >
          <ClipboardCheck className="w-4 h-4 mr-2" />
          Checklist
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-muted hover:text-danger"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    </aside>
  )
}
