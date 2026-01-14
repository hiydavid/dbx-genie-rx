/**
 * Labeling page placeholder for future labeling session functionality.
 */

import { Tag, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface LabelingPageProps {
  genieSpaceId: string
  selectedQuestions: string[]
  onBack: () => void
}

export function LabelingPage({
  genieSpaceId,
  selectedQuestions,
  onBack,
}: LabelingPageProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">
            Labeling Session
          </h1>
          <p className="text-muted">
            Space ID: <span className="font-mono text-secondary">{genieSpaceId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent">
          <Tag className="w-4 h-4" />
          <span className="text-sm font-medium">
            {selectedQuestions.length} question{selectedQuestions.length !== 1 ? "s" : ""} selected
          </span>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            Coming Soon
          </h3>
          <p className="text-muted max-w-md mb-6">
            This feature will allow you to label and evaluate Genie Space
            responses for the selected benchmark questions.
          </p>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Benchmarks
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
