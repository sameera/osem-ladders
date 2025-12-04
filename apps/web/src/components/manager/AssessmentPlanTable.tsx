/**
 * AssessmentPlanTable Component
 * Plans table with responsive layout
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy } from 'lucide-react';
import { ClonePlanDialog } from './ClonePlanDialog';
import type { AssessmentPlan } from '@/types/assessments';

interface AssessmentPlanTableProps {
  plans: AssessmentPlan[];
  isLoading?: boolean;
  emptyMessage?: string;
  onClone?: (plan: AssessmentPlan) => void;
}

export function AssessmentPlanTable({
  plans,
  isLoading = false,
  emptyMessage = 'No assessment plans found',
  onClone,
}: AssessmentPlanTableProps) {
  const [cloningPlan, setCloningPlan] = useState<AssessmentPlan | null>(null);

  // Empty state
  if (!isLoading && plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
          <p className="text-sm text-gray-400 mt-2">Create your first plan using the form above</p>
        </CardContent>
      </Card>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" aria-hidden="true" />
          <p className="text-gray-500 mt-4" role="status" aria-live="polite">
            Loading plans...
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full" aria-label="Assessment plans table">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Season
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plans.map((plan) => (
                    <tr
                      key={`${plan.teamId}-${plan.season}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        !plan.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{plan.teamId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{plan.season}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {plan.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{plan.createdBy}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(plan.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {plan.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCloningPlan(plan)}
                          aria-label={`Clone ${plan.name}`}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Clone
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {plans.map((plan) => (
                <div
                  key={`${plan.teamId}-${plan.season}`}
                  className={`p-4 space-y-3 ${!plan.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {plan.teamId} • {plan.season}
                      </p>
                    </div>
                    {plan.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{plan.description}</p>
                  )}

                  <div className="text-sm text-gray-500">
                    <div>Created: {formatDate(plan.createdAt)}</div>
                    <div>By: {plan.createdBy}</div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCloningPlan(plan)}
                    className="w-full"
                    aria-label={`Clone ${plan.name}`}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Clone Plan
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clone Dialog */}
      {cloningPlan && (
        <ClonePlanDialog
          sourcePlan={cloningPlan}
          open={!!cloningPlan}
          onOpenChange={(open) => !open && setCloningPlan(null)}
          onClone={(data) => {
            onClone?.(cloningPlan);
            setCloningPlan(null);
          }}
        />
      )}
    </>
  );
}
