/**
 * Main application component for the Genie Space Analyzer.
 */

import { Search } from "lucide-react"
import { useAnalysis } from "@/hooks/useAnalysis"
import { SidebarNav } from "@/components/SidebarNav"
import { InputPhase } from "@/components/InputPhase"
import { IngestPhase } from "@/components/IngestPhase"
import { AnalysisPhase } from "@/components/AnalysisPhase"
import { SummaryPhase } from "@/components/SummaryPhase"
import { ChecklistPage } from "@/components/ChecklistPage"

function App() {
  const { state, actions } = useAnalysis()

  const renderPhase = () => {
    if (state.showChecklist) {
      return <ChecklistPage onBack={actions.toggleChecklist} />
    }

    switch (state.phase) {
      case "input":
        return (
          <InputPhase
            onFetchSpace={actions.handleFetchSpace}
            onParseJson={actions.handleParseJson}
            isLoading={state.isLoading}
            error={state.error}
          />
        )

      case "ingest":
        return (
          <IngestPhase
            genieSpaceId={state.genieSpaceId}
            spaceData={state.spaceData!}
            sections={state.sections}
            onStartAnalysis={actions.startAnalysis}
          />
        )

      case "analysis":
        return (
          <AnalysisPhase
            genieSpaceId={state.genieSpaceId}
            sections={state.sections}
            currentSectionIndex={state.currentSectionIndex}
            sectionAnalyses={state.sectionAnalyses}
            allSectionsAnalyzed={state.allSectionsAnalyzed}
            isLoading={state.isLoading}
            error={state.error}
            onAnalyzeSection={actions.analyzeCurrentSection}
            onPrevSection={actions.prevSection}
            onNextSection={actions.nextSection}
            onGoToSummary={actions.goToSummary}
          />
        )

      case "summary":
        return (
          <SummaryPhase
            genieSpaceId={state.genieSpaceId}
            sectionAnalyses={state.sectionAnalyses}
            expandedSections={state.expandedSections}
            onToggleSection={actions.toggleSectionExpanded}
            onExpandAll={actions.expandAllSections}
            onCollapseAll={actions.collapseAllSections}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      {state.phase !== "input" && (
        <SidebarNav
          phase={state.phase}
          sections={state.sections}
          currentSectionIndex={state.currentSectionIndex}
          sectionAnalyses={state.sectionAnalyses}
          allSectionsAnalyzed={state.allSectionsAnalyzed}
          showChecklist={state.showChecklist}
          onGoToIngest={actions.goToIngest}
          onGoToSection={actions.goToSection}
          onGoToSummary={actions.goToSummary}
          onToggleChecklist={actions.toggleChecklist}
          onReset={actions.reset}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Genie Space Analyzer
              </h1>
              <p className="text-sm text-slate-500">
                Analyze your Databricks Genie Space configuration against checklist
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">{renderPhase()}</div>
      </main>
    </div>
  )
}

export default App
