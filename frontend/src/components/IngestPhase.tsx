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
  const configuredCount = sections.filter((s) => s.has_data).length

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-semibold text-primary">
            Ingest Preview
          </h2>
          <p className="text-sm text-muted">
            Space ID:{" "}
            <code className="px-1.5 py-0.5 bg-elevated rounded text-secondary font-mono text-xs">
              {genieSpaceId}
            </code>
          </p>
        </div>
        <Button onClick={onStartAnalysis}>
          <Play className="w-4 h-4 mr-2" />
          Start Analysis
        </Button>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success dark:bg-success/15">
          <Check className="w-4 h-4" />
          <span className="font-medium">{configuredCount} configured</span>
        </div>
        {sections.length - configuredCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning dark:bg-warning/15">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">
              {sections.length - configuredCount} missing
            </span>
          </div>
        )}
      </div>

      {/* Sections Preview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-display font-semibold text-primary mb-4">
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
                        <span className="text-xs text-muted">(not configured)</span>
                      </span>
                    }
                    icon={<AlertTriangle className="w-4 h-4 text-warning" />}
                    className="border-warning/30"
                  >
                    <p className="text-sm text-muted">
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
                      <span className="px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded-full dark:bg-accent/20">
                        {itemCount}
                      </span>
                    </span>
                  }
                  icon={<Check className="w-4 h-4 text-success" />}
                >
                  <pre className="text-xs font-mono overflow-auto max-h-[32rem] p-3 bg-surface rounded-lg border border-default">
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
