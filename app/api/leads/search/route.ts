import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ leads: [] });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .select('id, name, cid, phone_numbers, address, source, status')
    .or(`name.ilike.%${q}%,cid.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ leads: [] }, { status: 500 });
  }

  const leads = (data || []).map((lead: any) => ({
    id: lead.id,
    name: lead.name,
    cid: lead.cid,
    phone: Array.isArray(lead.phone_numbers) ? lead.phone_numbers[0]?.number || '' : '',
    address: lead.address || '',
    source: lead.source || '',
    status: lead.status || '',
  }));

  return NextResponse.json({ leads });
}
