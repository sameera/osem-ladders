/**
 * CompetencyEditor Component
 * Competency with expectations list
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { ExpectationEditor } from './ExpectationEditor';
import type { Competence, Expectation } from '@/data/model';

interface CompetencyEditorProps {
  competency: Competence;
  competencyIndex: number;
  onChange: (field: 'name', value: string) => void;
  onExpectationChange: (expectationIndex: number, field: keyof Expectation, value: string | number) => void;
  onAddExpectation: () => void;
  onRemoveExpectation: (expectationIndex: number) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

export function CompetencyEditor({
  competency,
  competencyIndex,
  onChange,
  onExpectationChange,
  onAddExpectation,
  onRemoveExpectation,
  onRemove,
  canRemove = true,
}: CompetencyEditorProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">
          Competency {competencyIndex + 1}
        </h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Remove competency ${competencyIndex + 1}`}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        )}
      </div>

      {/* Competency Name */}
      <div className="space-y-2">
        <Label htmlFor={`competency-${competencyIndex}-name`}>
          Competency Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`competency-${competencyIndex}-name`}
          type="text"
          placeholder="e.g., Code Quality, System Design"
          value={competency.name}
          onChange={(e) => onChange('name', e.target.value)}
          required
          aria-required="true"
        />
      </div>

      {/* Expectations */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Expectations (Levels) <span className="text-red-500">*</span>
        </Label>
        <div className="space-y-3">
          {competency.levels.map((expectation, idx) => (
            <ExpectationEditor
              key={idx}
              expectation={expectation}
              index={idx}
              onChange={onExpectationChange}
              onRemove={onRemoveExpectation}
              canRemove={competency.levels.length > 1}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddExpectation}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expectation
        </Button>
      </div>
    </div>
  );
}
