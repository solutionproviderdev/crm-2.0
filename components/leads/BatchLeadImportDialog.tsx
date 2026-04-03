"use client";

import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
  Table as TableIcon
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { User } from "@/lib/types";
import { 
  ParsedLeadRow, 
  parseCSV, 
  parseExcel, 
  downloadSampleCSV, 
  downloadSampleXLSX 
} from "@/lib/lead-import-utils";
import { createLeadsBulk } from "@/app/actions/leads/mutations";
import { cn } from "@/utils/cn";

interface BatchLeadImportDialogProps {
  users: User[];
}

export function BatchLeadImportDialog({ users }: BatchLeadImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "result">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [importResult, setImportResult] = useState<{ inserted: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setParsedRows([]);
    setImportResult(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    
    if (extension !== "csv" && extension !== "xlsx" && extension !== "xls") {
      toast.error("Unsupported file format. Please upload CSV or Excel.");
      return;
    }

    toast.loading("Parsing file...", { id: "parse-loading" });

    try {
      let rows: ParsedLeadRow[] = [];
      if (extension === "csv") {
        rows = await parseCSV(selectedFile, users);
      } else {
        rows = await parseExcel(selectedFile, users);
      }
      
      setParsedRows(rows);
      setStep("preview");
      toast.success("File parsed successfully", { id: "parse-loading" });
    } catch (error) {
      console.error("Parsing error:", error);
      toast.error("Failed to parse file", { id: "parse-loading" });
    }
  };

  const handleImport = async () => {
    const validLeads = parsedRows
      .filter((r) => r.isValid && r.mappedData)
      .map((r) => r.mappedData!);

    if (validLeads.length === 0) {
      toast.error("No valid leads to import.");
      return;
    }

    setStep("importing");
    
    try {
      const result = await createLeadsBulk(validLeads);
      if (result.success) {
        setImportResult(result.data);
        setStep("result");
        toast.success(`Successfully imported ${result.data.inserted} leads`);
      } else {
        toast.error(result.error || "Import failed");
        setStep("preview");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("A network error occurred during import");
      setStep("preview");
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold shadow-sm">
          <Upload className="h-4 w-4" />
          Batch Import
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "transition-all duration-300 ease-in-out",
        step === "preview" ? "max-w-6xl w-[95vw]" : "max-w-md"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "upload" && "Import Leads"}
            {step === "preview" && "Preview & Validate Leads"}
            {step === "importing" && "Importing..."}
            {step === "result" && "Import Summary"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) processFile(droppedFile);
              }}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-(--brand-primary)/50 hover:bg-(--brand-primary)/2 transition-colors cursor-pointer group"
            >
              <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-(--brand-primary)/10 transition-colors">
                <Upload className="h-7 w-7 text-gray-400 group-hover:text-(--brand-primary) transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">CSV or Excel files only (max 5MB)</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Download Templates</p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 rounded-xl text-xs font-bold py-5 border-gray-200 hover:border-gray-300"
                  onClick={downloadSampleCSV}
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  Sample CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 rounded-xl text-xs font-bold py-5 border-gray-200 hover:border-gray-300"
                  onClick={downloadSampleXLSX}
                >
                  <TableIcon className="h-4 w-4 text-green-500" />
                  Sample XLSX
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
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
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="text-gray-500 hover:text-red-500 font-bold gap-2">
                <X className="h-4 w-4" />
                Discard & Upload New
              </Button>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto shadow-inner bg-white">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-12 text-center font-bold text-xs">#</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Source</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Phones</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Sales/CRE</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow key={idx} className={cn(
                      "group hover:bg-gray-50/50",
                      !row.isValid && "bg-red-50/30 hover:bg-red-50/50"
                    )}>
                      <TableCell className="text-center text-gray-400 font-medium text-xs">{row.rowNumber}</TableCell>
                      <TableCell>
                        {row.isValid ? (
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
                        {row.data.name || <span className="text-red-400 italic">Missing</span>}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                          {row.data.source || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-600 whitespace-nowrap">
                        {row.data.phones || <span className="text-red-400 italic">Empty</span>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 font-medium">
                        <div className="flex flex-col gap-0.5">
                          {row.data.sales_email && <span className="truncate max-w-[120px]">{row.data.sales_email}</span>}
                          {row.data.cre_email && <span className="truncate max-w-[120px] text-gray-400">{row.data.cre_email}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <div className="flex flex-col gap-1">
                            {row.errors.map((err, i) => (
                              <span key={i} className="text-[10px] font-bold text-red-600 leading-tight">
                                • {err}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <DialogFooter className="pt-2">
              <Button 
                variant="outline" 
                onClick={reset}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={validCount === 0}
                className="bg-(--brand-primary) text-white hover:opacity-90 rounded-xl font-bold gap-2 px-8"
              >
                <Download className="h-4 w-4" />
                Add {validCount} Leads
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <div className="py-20 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-gray-100 border-t-(--brand-primary) animate-spin" />
              <Loader2 className="h-6 w-6 text-(--brand-primary) absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 tracking-tight">Importing Leads...</p>
              <p className="text-gray-500 text-sm mt-1 font-medium">Please do not close this window</p>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
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
                <p className="text-3xl font-black text-green-600 line-clamp-1">{importResult.inserted}</p>
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest mt-1">Inserted</p>
              </div>
              <div className={cn(
                "p-6 rounded-2xl border text-center shadow-sm",
                importResult.failed > 0 ? "bg-red-50/50 border-red-100" : "bg-gray-50/50 border-gray-100"
              )}>
                <p className={cn(
                  "text-3xl font-black line-clamp-1",
                  importResult.failed > 0 ? "text-red-600" : "text-gray-400"
                )}>
                  {importResult.failed}
                </p>
                <p className={cn(
                  "text-xs font-bold uppercase tracking-widest mt-1",
                  importResult.failed > 0 ? "text-red-700" : "text-gray-400"
                )}>
                  Failed
                </p>
              </div>
            </div>

            <Button 
              className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-bold h-12 shadow-md shadow-gray-200"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Finish & Refresh List
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
