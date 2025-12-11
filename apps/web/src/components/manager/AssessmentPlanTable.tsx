/**
 * AssessmentPlanTable Component
 * Plans table with responsive layout
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Pencil } from 'lucide-react';
import { ClonePlanDialog } from './ClonePlanDialog';
import { EditPlanDialog } from './EditPlanDialog';
import type { AssessmentPlan } from '@/types/assessments';

interface AssessmentPlanTableProps {
  plans: AssessmentPlan[];
  isLoading?: boolean;
  emptyMessage?: string;
  onClone?: (plan: AssessmentPlan) => void;
  onEdit?: (plan: AssessmentPlan) => void;
}

export function AssessmentPlanTable({
  plans,
  isLoading = false,
  emptyMessage = 'No assessment plans found',
  onClone,
  onEdit,
}: AssessmentPlanTableProps) {
  const [cloningPlan, setCloningPlan] = useState<AssessmentPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<AssessmentPlan | null>(null);

  // Empty state
  if (!isLoading && plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground mt-4" role="status" aria-live="polite">
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
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Season
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Plan Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plans.map((plan) => (
                    <tr
                      key={`${plan.teamId}-${plan.season}`}
                      className={`hover:bg-muted/50 transition-colors ${
                        !plan.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{plan.teamId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{plan.season}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {plan.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{plan.createdBy}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{formatDate(plan.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {plan.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPlan(plan)}
                            aria-label={`Edit ${plan.name}`}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCloningPlan(plan)}
                            aria-label={`Clone ${plan.name}`}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Clone
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {plans.map((plan) => (
                <div
                  key={`${plan.teamId}-${plan.season}`}
                  className={`p-4 space-y-3 ${!plan.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.teamId} • {plan.season}
                      </p>
                    </div>
                    {plan.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <div>Created: {formatDate(plan.createdAt)}</div>
                    <div>By: {plan.createdBy}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPlan(plan)}
                      className="flex-1"
                      aria-label={`Edit ${plan.name}`}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCloningPlan(plan)}
                      className="flex-1"
                      aria-label={`Clone ${plan.name}`}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Clone
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {editingPlan && (
        <EditPlanDialog
          plan={editingPlan}
          open={!!editingPlan}
          onOpenChange={(open) => !open && setEditingPlan(null)}
          onEdit={(data) => {
            onEdit?.(editingPlan);
            setEditingPlan(null);
          }}
        />
      )}

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
