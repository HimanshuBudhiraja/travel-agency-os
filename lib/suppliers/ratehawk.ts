// RateHawk Hotel Inventory Adapter

const RATEHAWK_BASE = "https://api.worldota.net/api/b2b/v3";

interface HotelSearchParams {
  destination: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  adults: number;
  children?: number[];
  currency?: string;
}

export interface HotelResult {
  id: string;
  name: string;
  stars: number;
  rating: number;
  address: string;
  imageUrl?: string;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  amenities: string[];
  supplierRef: string;
}

export async function searchHotels(params: HotelSearchParams): Promise<HotelResult[]> {
  const { destination, checkIn, checkOut, adults, children = [], currency = "USD" } = params;

  const nights =
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24);

  if (!process.env.RATEHAWK_KEY_ID || !process.env.RATEHAWK_API_KEY) {
    return getMockHotels(destination, nights, currency);
  }

  const auth = Buffer.from(
    `${process.env.RATEHAWK_KEY_ID}:${process.env.RATEHAWK_API_KEY}`
  ).toString("base64");

  const res = await fetch(`${RATEHAWK_BASE}/search/serp/region/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkin: checkIn,
      checkout: checkOut,
      residency: "en",
      language: "en",
      guests: [{ adults, children }],
      region_id: destination,
      currency,
    }),
  });

  if (!res.ok) {
    console.error("RateHawk API error:", await res.text());
    return getMockHotels(destination, nights, currency);
  }

  const data = await res.json();
  return mapRateHawkResponse(data, nights, currency);
}

function mapRateHawkResponse(data: any, nights: number, currency: string): HotelResult[] {
  if (!data?.data?.hotels) return [];
  return data.data.hotels.slice(0, 10).map((h: any) => ({
    id: h.id,
    name: h.name,
    stars: h.star_rating || 0,
    rating: h.rates?.[0]?.review_score || 0,
    address: h.address || "",
    imageUrl: h.images?.[0],
    pricePerNight: Math.round((h.rates?.[0]?.daily_prices?.[0] || 0)),
    totalPrice: Math.round((h.rates?.[0]?.payment_options?.payment_types?.[0]?.amount || 0)),
    currency,
    amenities: h.amenity_groups?.flatMap((g: any) => g.amenities || []).slice(0, 8) || [],
    supplierRef: h.id,
  }));
}

function getMockHotels(destination: string, nights: number, currency: string): HotelResult[] {
  const mockHotels = [
    { name: `Grand Palace Hotel ${destination}`, stars: 5, rating: 9.2, basePrice: 280 },
    { name: `Boutique Retreat ${destination}`, stars: 4, rating: 8.7, basePrice: 160 },
    { name: `City Center Inn ${destination}`, stars: 3, rating: 7.9, basePrice: 90 },
  ];

  return mockHotels.map((h, i) => ({
    id: `mock-${i + 1}`,
    name: h.name,
    stars: h.stars,
    rating: h.rating,
    address: `Central ${destination}`,
    imageUrl: undefined,
    pricePerNight: h.basePrice,
    totalPrice: h.basePrice * nights,
    currency,
    amenities: ["WiFi", "Breakfast", "Pool", "Gym", "Spa"].slice(0, h.stars - 1),
    supplierRef: `MOCK-${i + 1}`,
  }));
}
