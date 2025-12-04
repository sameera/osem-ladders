/**
 * CategoryEditor Component
 * Category with competencies list
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trash2, Plus } from 'lucide-react';
import { CompetencyEditor } from './CompetencyEditor';
import type { Category, Expectation } from '@/data/model';

interface CategoryEditorProps {
  category: Category;
  categoryIndex: number;
  onChange: (field: 'title', value: string) => void;
  onCompetencyChange: (competencyIndex: number, field: 'name', value: string) => void;
  onExpectationChange: (
    competencyIndex: number,
    expectationIndex: number,
    field: keyof Expectation,
    value: string | number
  ) => void;
  onAddCompetency: () => void;
  onRemoveCompetency: (competencyIndex: number) => void;
  onAddExpectation: (competencyIndex: number) => void;
  onRemoveExpectation: (competencyIndex: number, expectationIndex: number) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

export function CategoryEditor({
  category,
  categoryIndex,
  onChange,
  onCompetencyChange,
  onExpectationChange,
  onAddCompetency,
  onRemoveCompetency,
  onAddExpectation,
  onRemoveExpectation,
  onRemove,
  canRemove = true,
}: CategoryEditorProps) {
  return (
    <div className="border-2 border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">
          Category {categoryIndex + 1}
        </h3>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Remove category ${categoryIndex + 1}`}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        )}
      </div>

      {/* Category Title */}
      <div className="space-y-2">
        <Label htmlFor={`category-${categoryIndex}-title`}>
          Category Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`category-${categoryIndex}-title`}
          type="text"
          placeholder="e.g., Technical Execution, Impact, Leadership"
          value={category.title}
          onChange={(e) => onChange('title', e.target.value)}
          required
          aria-required="true"
        />
        <p className="text-sm text-gray-500">
          {category.competencies.length} competenc{category.competencies.length === 1 ? 'y' : 'ies'}
        </p>
      </div>

      {/* Competencies */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Competencies <span className="text-red-500">*</span>
        </Label>
        {category.competencies.length > 0 ? (
          <Accordion type="multiple" className="space-y-2">
            {category.competencies.map((competency, compIdx) => (
              <AccordionItem key={compIdx} value={`comp-${compIdx}`} className="border rounded-md">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="text-sm font-medium">
                    {competency.name || `Competency ${compIdx + 1}`}
                    <span className="text-gray-500 ml-2 text-xs">
                      ({competency.levels.length} level{competency.levels.length === 1 ? '' : 's'})
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2">
                  <CompetencyEditor
                    competency={competency}
                    competencyIndex={compIdx}
                    onChange={(field, value) => onCompetencyChange(compIdx, field, value)}
                    onExpectationChange={(expIdx, field, value) =>
                      onExpectationChange(compIdx, expIdx, field, value)
                    }
                    onAddExpectation={() => onAddExpectation(compIdx)}
                    onRemoveExpectation={(expIdx) => onRemoveExpectation(compIdx, expIdx)}
                    onRemove={() => onRemoveCompetency(compIdx)}
                    canRemove={category.competencies.length > 1}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-gray-500 italic">No competencies yet. Click "Add Competency" below.</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddCompetency}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Competency
        </Button>
      </div>
    </div>
  );
}
