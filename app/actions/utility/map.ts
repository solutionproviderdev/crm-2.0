"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath, cacheLife, cacheTag, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { CACHE_TAGS } from "@/lib/cache-tags";

import fs from "fs/promises";
import path from "path";

export type FlattenedMapRow = {
  division_id: string;
  division_name: string;
  district_id: string;
  district_name: string;
  area_id: string;
  area_name: string;
  visit_charge: number;
};

export type Division = {
  id: string;
  name: string;
};

export type District = {
  id: string;
  division_id: string;
  name: string;
};

export type Area = {
  id: string;
  district_id: string;
  name: string;
  visit_charge: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Reads — cached with admin client (stateless, no cookies)
// Map data is very low-churn: divisions/districts/areas change only when an
// admin edits them via the map management UI.
// ─────────────────────────────────────────────────────────────────────────────

export async function getMapData(): Promise<FlattenedMapRow[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.MAP_DATA);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("areas")
    .select(`
      id,
      name,
      visit_charge,
      district_id,
      districts!inner (
        id,
        name,
        division_id,
        divisions!inner (
          id,
          name
        )
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching map data:", error);
    throw new Error("Failed to fetch map data");
  }

  return data.map((d: any) => {
    const district = Array.isArray(d.districts) ? d.districts[0] : d.districts;
    const division = Array.isArray(district.divisions) ? district.divisions[0] : district.divisions;

    return {
      area_id:       d.id,
      area_name:     d.name,
      visit_charge:  d.visit_charge,
      district_id:   district.id,
      district_name: district.name,
      division_id:   division.id,
      division_name: division.name,
    };
  });
}

export async function getDivisions(): Promise<Division[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.MAP_DATA);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("divisions")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching divisions:", error);
    throw new Error("Failed to fetch divisions");
  }

  return data as Division[];
}

export async function getDistrictsByDivision(divisionId: string): Promise<District[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.MAP_DATA);

  if (!divisionId) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("districts")
    .select("id, division_id, name")
    .eq("division_id", divisionId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching districts by division:", error);
    throw new Error("Failed to fetch districts");
  }

  return data as District[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations — invalidate MAP_DATA after every write
// ─────────────────────────────────────────────────────────────────────────────

export async function addDivision(name: string): Promise<Division> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("divisions")
    .insert([{ name }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  updateTag(CACHE_TAGS.MAP_DATA);
  revalidatePath("/utility/map");
  return data as Division;
}

export async function addDistrict(divisionId: string, name: string): Promise<District> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("districts")
    .insert([{ division_id: divisionId, name }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  updateTag(CACHE_TAGS.MAP_DATA);
  revalidatePath("/utility/map");
  return data as District;
}

export async function addArea(districtId: string, name: string, visitCharge: number): Promise<Area> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("areas")
    .insert([{ district_id: districtId, name, visit_charge: visitCharge }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  updateTag(CACHE_TAGS.MAP_DATA);
  revalidatePath("/utility/map");
  return data as Area;
}

export async function updateVisitCharge(areaId: string, visitCharge: number): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("areas")
    .update({ visit_charge: visitCharge })
    .eq("id", areaId);

  if (error) throw new Error(error.message);

  updateTag(CACHE_TAGS.MAP_DATA);
  revalidatePath("/utility/map");
  return true;
}

export async function populateMapDataFromJson() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    const filePath = path.join(process.cwd(), "data", "easeit.mapdatas.json");
    const fileData = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(fileData);

    let totalDivisions = 0;
    let totalDistricts = 0;
    let totalAreas = 0;

    for (const divInfo of json) {
      if (!divInfo.division) continue;

      let divId = "";
      const { data: existingDiv } = await supabase
        .from("divisions")
        .select("id")
        .eq("name", divInfo.division)
        .maybeSingle();

      if (existingDiv) {
        divId = existingDiv.id;
      } else {
        const { data: newDiv, error: divErr } = await supabase
          .from("divisions")
          .insert({ name: divInfo.division })
          .select("id")
          .single();
        if (divErr) {
          console.error("Division insert error:", divErr);
          continue;
        }
        divId = newDiv.id;
        totalDivisions++;
      }

      if (!divInfo.districts || !Array.isArray(divInfo.districts)) continue;

      for (const distInfo of divInfo.districts) {
        if (!distInfo.name) continue;

        let distId = "";
        const { data: existingDist } = await supabase
          .from("districts")
          .select("id")
          .eq("name", distInfo.name)
          .eq("division_id", divId)
          .maybeSingle();

        if (existingDist) {
          distId = existingDist.id;
        } else {
          const { data: newDist, error: distErr } = await supabase
            .from("districts")
            .insert({ name: distInfo.name, division_id: divId })
            .select("id")
            .single();
          if (distErr) {
            console.error("District insert error:", distErr);
            continue;
          }
          distId = newDist.id;
          totalDistricts++;
        }

        if (!distInfo.areas || !Array.isArray(distInfo.areas)) continue;

        const areasToInsert = [];
        for (const area of distInfo.areas) {
          areasToInsert.push({
            name: area.name,
            visit_charge: Number(area.visitCharge) || 0,
            district_id: distId,
          });
        }

        if (areasToInsert.length > 0) {
          const { data: existingAreas } = await supabase
            .from("areas")
            .select("name")
            .eq("district_id", distId);

          const existingNames = new Set(existingAreas?.map((a) => a.name) || []);
          const finalAreas = areasToInsert.filter((a) => !existingNames.has(a.name));

          if (finalAreas.length > 0) {
            const { error: areaErr } = await supabase.from("areas").insert(finalAreas);
            if (!areaErr) {
              totalAreas += finalAreas.length;
            } else {
              console.error("Area bulk insert error:", areaErr);
            }
          }
        }
      }
    }

    updateTag(CACHE_TAGS.MAP_DATA);
    revalidatePath("/utility/map");
    return {
      success: true,
      message: `Successfully populated ${totalDivisions} divisions, ${totalDistricts} districts, and ${totalAreas} areas.`,
    };
  } catch (error: unknown) {
    console.error("Error populating map data:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
