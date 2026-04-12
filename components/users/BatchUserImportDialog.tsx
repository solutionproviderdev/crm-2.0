"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table as TableIcon,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/utils/cn";
import type { Department, Role } from "@/lib/types";
import {
  parseUserFile,
  generateUserCSVTemplate,
  generateUserXLSXTemplate,
  type ValidatedUserRow,
} from "@/lib/user-import-utils";
import { bulkCreateUsers, type BulkImportResult } from "@/app/actions/users";
import { SENTINEL_USER_ID } from "@/constants/system";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 10; // smaller than leads — auth creation is heavier
const MAX_FILE_MB = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function BatchUserImportDialog() {
  const [open, setOpen]   = useState(false);
  const [step, setStep]   = useState<"upload" | "preview" | "importing" | "result">("upload");

  // Data prefetched when dialog opens
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles,       setRoles]       = useState<Role[]>([]);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [prefetching, setPrefetching] = useState(false);

  // File parsing
  const [parsedRows, setParsedRows] = useState<ValidatedUserRow[]>([]);
  const [parsing,    setParsing]    = useState(false);

  // Import progress
  const [importProgress, setImportProgress] = useState({
    total: 0, processed: 0, success: 0, failed: 0, currentBatchIndex: 0,
  });
  const [importResult, setImportResult] = useState<BulkImportResult & { total: number } | null>(null);
  const [failureDetails, setFailureDetails] = useState<Array<{ email: string; error: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Prefetch lookup data when dialog opens ──────────────────────────────
  useEffect(() => {
    if (!open) return;
    setPrefetching(true);

    const supabase = createClient();
    Promise.all([
      supabase.from("departments").select("id, name").order("name"),
      supabase.from("roles").select("id, name, department_id, department:departments(id, name)").order("name"),
      supabase.from("users").select("email").neq("id", SENTINEL_USER_ID ?? "00000000-0000-0000-0000-000000000000"),
    ]).then(([deptRes, rolesRes, emailRes]) => {
      setDepartments((deptRes.data ?? []) as Department[]);
      setRoles((rolesRes.data ?? []) as unknown as Role[]);
      setExistingEmails((emailRes.data ?? []).map((u: { email: string }) => u.email));
    }).catch(err => {
      console.error("Prefetch error:", err);
      toast.error("Failed to load reference data");
    }).finally(() => setPrefetching(false));
  }, [open]);

  // ── Reset ───────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("upload");
    setParsedRows([]);
    setImportResult(null);
    setFailureDetails([]);
    setImportProgress({ total: 0, processed: 0, success: 0, failed: 0, currentBatchIndex: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ── File processing ─────────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_MB}MB.`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      toast.error("Unsupported file format. Please upload CSV or Excel.");
      return;
    }

    setParsing(true);
    toast.loading("Parsing file...", { id: "user-parse" });

    try {
      const rows = await parseUserFile(file, departments, roles, existingEmails);
      setParsedRows(rows);
      setStep("preview");
      toast.success(`Parsed ${rows.length} rows`, { id: "user-parse" });
    } catch (err) {
      console.error("Parse error:", err);
      toast.error("Failed to parse file", { id: "user-parse" });
    } finally {
      setParsing(false);
    }
  }, [departments, roles, existingEmails]);

  // ── Drag & drop ─────────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // ── Import ──────────────────────────────────────────────────────────────
  const handleImport = useCallback(async (resumeFromBatch = 0) => {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) { toast.error("No valid users to import."); return; }

    setStep("importing");

    let cumSuccess  = resumeFromBatch > 0 ? importProgress.success  : 0;
    let cumFailed   = resumeFromBatch > 0 ? importProgress.failed   : 0;
    let cumProcessed = resumeFromBatch > 0 ? importProgress.processed : 0;
    const allFailed: Array<{ email: string; error: string }> = [...failureDetails];

    if (resumeFromBatch === 0) {
      setImportProgress({ total: validRows.length, processed: 0, success: 0, failed: 0, currentBatchIndex: 0 });
      setFailureDetails([]);
    }

    const startIdx = resumeFromBatch * BATCH_SIZE;

    for (let i = startIdx; i < validRows.length; i += BATCH_SIZE) {
      const batchIndex = Math.floor(i / BATCH_SIZE);
      const chunk = validRows.slice(i, i + BATCH_SIZE);
      setImportProgress(prev => ({ ...prev, currentBatchIndex: batchIndex }));

      try {
        const result = await bulkCreateUsers(chunk);
        cumSuccess   += result.succeeded;
        cumFailed    += result.failed.length;
        allFailed.push(...result.failed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        toast.error(`Batch ${batchIndex + 1} failed: ${msg}`);
        // Pause — let user resume or cancel
        setImportProgress({
          total: validRows.length,
          processed: cumProcessed,
          success: cumSuccess,
          failed: cumFailed,
          currentBatchIndex: batchIndex,
        });
        setFailureDetails(allFailed);
        return;
      }

      cumProcessed += chunk.length;
      setImportProgress({
        total: validRows.length,
        processed: cumProcessed,
        success: cumSuccess,
        failed: cumFailed,
        currentBatchIndex: batchIndex + 1,
      });
    }

    // All done
    setFailureDetails(allFailed);
    setImportResult({ succeeded: cumSuccess, failed: allFailed, total: validRows.length });
    setStep("result");
    toast.success("Import complete!");
  }, [parsedRows, importProgress, failureDetails]);

  // ── Download error report ────────────────────────────────────────────────
  function downloadErrorReport() {
    const csv = [
      ["email", "error"].join(","),
      ...failureDetails.map(r => [`"${r.email}"`, `"${r.error.replace(/"/g, "'")}"`].join(",")),
    ].join("\n");
    const link = document.createElement("a");
    link.href  = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = "user_import_errors.csv";
    link.click();
  }

  // ── Derived counts ───────────────────────────────────────────────────────
  const validCount   = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.length - validCount;
  const isImporting  = step === "importing" && importProgress.processed < importProgress.total;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (isImporting) return; // block close during import
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          id="bulk-import-users-btn"
          className="gap-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold shadow-sm"
        >
          <Upload className="h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>

      <DialogContent
        className={cn(
          "transition-all duration-300 ease-in-out",
          step === "preview" ? "max-w-6xl w-[95vw]" : "max-w-md",
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#006080]" />
            {step === "upload"    && "Bulk Import Users"}
            {step === "preview"   && "Preview & Validate Users"}
            {step === "importing" && "Importing Users..."}
            {step === "result"    && "Import Summary"}
          </DialogTitle>
        </DialogHeader>

        {/* ── Prefetch loading overlay ─────────────────────────────────── */}
        {prefetching && step === "upload" && (
          <div className="flex items-center justify-center gap-3 py-4 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin text-[#006080]" />
            Loading reference data...
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 0 — UPLOAD
        ════════════════════════════════════════════════════════════════ */}
        {step === "upload" && !prefetching && (
          <div className="space-y-6 py-4">

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-[#006080]/50 hover:bg-[#006080]/[0.02] transition-colors cursor-pointer group"
            >
              {parsing ? (
                <Loader2 className="h-10 w-10 animate-spin text-[#006080]" />
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#006080]/10 transition-colors">
                    <Upload className="h-7 w-7 text-gray-400 group-hover:text-[#006080] transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">CSV or Excel files only (max 5MB)</p>
                  </div>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              />
            </div>

            {/* Template downloads */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Download Templates</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline" size="sm"
                  className="gap-2 rounded-xl text-xs font-bold py-5 border-gray-200 hover:border-gray-300"
                  onClick={generateUserCSVTemplate}
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  Sample CSV
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="gap-2 rounded-xl text-xs font-bold py-5 border-gray-200 hover:border-gray-300"
                  onClick={generateUserXLSXTemplate}
                >
                  <TableIcon className="h-4 w-4 text-green-500" />
                  Sample XLSX
                </Button>
              </div>
            </div>

            {/* Column list hint */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Required Columns</p>
              <div className="flex flex-wrap gap-1.5">
                {["name", "email", "password"].map(col => (
                  <span key={col} className="px-2 py-0.5 rounded-md bg-[#006080]/10 text-[#006080] text-[10px] font-bold">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 1 — PREVIEW
        ════════════════════════════════════════════════════════════════ */}
        {step === "preview" && (
          <div className="space-y-4">

            {/* Summary bar */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-sm font-bold text-gray-700">{validCount} Valid</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-sm",
                  invalidCount > 0 ? "bg-red-50 border-red-100" : "bg-white border-gray-200"
                )}>
                  <AlertCircle className={cn("h-3.5 w-3.5", invalidCount > 0 ? "text-red-500" : "text-gray-300")} />
                  <span className={cn("text-sm font-bold", invalidCount > 0 ? "text-red-700" : "text-gray-700")}>
                    {invalidCount} Invalid
                  </span>
                </div>
                {invalidCount > 0 && (
                  <p className="text-xs text-gray-400 hidden sm:block">Only valid rows will be imported</p>
                )}
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={reset}
                className="text-gray-500 hover:text-red-500 font-bold gap-2"
              >
                <X className="h-4 w-4" />
                Discard & Upload New
              </Button>
            </div>

            {/* Preview table */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-[420px] overflow-y-auto shadow-inner bg-white">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold text-xs">#</TableHead>
                    <TableHead className="w-8 font-bold text-xs"></TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Email</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Dept / Role</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Emp. Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Errors / Warnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => (
                    <TableRow
                      key={row.rowNumber}
                      className={cn(
                        "group hover:bg-gray-50/50",
                        !row.valid && "bg-red-50/40 hover:bg-red-50/60"
                      )}
                    >
                      <TableCell className="text-center text-gray-400 font-medium text-xs">{row.rowNumber}</TableCell>
                      <TableCell>
                        {row.valid ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-gray-900 text-sm whitespace-nowrap">
                        {row.name || <span className="text-red-400 italic text-xs">Missing</span>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 font-medium">
                        {row.email || <span className="text-red-400 italic">Missing</span>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          {row.department_name && <span className="font-medium text-gray-700">{row.department_name}</span>}
                          {row.role_name && <span className="text-gray-400">{row.role_name}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                          {row.type ?? "Operator"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-semibold text-gray-500">{row.employment_status ?? "trainee"}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          {row.errors.map((err, i) => (
                            <span key={i} className="text-[10px] font-bold text-red-600 leading-tight">• {err}</span>
                          ))}
                          {row.warnings.map((w, i) => (
                            <span key={i} className="text-[10px] font-semibold text-amber-600 leading-tight">⚠ {w}</span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={reset} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button
                onClick={() => handleImport(0)}
                disabled={validCount === 0}
                className="bg-[#006080] text-white hover:bg-[#005070] rounded-xl font-bold gap-2 px-8 disabled:opacity-50"
              >
                <Users className="h-4 w-4" />
                Import {validCount} User{validCount !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2 — IMPORTING / PROGRESS
        ════════════════════════════════════════════════════════════════ */}
        {step === "importing" && (
          <div className="py-12 flex flex-col items-center justify-center gap-6">
            {isImporting ? (
              <>
                {/* Active spinner */}
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-gray-100 border-t-[#006080] animate-spin" />
                  <Loader2 className="h-6 w-6 text-[#006080] absolute inset-0 m-auto animate-pulse" />
                </div>

                <div className="text-center w-full max-w-sm">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Creating Users...</h3>
                  <p className="text-gray-500 text-sm mt-1 font-medium mb-6">
                    Batch {importProgress.currentBatchIndex + 1} of{" "}
                    {Math.ceil(importProgress.total / BATCH_SIZE)} — please do not close this window
                  </p>

                  <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="bg-[#006080] h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(4, (importProgress.processed / importProgress.total) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>{importProgress.processed} / {importProgress.total} Users</span>
                    <span>{Math.round((importProgress.processed / importProgress.total) * 100) || 0}%</span>
                  </div>

                  <div className="flex gap-4 justify-center mt-6 text-sm">
                    <span className="text-green-600 font-bold">{importProgress.success} Created</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-red-500 font-bold">{importProgress.failed} Failed</span>
                  </div>
                </div>
              </>
            ) : (
              /* Paused / batch error */
              <div className="text-center space-y-6 w-full max-w-sm">
                <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Import Paused</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    A batch failed to process. You can resume from where it left off.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm font-medium flex justify-between">
                  <div><span className="text-gray-400">Processed:</span> {importProgress.processed} / {importProgress.total}</div>
                  <div>
                    <span className="text-green-600 font-bold">{importProgress.success}</span>
                    {" / "}
                    <span className="text-red-500 font-bold">{importProgress.failed}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("result")}>
                    Cancel & View Results
                  </Button>
                  <Button
                    className="flex-1 bg-[#006080] hover:bg-[#005070] text-white"
                    onClick={() => handleImport(importProgress.currentBatchIndex)}
                  >
                    Resume Import
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 3 — COMPLETE
        ════════════════════════════════════════════════════════════════ */}
        {step === "result" && importResult && (
          <div className="space-y-8 py-6">

            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center border-2 border-green-100 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Import Completed</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  The process has finished with the following results:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 text-center shadow-sm">
                <p className="text-3xl font-black text-green-600">{importResult.succeeded}</p>
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest mt-1">Created</p>
              </div>
              <div className={cn(
                "p-6 rounded-2xl border text-center shadow-sm",
                importResult.failed.length > 0 ? "bg-red-50/50 border-red-100" : "bg-gray-50/50 border-gray-100"
              )}>
                <p className={cn(
                  "text-3xl font-black",
                  importResult.failed.length > 0 ? "text-red-600" : "text-gray-400"
                )}>
                  {importResult.failed.length}
                </p>
                <p className={cn(
                  "text-xs font-bold uppercase tracking-widest mt-1",
                  importResult.failed.length > 0 ? "text-red-700" : "text-gray-400"
                )}>
                  Failed
                </p>
              </div>
            </div>

            {/* Error download */}
            {importResult.failed.length > 0 && (
              <Button
                variant="outline"
                className="w-full gap-2 rounded-xl font-bold border-red-200 text-red-600 hover:bg-red-50"
                onClick={downloadErrorReport}
              >
                <Download className="h-4 w-4" />
                Download Error Report ({importResult.failed.length} rows)
              </Button>
            )}

            <Button
              className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-bold h-12 shadow-md shadow-gray-200"
              onClick={() => { setOpen(false); reset(); }}
            >
              Done & Refresh List
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
