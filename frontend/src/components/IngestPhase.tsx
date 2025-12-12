/**
 * Ingest phase component showing space metadata and section preview.
 */

import {
  Play,
  Check,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AccordionItem } from "@/components/ui/accordion"
import type { SectionInfo } from "@/types"

interface IngestPhaseProps {
  genieSpaceId: string
  spaceData: Record<string, unknown>
  sections: SectionInfo[]
  onStartAnalysis: () => void
}

function formatSectionName(sectionName: string): string {
  return sectionName
    .replace(/_/g, " ")
    .replace(/\./g, " → ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function IngestPhase({
  genieSpaceId,
  sections,
  onStartAnalysis,
}: IngestPhaseProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ingest Preview</h2>
          <p className="text-sm text-slate-500">
            Space ID: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{genieSpaceId}</code>
          </p>
        </div>
        <Button onClick={onStartAnalysis}>
          <Play className="w-4 h-4 mr-2" />
          Start Analysis
        </Button>
      </div>

      {/* Sections Preview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Serialized Space Data
          </h3>
          <div className="space-y-3">
            {sections.map((section) => {
              const displayName = formatSectionName(section.name)
              const itemCount = Array.isArray(section.data) ? section.data.length : 1

              if (!section.has_data) {
                return (
                  <AccordionItem
                    key={section.name}
                    title={
                      <span className="flex items-center gap-2">
                        <span className="text-warning">{displayName}</span>
                        <span className="text-xs text-slate-400">(not configured)</span>
                      </span>
                    }
                    icon={<AlertTriangle className="w-4 h-4 text-warning" />}
                    className="border-warning/30"
                  >
                    <p className="text-sm text-slate-500">
                      This section is not configured in your Genie Space.
                    </p>
                  </AccordionItem>
                )
              }

              return (
                <AccordionItem
                  key={section.name}
                  title={
                    <span className="flex items-center gap-2">
                      <span>{displayName}</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {itemCount}
                      </span>
                    </span>
                  }
                  icon={<Check className="w-4 h-4 text-success" />}
                >
                  <pre className="text-xs overflow-auto max-h-[32rem] p-3 bg-white rounded-lg border border-slate-200">
                    {JSON.stringify(section.data, null, 2)}
                  </pre>
                </AccordionItem>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

