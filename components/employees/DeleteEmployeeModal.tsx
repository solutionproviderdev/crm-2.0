"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, XCircle } from "lucide-react";
import { getEmployeeDeletionSummary, getActiveEmployeesForReassignment } from "@/lib/supabase/employees";
import type { Employee } from "@/types/employee";

interface Props {
  user: Employee;
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = "summary" | "reassign" | "processing" | "success" | "error";

interface ProgressState {
  step: number;
  message: string;
  percent: number;
}

export function DeleteEmployeeModal({ user, isOpen, onClose }: Props) {
  const router = useRouter();

  const [modalState, setModalState] = useState<ModalState>("summary");
  const [counts, setCounts] = useState({ creCount: 0, salesCount: 0 });
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  const [activeUsers, setActiveUsers] = useState<Pick<Employee, "id" | "name" | "role">[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const [newCreId, setNewCreId] = useState("");
  const [newSalesId, setNewSalesId] = useState("");

  const [progress, setProgress] = useState<ProgressState>({ step: 1, message: "Initializing...", percent: 0 });
  const [errorMessage, setErrorMessage] = useState("");

  // Step 1: Summary validation
  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setModalState("summary");
    setNewCreId("");
    setNewSalesId("");
    setProgress({ step: 1, message: "Initializing...", percent: 0 });
    setErrorMessage("");

    async function fetchCounts() {
      setIsLoadingCounts(true);
      const res = await getEmployeeDeletionSummary(user.id);
      if (res.success && res.data) {
        setCounts(res.data);
      }
      setIsLoadingCounts(false);
    }
    fetchCounts();
  }, [isOpen, user.id]);

  // Step 2 logic: Active users fetching
  useEffect(() => {
    if (modalState === "reassign" && activeUsers.length === 0) {
      async function fetchUsers() {
        setIsLoadingUsers(true);
        const res = await getActiveEmployeesForReassignment(user.id);
        if (res.success && res.data) {
          setActiveUsers(res.data);
        }
        setIsLoadingUsers(false);
      }
      fetchUsers();
    }
  }, [modalState, activeUsers.length, user.id]);

  if (!isOpen) return null;

  async function handleProceedFromSummary() {
    if (counts.creCount > 0 || counts.salesCount > 0) {
      setModalState("reassign");
    } else {
      await executeDeletion(); // Skip to processing if no leads
    }
  }

  async function executeDeletion() {
    setModalState("processing");
    setProgress({ step: 1, message: "Starting deletion process...", percent: 5 });
    
    try {
      const response = await fetch("/api/employees/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newCreId: newCreId || null,
          newSalesId: newSalesId || null,
        }),
      });

      if (!response.body) throw new Error("No readable stream available.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let isDone = false;
      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;
            
            const data = JSON.parse(dataStr);
            
            if (currentEvent === "progress") {
              setProgress({ step: data.step, message: data.message, percent: data.percent });
            } else if (currentEvent === "error") {
              throw new Error(data.message);
            } else if (currentEvent === "complete") {
              setProgress({ step: 9, message: "Deletion complete.", percent: 100 });
              isDone = true;
            }
          }
        }
      }
      
      setModalState("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong during deletion.");
      setModalState("error");
    }
  }

  function handleRetry() {
    setErrorMessage("");
    executeDeletion();
  }

  function handleSuccessClose() {
    onClose();
    router.push("/users"); // Redirect to the employee list (Assuming /users is the list route)
  }

  const isReassignValid = () => {
    if (counts.creCount > 0 && !newCreId) return false;
    if (counts.salesCount > 0 && !newSalesId) return false;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 overflow-hidden">
        
        {/* Close Button Disabled during Processing */}
        {modalState !== "processing" && modalState !== "success" && (
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        )}

        {/* --- STATE: SUMMARY --- */}
        {modalState === "summary" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delete Employee</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  You are about to permanently delete <strong>{user.name}</strong>.
                </p>
              </div>

              <div className="w-full bg-red-50 border border-red-200 text-red-800 text-sm font-semibold p-3 rounded-lg">
                This action is permanent and cannot be undone.
              </div>

              {isLoadingCounts ? (
                <div className="w-full space-y-2 mt-4">
                  <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ) : (
                <div className="w-full grid grid-cols-2 gap-3 mt-4 text-left">
                  <div className="border rounded-xl p-3 bg-gray-50/50">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Leads (CRE)</p>
                    <p className="text-2xl font-bold text-gray-900">{counts.creCount}</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-gray-50/50">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Leads (Sales)</p>
                    <p className="text-2xl font-bold text-gray-900">{counts.salesCount}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 w-full mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedFromSummary}
                  disabled={isLoadingCounts}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  Confirm & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STATE: REASSIGN --- */}
        {modalState === "reassign" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Reassign Deals</h2>
            <p className="text-sm text-gray-500 mb-6">
              Please transfer <span className="font-semibold text-gray-700">{user.name}</span>&#39;s assigned entities to active operators before completing the deletion.
            </p>

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                {counts.creCount > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Reassign {counts.creCount} CRE leads to:
                    </label>
                    <div className="relative">
                      <select
                        value={newCreId}
                        onChange={(e) => setNewCreId(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                      >
                        <option value="" disabled>Select active user...</option>
                        {activeUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role?.name || "No Role"})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none opacity-50" />
                    </div>
                  </div>
                )}

                {counts.salesCount > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Reassign {counts.salesCount} Sales leads to:
                    </label>
                    <div className="relative">
                      <select
                        value={newSalesId}
                        onChange={(e) => setNewSalesId(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                      >
                        <option value="" disabled>Select active user...</option>
                        {activeUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role?.name || "No Role"})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none opacity-50" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 w-full mt-8">
              <button
                onClick={() => setModalState("summary")}
                className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={executeDeletion}
                disabled={!isReassignValid()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Confirm & Delete Employee
              </button>
            </div>
          </div>
        )}

        {/* --- STATE: PROCESSING --- */}
        {modalState === "processing" && (
          <div className="py-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            <Loader2 className="h-10 w-10 text-red-600 animate-spin mb-6" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Deleting Employee...</h2>
            
            {/* Progress Bar Container */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 mt-6 mb-3 overflow-hidden">
              <div 
                className="bg-red-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress.percent}%` }}
              ></div>
            </div>
            
            <p className="text-sm font-medium text-gray-600 w-full text-left flex justify-between">
              <span>{progress.message}</span>
              <span className="text-red-600">{Math.round(progress.percent)}%</span>
            </p>
          </div>
        )}

        {/* --- STATE: ERROR --- */}
        {modalState === "error" && (
          <div className="animate-in fade-in zoom-in-95 duration-300 text-center py-4">
             <div className="mx-auto h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Deletion Interrupted</h2>
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-800 text-sm font-medium mb-6 text-left">
              <strong>Failed at Step {progress.step}:</strong> <br />
              {progress.message} <br />
              <span className="text-red-900">{errorMessage}</span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Dismiss
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Retry Step
              </button>
            </div>
          </div>
        )}

        {/* --- STATE: SUCCESS --- */}
        {modalState === "success" && (
          <div className="animate-in fade-in zoom-in-95 duration-500 text-center py-6">
            <div className="mx-auto h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Deleted</h2>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{user.name}</strong> has been permanently removed from the system.
            </p>
            
            {(counts.creCount > 0 || counts.salesCount > 0) && (
              <div className="bg-gray-50 rounded-xl p-4 text-left border mb-6 text-sm">
                <p className="font-semibold text-gray-700 mb-2 border-b pb-2">Reassignment Summary</p>
                {counts.creCount > 0 && <p className="text-gray-600 mb-1">• {counts.creCount} CRE leads transferred</p>}
                {counts.salesCount > 0 && <p className="text-gray-600">• {counts.salesCount} Sales leads transferred</p>}
              </div>
            )}

            <button
              onClick={handleSuccessClose}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              Back to Employees
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
