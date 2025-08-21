import React from 'react';

export interface WorkflowState {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  is_initial: boolean;
  is_final: boolean;
  order: number;
}

export interface WorkflowTransition {
  id: string;
  from_state: string;
  to_state: string;
  from_state_name: string;
  to_state_name: string;
  name: string;
  description: string;
  require_role: string;
  require_comment: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  entity_type: string;
  is_active: boolean;
  created_by_name: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  created_at: string;
  updated_at: string;
}

interface WorkflowVisualizationProps {
  workflow: WorkflowTemplate;
  currentStateId?: string;
  onStateClick?: (state: WorkflowState) => void;
  compact?: boolean;
}

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  workflow,
  currentStateId,
  onStateClick,
  compact = false
}) => {
  const getStateIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      'lightbulb': '💡',
      'document-text': '📄',
      'code': '💻',
      'beaker': '🧪',
      'check-circle': '✅',
      'clipboard-list': '📋',
      'play': '▶️',
      'pause': '⏸️',
      'eye': '👁️',
      'x-circle': '❌'
    };
    return iconMap[iconName] || '⚪';
  };

  const getTransitionsForState = (stateId: string) => {
    return workflow.transitions.filter(t => t.from_state === stateId);
  };

  const sortedStates = [...workflow.states].sort((a, b) => a.order - b.order);

  if (compact) {
    return (
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {sortedStates.map((state, index) => (
          <React.Fragment key={state.id}>
            <div
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                currentStateId === state.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              onClick={() => onStateClick?.(state)}
            >
              <span 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: state.color }}
              ></span>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {state.name}
              </span>
              {currentStateId === state.id && (
                <span className="text-primary-600 text-xs">●</span>
              )}
            </div>
            {index < sortedStates.length - 1 && (
              <div className="flex-shrink-0 text-gray-400">
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{workflow.name}</h3>
        <p className="text-sm text-gray-600">{workflow.description}</p>
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <span className="capitalize">{workflow.entity_type}</span>
          <span className="mx-2">•</span>
          <span>{workflow.states.length} states</span>
          <span className="mx-2">•</span>
          <span>{workflow.transitions.length} transitions</span>
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="space-y-6">
        {/* States Row */}
        <div className="flex items-center justify-between">
          {sortedStates.map((state, index) => (
            <React.Fragment key={state.id}>
              <div className="flex flex-col items-center space-y-2">
                {/* State Circle */}
                <div
                  className={`relative w-16 h-16 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all ${
                    currentStateId === state.id
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                  }`}
                  style={{ 
                    borderColor: currentStateId === state.id ? state.color : undefined,
                    backgroundColor: currentStateId === state.id ? `${state.color}20` : undefined
                  }}
                  onClick={() => onStateClick?.(state)}
                  title={state.description}
                >
                  <span className="text-lg">{getStateIcon(state.icon)}</span>
                  {state.is_initial && (
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">S</span>
                    </div>
                  )}
                  {state.is_final && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">E</span>
                    </div>
                  )}
                  {currentStateId === state.id && (
                    <div className="absolute -bottom-1 w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
                  )}
                </div>

                {/* State Label */}
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{state.name}</div>
                  <div className="text-xs text-gray-500 max-w-20 truncate" title={state.description}>
                    {state.description}
                  </div>
                </div>
              </div>

              {/* Arrow to Next State */}
              {index < sortedStates.length - 1 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-16 h-0.5 bg-gray-300 relative">
                    <div className="absolute right-0 top-0 w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-b-2 border-t-transparent border-b-transparent transform -translate-y-1/2"></div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Transitions List */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Available Transitions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workflow.transitions.map((transition) => (
              <div
                key={transition.id}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {transition.name}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {transition.require_role}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {transition.from_state_name} → {transition.to_state_name}
                </div>
                <p className="text-xs text-gray-500">{transition.description}</p>
                {(transition.require_comment) && (
                  <div className="flex items-center mt-2 space-x-2">
                    {transition.require_comment && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Comment Required
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowVisualization;