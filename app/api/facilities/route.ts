export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import type { CareLevel, Facility } from '@/lib/types'

// Haversine — returns distance in miles
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(miles: number): string {
  if (miles < 0.1) return 'Nearby'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

const SEARCH_CONFIG: Partial<Record<CareLevel, { keyword: string; type: string }>> = {
  emergency: { keyword: 'emergency room hospital', type: 'hospital' },
  er:         { keyword: 'emergency room hospital', type: 'hospital' },
  urgent_care: { keyword: 'urgent care', type: 'health' },
  primary_care: { keyword: 'primary care doctor', type: 'doctor' },
}

export async function POST(req: NextRequest) {
  try {
    const { careLevel, lat, lng }: { careLevel: CareLevel; lat: number; lng: number } = await req.json()

    const config = SEARCH_CONFIG[careLevel]
    if (!config || !lat || !lng) {
      return NextResponse.json({ facilities: [] })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ facilities: getMockFacilities(careLevel), sample: true, reason: 'no_key' })
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', '16000') // ~10 miles
    url.searchParams.set('keyword', config.keyword)
    url.searchParams.set('type', config.type)
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    const data = await res.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message ?? '')
      // sample:true lets the UI label mock data honestly; reason surfaces the
      // Google status (e.g. REQUEST_DENIED = Places API not enabled/billing).
      return NextResponse.json({ facilities: getMockFacilities(careLevel), sample: true, reason: data.status })
    }

    const withCoords = (data.results ?? [])
      .slice(0, 8)
      .map((place: any) => {
        const miles = distanceMiles(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
        return {
          name: place.name,
          address: place.vicinity,
          rating: place.rating ?? undefined,
          openNow: place.opening_hours?.open_now ?? undefined,
          distance: formatDistance(miles),
          placeId: place.place_id,
          mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          _miles: miles,
          _lat: place.geometry.location.lat,
          _lng: place.geometry.location.lng,
        }
      })
      .sort((a: any, b: any) => a._miles - b._miles)
      .slice(0, 5)

    const facilities: Facility[] = withCoords.map(({ _miles: _m, _lat: _a, _lng: _b, ...f }: any) => f)

    // Static map image (Maps Static API) — renders inside our CSP (img-src
    // https: is allowed; no external scripts). Numbered teal markers match
    // the list; blue dot = the user. Key must have "Maps Static API" enabled;
    // restrict it by HTTP referrer in Google Cloud since the URL is public.
    const mapUrl = withCoords.length
      ? 'https://maps.googleapis.com/maps/api/staticmap?size=640x320&scale=2&maptype=roadmap' +
        `&markers=size:mid%7Ccolor:0x2563eb%7C${lat},${lng}` +
        withCoords.map((f: any, i: number) => `&markers=color:0x0e7490%7Clabel:${i + 1}%7C${f._lat},${f._lng}`).join('') +
        `&key=${apiKey}`
      : null

    return NextResponse.json({ facilities, mapUrl })
  } catch (err) {
    console.error('Facilities API error:', err)
    return NextResponse.json({ facilities: [] })
  }
}

function getMockFacilities(careLevel: CareLevel): Facility[] {
  if (careLevel === 'emergency' || careLevel === 'er') {
    return [
      { name: 'City General Hospital — ER', address: '123 Main St', rating: 4.1, openNow: true, distance: '0.8 mi', placeId: 'mock1', mapsUrl: 'https://maps.google.com' },
      { name: 'Metro Medical Center — ER', address: '456 Oak Ave', rating: 3.9, openNow: true, distance: '1.4 mi', placeId: 'mock2', mapsUrl: 'https://maps.google.com' },
    ]
  }
  return [
    { name: 'FastCare Urgent Care', address: '789 Elm St', rating: 4.5, openNow: true, distance: '0.5 mi', placeId: 'mock3', mapsUrl: 'https://maps.google.com' },
    { name: 'NextCare Urgent Care', address: '321 Pine Rd', rating: 4.3, openNow: true, distance: '1.1 mi', placeId: 'mock4', mapsUrl: 'https://maps.google.com' },
    { name: 'CityMD Urgent Care', address: '654 Maple Dr', rating: 4.6, openNow: false, distance: '1.8 mi', placeId: 'mock5', mapsUrl: 'https://maps.google.com' },
  ]
}
