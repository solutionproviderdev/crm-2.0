"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Building2, Save, Palette, Globe } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { 
  getSiteSettings, 
  updateSiteSettings,
  uploadSettingFile
} from "@/app/actions/settings";
import { ImageUpload } from "@/components/settings/ImageUpload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/lib/types";

export default function CompanySettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const result = await getSiteSettings();
      if (result.success) {
        setSettings(result.data);
      } else {
        toast.error("Failed to load settings");
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  if (user?.type !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <div className="p-4 rounded-full bg-red-50 text-red-500">
          <Building2 className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Only administrators can access and modify company-wide branding settings.
        </p>
      </div>
    );
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#046288]" />
      </div>
    );
  }

  const handleUpdateSettings = async () => {
    setIsSaving(true);
    const result = await updateSiteSettings({
      company_name: settings.company_name,
      primary_color: settings.primary_color,
      secondary_color: settings.secondary_color,
    });
    setIsSaving(false);

    if (result.success) {
      setSettings(result.data);
      toast.success("Company settings updated");
    } else {
      toast.error(result.error);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const path = `branding/logo_${Date.now()}.${file.name.split('.').pop()}`;
    const uploadResult = await uploadSettingFile(path, formData);

    if (uploadResult.success) {
      const updateResult = await updateSiteSettings({
        brand_logo_url: uploadResult.data
      });
      if (updateResult.success) {
        setSettings(updateResult.data);
        toast.success("Brand logo updated");
      } else {
        toast.error(updateResult.error);
      }
    } else {
      toast.error(uploadResult.error);
    }
  };

  const colorPresets = [
    { name: "EaseIT Blue", primary: "#046288", secondary: "#034e6d" },
    { name: "Modern Emerald", primary: "#059669", secondary: "#065f46" },
    { name: "Deep Indigo", primary: "#4f46e5", secondary: "#3730a3" },
    { name: "Royal Purple", primary: "#7c3aed", secondary: "#5b21b6" },
    { name: "Sleek Slate", primary: "#334155", secondary: "#1e293b" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ───────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#046288]/10 text-[#046288]">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Company Branding</h2>
        </div>
        <p className="text-sm text-gray-500 ml-10">Configure your global CRM appearance and assets.</p>
      </div>

      {/* ── Brand Assets ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 ml-10">
        <div className="space-y-8">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Company Name</label>
                <Input
                    value={settings.company_name}
                    onChange={(e) => setSettings(s => s ? ({ ...s, company_name: e.target.value }) : null)}
                    className="rounded-2xl h-12 border-gray-100 focus:ring-[#046288]/20 focus:border-[#046288] text-sm font-bold transition-all"
                />
            </div>

            <ImageUpload
                label="Brand Logo"
                value={settings.brand_logo_url}
                aspectRatio="3/1"
                onChange={handleLogoUpload}
            />

            <Button 
                onClick={handleUpdateSettings}
                disabled={isSaving}
                className="w-full h-12 rounded-2xl bg-[#046288] hover:bg-[#034e6d] text-white font-bold shadow-lg shadow-[#046288]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                Save Branding
            </Button>
        </div>

        {/* ── Colors ───────────────────────────────── */}
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <Palette className="h-4 w-4 text-[#046288]" />
                    <h3 className="font-bold text-sm tracking-tight">Brand Colors</h3>
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Primary & Secondary accents</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 text-center block">Primary</label>
                    <div className="relative">
                        <Input
                            type="color"
                            value={settings.primary_color}
                            onChange={(e) => setSettings(s => s ? ({ ...s, primary_color: e.target.value }) : null)}
                            className="h-16 w-full rounded-2xl p-1 cursor-pointer border-gray-100 border-2"
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase text-white drop-shadow-md">{settings.primary_color}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 text-center block">Secondary</label>
                    <div className="relative">
                        <Input
                            type="color"
                            value={settings.secondary_color}
                            onChange={(e) => setSettings(s => s ? ({ ...s, secondary_color: e.target.value }) : null)}
                            className="h-16 w-full rounded-2xl p-1 cursor-pointer border-gray-100 border-2"
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase text-white drop-shadow-md">{settings.secondary_color}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 text-center">Quick Presets</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {colorPresets.map(p => (
                        <button
                            key={p.name}
                            onClick={() => setSettings(s => s ? ({ ...s, primary_color: p.primary, secondary_color: p.secondary }) : null)}
                            className="group flex flex-col items-center gap-1.5 focus:outline-none"
                            title={p.name}
                        >
                            <div className="flex h-10 w-10 overflow-hidden rounded-xl ring-1 ring-gray-100 group-hover:ring-[#046288]/20 transition-all group-hover:shadow-md group-hover:scale-105">
                                <div style={{ backgroundColor: p.primary }} className="flex-1" />
                                <div style={{ backgroundColor: p.secondary }} className="flex-1" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
      
      {/* ── Preview ──────────────────────────────── */}
      <div className="ml-10 pt-10 border-t border-gray-100 space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 text-[#046288]" />
          <h3 className="font-bold text-sm tracking-tight text-gray-400 uppercase tracking-widest">Live Preview</h3>
        </div>
        
        <div className="p-1 rounded-3xl bg-gray-100/50 border border-gray-100">
            <div className="bg-white rounded-[20px] shadow-sm overflow-hidden flex flex-col h-40">
                <div style={{ backgroundColor: settings.primary_color }} className="h-10 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {settings.brand_logo_url ? (
                            <img src={settings.brand_logo_url} className="h-4 w-auto brightness-0 invert" alt="Logo" />
                        ) : (
                            <div className="w-4 h-4 rounded bg-white/20" />
                        )}
                        <span className="text-[10px] font-black text-white">{settings.company_name}</span>
                    </div>
                </div>
                <div className="flex-1 p-4 space-y-2">
                    <div className="h-2 w-24 bg-gray-100 rounded" />
                    <div className="h-2 w-16 bg-gray-50 rounded" />
                    <div style={{ backgroundColor: settings.secondary_color }} className="h-6 w-20 rounded-lg mt-4" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
