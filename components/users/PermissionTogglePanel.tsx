"use client";

import { ALL_PERMISSIONS } from "@/lib/permissions";
import type { PermissionMap } from "@/lib/permissions";

interface Props {
  permissions: PermissionMap;
  onChange: (permissions: PermissionMap) => void;
  readOnly?: boolean;
}

export function PermissionTogglePanel({ permissions, onChange, readOnly = false }: Props) {
  function toggle(resource: string, action: string) {
    if (readOnly) return;
    const current = permissions[resource]?.[action] ?? false;
    onChange({
      ...permissions,
      [resource]: {
        ...permissions[resource],
        [action]: !current,
      },
    });
  }

  function toggleAllForResource(resource: string, actions: readonly string[]) {
    if (readOnly) return;
    const allEnabled = actions.every((a) => permissions[resource]?.[a]);
    const updated: Record<string, boolean> = {};
    for (const a of actions) {
      updated[a] = !allEnabled;
    }
    onChange({
      ...permissions,
      [resource]: updated,
    });
  }

  function isActionEnabled(resource: string, action: string): boolean {
    return permissions[resource]?.[action] === true;
  }

  function areAllEnabled(resource: string, actions: readonly string[]): boolean {
    return actions.every((a) => isActionEnabled(resource, a));
  }

  function countEnabled(resource: string, actions: readonly string[]): number {
    return actions.filter((a) => isActionEnabled(resource, a)).length;
  }

  return (
    <div className="space-y-4">
      {ALL_PERMISSIONS.map(({ resource, actions }) => {
        const enabled = countEnabled(resource, actions);
        const allOn = areAllEnabled(resource, actions);

        return (
          <div
            key={resource}
            className={`rounded-xl border transition-colors ${
              enabled > 0
                ? "border-[#006080]/30 bg-[#006080]/[0.02]"
                : "border-gray-100 bg-gray-50/50"
            }`}
          >
            {/* Resource header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleAllForResource(resource, actions)}
                  disabled={readOnly}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 shrink-0 ${
                    allOn ? "bg-[#006080]" : "bg-gray-200"
                  } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  aria-label={`Toggle all ${resource} permissions`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      allOn ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{resource}</p>
                  <p className="text-xs text-gray-400">
                    {enabled}/{actions.length} actions enabled
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-24">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006080] rounded-full transition-all duration-300"
                    style={{ width: `${(enabled / actions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Individual action toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-3">
              {actions.map((action) => {
                const isOn = isActionEnabled(resource, action);
                return (
                  <button
                    type="button"
                    key={action}
                    onClick={() => toggle(resource, action)}
                    disabled={readOnly}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      isOn
                        ? "bg-[#006080]/10 text-[#006080] border border-[#006080]/20 font-medium"
                        : "bg-white text-gray-500 border border-gray-100 hover:border-gray-200"
                    } ${readOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
                        isOn ? "bg-[#006080]" : "bg-gray-300"
                      }`}
                    />
                    {action}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
