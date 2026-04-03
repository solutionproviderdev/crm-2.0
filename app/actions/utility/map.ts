"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import fs from 'fs/promises';
import path from 'path';

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
            district_id: distId
          });
        }

        if (areasToInsert.length > 0) {
          // Check existing areas to avoid duplicates in bulk insert
          const { data: existingAreas } = await supabase
            .from("areas")
            .select("name")
            .eq("district_id", distId);
          
          const existingNames = new Set(existingAreas?.map(a => a.name) || []);
          const finalAreas = areasToInsert.filter(a => !existingNames.has(a.name));

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

    revalidatePath("/utility/map");
    return { 
      success: true, 
      message: `Successfully populated ${totalDivisions} divisions, ${totalDistricts} districts, and ${totalAreas} areas.`
    };
  } catch (error: unknown) {
    console.error("Error populating map data:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

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

export async function getMapData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // To match the flattened requirement of the table, we'll do a join.
  // divisions -> districts -> areas
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

  // Flatten the payload
  const flattened: FlattenedMapRow[] = data.map((d: any) => {
    const district = Array.isArray(d.districts) ? d.districts[0] : d.districts;
    const division = Array.isArray(district.divisions) ? district.divisions[0] : district.divisions;

    return {
      area_id: d.id,
      area_name: d.name,
      visit_charge: d.visit_charge,
      district_id: district.id,
      district_name: district.name,
      division_id: division.id,
      division_name: division.name,
    };
  });

  return flattened;
}

export async function getDivisions() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
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

export async function getDistrictsByDivision(divisionId: string) {
  if (!divisionId) return [];
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
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

export async function addDivision(name: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("divisions")
    .insert([{ name }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/utility/map");
  return data as Division;
}

export async function addDistrict(divisionId: string, name: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("districts")
    .insert([{ division_id: divisionId, name }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/utility/map");
  return data as District;
}

export async function addArea(districtId: string, name: string, visitCharge: number) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("areas")
    .insert([{ district_id: districtId, name, visit_charge: visitCharge }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/utility/map");
  return data as Area;
}

export async function updateVisitCharge(areaId: string, visitCharge: number) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("areas")
    .update({ visit_charge: visitCharge })
    .eq("id", areaId);

  if (error) throw new Error(error.message);
  revalidatePath("/utility/map");
  return true;
}
