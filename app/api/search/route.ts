import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)

  const country = searchParams.get('country')
  const industry = searchParams.get('industry')
  const capability = searchParams.get('capability')

  const { data, error } = await supabase
    .from('suppliers')
.select(`
  id,
  name,
  abn,
  website,
      countries:country_id ( name, code ),
      supplier_auto_tags (
        capabilities ( name ),
        industries ( name )
      )
    `)
    .eq('countries.code', country)
    .eq('supplier_auto_tags.capabilities.name', capability)
    .eq('supplier_auto_tags.industries.name', industry)

  if (error) {
    console.error(error)
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ suppliers: data })
}