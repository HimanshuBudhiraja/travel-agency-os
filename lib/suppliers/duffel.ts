// Duffel Flights Adapter

const DUFFEL_BASE = "https://api.duffel.com";

interface FlightSearchParams {
  origin: string;      // IATA code e.g. "LHR"
  destination: string; // IATA code e.g. "DXB"
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  adults: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}

export interface FlightResult {
  id: string;
  airline: string;
  airlineCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  cabinClass: string;
  supplierRef: string;
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightResult[]> {
  if (!process.env.DUFFEL_API_KEY) {
    return getMockFlights(params);
  }

  const slices = [
    { origin: params.origin, destination: params.destination, departure_date: params.departureDate },
  ];
  if (params.returnDate) {
    slices.push({ origin: params.destination, destination: params.origin, departure_date: params.returnDate });
  }

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
    },
    body: JSON.stringify({
      data: {
        slices,
        passengers: Array(params.adults).fill({ type: "adult" }),
        cabin_class: params.cabinClass || "economy",
      },
    }),
  });

  if (!res.ok) {
    console.error("Duffel API error:", await res.text());
    return getMockFlights(params);
  }

  const data = await res.json();
  return mapDuffelOffers(data.data?.offers || []);
}

function mapDuffelOffers(offers: any[]): FlightResult[] {
  return offers.slice(0, 5).map((offer: any) => {
    const slice = offer.slices[0];
    const segment = slice.segments[0];
    return {
      id: offer.id,
      airline: segment.marketing_carrier.name,
      airlineCode: segment.marketing_carrier.iata_code,
      departureTime: segment.departing_at,
      arrivalTime: slice.segments[slice.segments.length - 1].arriving_at,
      duration: slice.duration,
      stops: slice.segments.length - 1,
      price: parseFloat(offer.total_amount),
      currency: offer.total_currency,
      cabinClass: offer.cabin_class,
      supplierRef: offer.id,
    };
  });
}

function getMockFlights(params: FlightSearchParams): FlightResult[] {
  return [
    {
      id: "mock-flight-1",
      airline: "Emirates",
      airlineCode: "EK",
      departureTime: `${params.departureDate}T08:00:00`,
      arrivalTime: `${params.departureDate}T14:30:00`,
      duration: "PT6H30M",
      stops: 0,
      price: 850,
      currency: "USD",
      cabinClass: params.cabinClass || "economy",
      supplierRef: "MOCK-EK-001",
    },
    {
      id: "mock-flight-2",
      airline: "Qatar Airways",
      airlineCode: "QR",
      departureTime: `${params.departureDate}T11:00:00`,
      arrivalTime: `${params.departureDate}T19:15:00`,
      duration: "PT8H15M",
      stops: 1,
      price: 690,
      currency: "USD",
      cabinClass: params.cabinClass || "economy",
      supplierRef: "MOCK-QR-001",
    },
  ];
}
