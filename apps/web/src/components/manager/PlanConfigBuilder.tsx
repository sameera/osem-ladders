/**
 * PlanConfigBuilder Component
 * Main builder orchestrator for categories/competencies/expectations
 */

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryEditor } from './CategoryEditor';
import type { Category, Expectation } from '@/data/model';

interface PlanConfigBuilderProps {
  planConfig: Category[];
  onChange: (config: Category[]) => void;
}

export function PlanConfigBuilder({ planConfig, onChange }: PlanConfigBuilderProps) {
  // Add category
  const handleAddCategory = () => {
    onChange([...planConfig, { title: '', competencies: [] }]);
  };

  // Remove category
  const handleRemoveCategory = (categoryIndex: number) => {
    onChange(planConfig.filter((_, i) => i !== categoryIndex));
  };

  // Update category field
  const handleCategoryChange = (categoryIndex: number, field: 'title', value: string) => {
    const updated = [...planConfig];
    updated[categoryIndex] = { ...updated[categoryIndex], [field]: value };
    onChange(updated);
  };

  // Add competency to category
  const handleAddCompetency = (categoryIndex: number) => {
    const updated = [...planConfig];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      competencies: [
        ...updated[categoryIndex].competencies,
        { name: '', levels: [{ level: 1, title: '', content: '' }] },
      ],
    };
    onChange(updated);
  };

  // Remove competency from category
  const handleRemoveCompetency = (categoryIndex: number, competencyIndex: number) => {
    const updated = [...planConfig];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      competencies: updated[categoryIndex].competencies.filter((_, i) => i !== competencyIndex),
    };
    onChange(updated);
  };

  // Update competency field
  const handleCompetencyChange = (
    categoryIndex: number,
    competencyIndex: number,
    field: 'name',
    value: string
  ) => {
    const updated = [...planConfig];
    updated[categoryIndex].competencies[competencyIndex] = {
      ...updated[categoryIndex].competencies[competencyIndex],
      [field]: value,
    };
    onChange(updated);
  };

  // Add expectation to competency
  const handleAddExpectation = (categoryIndex: number, competencyIndex: number) => {
    const updated = [...planConfig];
    const currentLevels = updated[categoryIndex].competencies[competencyIndex].levels;
    const nextLevel = currentLevels.length > 0
      ? Math.max(...currentLevels.map(l => l.level)) + 1
      : 1;

    updated[categoryIndex].competencies[competencyIndex].levels.push({
      level: nextLevel,
      title: '',
      content: '',
    });
    onChange(updated);
  };

  // Remove expectation from competency
  const handleRemoveExpectation = (
    categoryIndex: number,
    competencyIndex: number,
    expectationIndex: number
  ) => {
    const updated = [...planConfig];
    updated[categoryIndex].competencies[competencyIndex].levels =
      updated[categoryIndex].competencies[competencyIndex].levels.filter((_, i) => i !== expectationIndex);
    onChange(updated);
  };

  // Update expectation field
  const handleExpectationChange = (
    categoryIndex: number,
    competencyIndex: number,
    expectationIndex: number,
    field: keyof Expectation,
    value: string | number
  ) => {
    const updated = [...planConfig];
    updated[categoryIndex].competencies[competencyIndex].levels[expectationIndex] = {
      ...updated[categoryIndex].competencies[competencyIndex].levels[expectationIndex],
      [field]: value,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Plan Configuration <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500">
            {planConfig.length} categor{planConfig.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
      </div>

      {planConfig.length > 0 ? (
        <div className="space-y-4">
          {planConfig.map((category, catIdx) => (
            <CategoryEditor
              key={catIdx}
              category={category}
              categoryIndex={catIdx}
              onChange={(field, value) => handleCategoryChange(catIdx, field, value)}
              onCompetencyChange={(compIdx, field, value) =>
                handleCompetencyChange(catIdx, compIdx, field, value)
              }
              onExpectationChange={(compIdx, expIdx, field, value) =>
                handleExpectationChange(catIdx, compIdx, expIdx, field, value)
              }
              onAddCompetency={() => handleAddCompetency(catIdx)}
              onRemoveCompetency={(compIdx) => handleRemoveCompetency(catIdx, compIdx)}
              onAddExpectation={(compIdx) => handleAddExpectation(catIdx, compIdx)}
              onRemoveExpectation={(compIdx, expIdx) => handleRemoveExpectation(catIdx, compIdx, expIdx)}
              onRemove={() => handleRemoveCategory(catIdx)}
              canRemove={planConfig.length > 1}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No categories yet. Click "Add Category" to get started.</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleAddCategory}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Category
      </Button>
    </div>
  );
}
