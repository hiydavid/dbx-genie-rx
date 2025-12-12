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

  if (phase === "input") {
    return (
      <aside className="w-64 bg-slate-50 border-r border-slate-200 p-4 min-h-screen">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Progress</h2>
          <p className="text-xs text-slate-500">
            Enter a Genie Space ID to begin
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 p-4 min-h-screen flex flex-col">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Progress</h2>
        <div className="text-xs text-slate-500">
          {completedCount}/{sections.length} sections analyzed
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {/* Ingest step */}
        <button
          onClick={onGoToIngest}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
            phase === "ingest" && !showChecklist
              ? "gradient-primary text-white"
              : "bg-success/10 text-success hover:bg-success/20"
          )}
        >
          {phase === "ingest" && !showChecklist ? (
            <Download className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Ingest Preview
        </button>

        <hr className="border-slate-200 my-3" />

        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Sections
        </div>

        {/* Section steps */}
        {sections.map((section, index) => {
          const shortName = getShortSectionName(section.name)
          const isMissing = !section.has_data
          const isCurrent =
            phase === "analysis" && index === currentSectionIndex && !showChecklist
          const isCompleted = index < completedCount

          let icon = <Circle className="w-4 h-4" />
          let className =
            "bg-slate-100 text-slate-400 cursor-not-allowed"

          if (isCurrent) {
            icon = isMissing ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )
            className = "gradient-primary text-white"
          } else if (isCompleted) {
            icon = isMissing ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )
            className = isMissing
              ? "bg-warning/10 text-warning hover:bg-warning/20 cursor-pointer"
              : "bg-success/10 text-success hover:bg-success/20 cursor-pointer"
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
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                className
              )}
            >
              {icon}
              <span className="truncate">{shortName}</span>
            </button>
          )
        })}

        <hr className="border-slate-200 my-3" />

        {/* Summary step */}
        <button
          onClick={onGoToSummary}
          disabled={!allSectionsAnalyzed && completedCount !== sections.length}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
            phase === "summary" && !showChecklist
              ? "gradient-primary text-white"
              : allSectionsAnalyzed || completedCount === sections.length
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          Summary
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="mt-6 space-y-2">
        <hr className="border-slate-200 mb-3" />

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onToggleChecklist}
        >
          <ClipboardCheck className="w-4 h-4 mr-2" />
          Checklist
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start text-slate-500"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    </aside>
  )
}

