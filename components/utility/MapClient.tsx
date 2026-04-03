"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Check, Database, Edit2, Loader2, MapPinned, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { addDistrict, addArea, updateVisitCharge, populateMapDataFromJson } from "@/app/actions/utility/map";
import type { FlattenedMapRow, Division, District } from "@/app/actions/utility/map";

interface MapClientProps {
  initialMapData: FlattenedMapRow[];
  divisions: Division[];
  districts: District[];
}

export function MapClient({ initialMapData, divisions, districts }: MapClientProps) {
  const [mapData, setMapData] = useState(initialMapData);
  
  // Search state
  const [search, setSearch] = useState("");
  
  // Sort state
  const [sortField, setSortField] = useState<keyof FlattenedMapRow>("division_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Inline edit state
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editChargeValue, setEditChargeValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal states
  const [isAddingDistrict, setIsAddingDistrict] = useState(false);
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);

  // Add District Forms
  const [newDistDivisionId, setNewDistDivisionId] = useState("");
  const [newDistName, setNewDistName] = useState("");

  // Add Area Forms
  const [newAreaDivisionId, setNewAreaDivisionId] = useState("");
  const [newAreaDistId, setNewAreaDistId] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaCharge, setNewAreaCharge] = useState("");

  async function handlePopulate() {
    setIsPopulating(true);
    try {
      const result = await populateMapDataFromJson();
      if (result.success) {
        toast.success(result.message ?? "Map data populated successfully!");
        window.location.reload();
      } else {
        toast.error(result.error ?? "Failed to populate map data");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to populate map data");
    } finally {
      setIsPopulating(false);
    }
  }

  const handleSort = (field: keyof FlattenedMapRow) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let data = [...mapData];
    
    // Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      data = data.filter(
        (row) =>
          row.division_name.toLowerCase().includes(lowerSearch) ||
          row.district_name.toLowerCase().includes(lowerSearch) ||
          row.area_name.toLowerCase().includes(lowerSearch) ||
          row.visit_charge.toString().includes(lowerSearch)
      );
    }

    // Sort
    data.sort((a, b) => {
      let compA = a[sortField];
      let compB = b[sortField];

      if (typeof compA === "string" && typeof compB === "string") {
        compA = compA.toLowerCase();
        compB = compB.toLowerCase();
      }

      if (compA < compB) return sortDirection === "asc" ? -1 : 1;
      if (compA > compB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [mapData, search, sortField, sortDirection]);

  async function handleSaveCharge(areaId: string) {
    if (!editChargeValue || isNaN(Number(editChargeValue))) {
      toast.error("Please enter a valid number");
      return;
    }

    setIsUpdating(true);
    try {
      const charge = Number(editChargeValue);
      await updateVisitCharge(areaId, charge);
      
      // Update local state to feel snappy
      setMapData(prev => prev.map(row => 
        row.area_id === areaId ? { ...row, visit_charge: charge } : row
      ));
      
      toast.success("Visit charge updated");
      setEditingAreaId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update visit charge");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAddDistrict() {
    if (!newDistDivisionId || !newDistName) return;
    setIsSubmitting(true);
    try {
      await addDistrict(newDistDivisionId, newDistName);
      toast.success("District added. Refresh to see changes if needed."); // Using router.refresh() in parent usually works better, but let's just show a toast for now since revalidateTag might need a page reload depending on context.
      setIsAddingDistrict(false);
      setNewDistName("");
      setNewDistDivisionId("");
      window.location.reload(); // Quick cheat to ensure data is fresh from the join query.
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add district");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddArea() {
    if (!newAreaDistId || !newAreaName || !newAreaCharge) return;
    setIsSubmitting(true);
    try {
      await addArea(newAreaDistId, newAreaName, Number(newAreaCharge));
      toast.success("Area added");
      setIsAddingArea(false);
      setNewAreaName("");
      setNewAreaCharge("");
      setNewAreaDistId("");
      window.location.reload(); // Quick cheat
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add area");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm ring-1 ring-[var(--brand-primary)]/10 overflow-hidden relative">
      {/* Loading Overlay */}
      {isPopulating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] transition-all duration-300">
          <div className="p-8 rounded-3xl bg-white shadow-2xl flex flex-col items-center gap-4 border border-gray-100 ring-1 ring-black/5 animate-in zoom-in-95 duration-500">
            <div className="relative">
              <Database className="h-12 w-12 text-amber-500 animate-pulse" />
              <Loader2 className="h-12 w-12 text-amber-300 animate-spin absolute inset-0" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Populating Database</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-[240px]">
                Processing geographical data from JSON. This may take a moment.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Please Wait</span>
            </div>
          </div>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
            <MapPinned className="h-5 w-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Map Data</h1>
            <p className="text-sm text-gray-500">Manage visit charges across divisions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Search map data..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          {mapData.length === 0 && (
            <Button
              variant="outline"
              onClick={handlePopulate}
              disabled={isPopulating}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {isPopulating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Populate Data
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsAddingDistrict(true)}>
            <Plus className="h-4 w-4 mr-2" />
            District
          </Button>
          <Button onClick={() => setIsAddingArea(true)} className="bg-[var(--brand-primary)] text-white hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Area
          </Button>
        </div>
      </div>

      {/* Table Data */}
      <div className="flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("division_name")}
              >
                <div className="flex items-center gap-1">
                  Division
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("district_name")}
              >
                <div className="flex items-center gap-1">
                  District
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("area_name")}
              >
                <div className="flex items-center gap-1">
                  Area
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 w-48 text-right"
                onClick={() => handleSort("visit_charge")}
              >
                <div className="flex items-center justify-end gap-1">
                  Visit Charge
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row) => (
              <TableRow key={row.area_id}>
                <TableCell className="font-medium text-gray-900">{row.division_name}</TableCell>
                <TableCell className="text-gray-600">{row.district_name}</TableCell>
                <TableCell className="text-gray-600">{row.area_name}</TableCell>
                <TableCell className="text-right">
                  {editingAreaId === row.area_id ? (
                    <div className="flex items-center justify-end gap-2">
                       <Input 
                        type="number"
                        className="w-24 h-8 text-right"
                        value={editChargeValue}
                        onChange={(e) => setEditChargeValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCharge(row.area_id)}
                       />
                       <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleSaveCharge(row.area_id)}
                        disabled={isUpdating}
                       >
                         <Check className="h-4 w-4" />
                       </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 group">
                      <span className="font-semibold text-gray-900">৳{row.visit_charge}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingAreaId(row.area_id);
                          setEditChargeValue(row.visit_charge.toString());
                        }}
                      >
                        <Edit2 className="h-3 w-3 text-gray-400" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredAndSortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center">
                  {mapData.length === 0 ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
                        <Database className="h-8 w-8 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">No map data yet</p>
                        <p className="text-sm text-gray-500 mt-1">Populate from the pre-loaded dataset to get started</p>
                      </div>
                      <Button
                        onClick={handlePopulate}
                        disabled={isPopulating}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {isPopulating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Populating...
                          </>
                        ) : (
                          <>
                            <Database className="h-4 w-4 mr-2" />
                            Populate Map Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500">No results match your search.</p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add District Modal */}
      <Dialog open={isAddingDistrict} onOpenChange={setIsAddingDistrict}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New District</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={newDistDivisionId} onValueChange={setNewDistDivisionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>District Name</Label>
              <Input 
                placeholder="e.g. Dhaka" 
                value={newDistName} 
                onChange={(e) => setNewDistName(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingDistrict(false)}>Cancel</Button>
            <Button 
              onClick={handleAddDistrict} 
              disabled={isSubmitting || !newDistDivisionId || !newDistName}
              className="bg-[var(--brand-primary)] text-white hover:opacity-90"
            >
              Add District
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Area Modal */}
      <Dialog open={isAddingArea} onOpenChange={setIsAddingArea}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Division</Label>
              <Select 
                value={newAreaDivisionId} 
                onValueChange={(val) => {
                  setNewAreaDivisionId(val);
                  setNewAreaDistId(""); // reset district
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>District</Label>
              <Select 
                value={newAreaDistId} 
                onValueChange={setNewAreaDistId}
                disabled={!newAreaDivisionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts
                    .filter((d) => d.division_id === newAreaDivisionId)
                    .map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Area Name</Label>
              <Input 
                placeholder="e.g. Gulshan" 
                value={newAreaName} 
                onChange={(e) => setNewAreaName(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Visit Charge (৳)</Label>
              <Input 
                type="number"
                placeholder="0.00" 
                value={newAreaCharge} 
                onChange={(e) => setNewAreaCharge(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingArea(false)}>Cancel</Button>
            <Button 
              onClick={handleAddArea} 
              disabled={isSubmitting || !newAreaDistId || !newAreaName || !newAreaCharge}
              className="bg-[var(--brand-primary)] text-white hover:opacity-90"
            >
              Add Area
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
