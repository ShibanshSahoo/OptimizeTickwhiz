import React from "react";
import ClientTicketListing from "../../../components/TicketListing/ClientTicketListing";

// =================================================================
// 1. DATA STRUCTURES (UPDATED FOR DEBUGGING)
// =================================================================

interface EventDetail {
  event_id: string;
  event_name: string;
  event_location: string;
  event_city: string;
  event_state: string;
  event_timing: string; // "2025-11-21T18:30:00"
  event_venue: string;
  location_point?: {
    lat: number;
    lon: number;
  };
  site_name?: string[];
}
interface Ticket {
  price: string;
  section_level: string;
  row: string;
  available_tickets: string;
  site_name: string;
  all_in_price: string;
  ticket_link: string;
}

interface TicketResponse {
  count: number;
  tickets: Ticket[];
}

interface SeoContent {
  heading1: string;
  contain_1: string;
  heading2: string;
  contain_2: string;
}

interface AiInfoResponse {
  event_name: string;
  seo_content: SeoContent;
}

interface GrowthBookFeatures {
  [key: string]: any;
}

// New structure to hold debug information for a single API call
interface ApiDebugInfo {
  name: string;
  url: string;
  status: number;
  summary: string;
  data: any;
}

interface ListingPageData {
  eventDetail: EventDetail;
  ticketData: TicketResponse;
  aiInfo: AiInfoResponse;
  // growthBookFeatures: GrowthBookFeatures;
  apiDebug: ApiDebugInfo[]; // New array for all API debug details
}

// =================================================================
// 2. UPDATED DATA FETCHING LOGIC (WITH API DEBUG INFO COLLECTION)
// =================================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL_SC || "http://localhost:3000/api";
const GROWTHBOOK_URL =
  "https://growthbookproxy.tn-apis.com/api/features/sdk-Vfa0ibSrg2mq4Q6";
const IS_LOCAL_DEBUG = false;

// Helper type to return data and debug info from parallel fetches
type FetchResult<T> = Promise<{ data: T; debug: ApiDebugInfo }>;

async function getTicketListingData(
  eventId: string,
  seats: string | number,
  searchId: string
): Promise<ListingPageData> {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL environment variable is not set."
    );
  }

  const apiDebug: ApiDebugInfo[] = [];

  // --- A. Fetch Event Detail first (SEQUENTIAL) ---
  const eventDetailUrl = `${API_BASE_URL}/event_name_return?event_id=${eventId}`;
  // console.log(`📡 API 1 Called: ${eventDetailUrl}`);
  const eventDetailResponse = await fetch(eventDetailUrl, {
    next: { revalidate: 3600 },
  });

  if (!eventDetailResponse.ok) {
    const errorText = await eventDetailResponse.text();
    console.error(
      `🚨 API 1 FAILED (Status: ${eventDetailResponse.status}): ${eventDetailUrl}`
    );
    throw new Error(
      `Failed to fetch event details (Status: ${eventDetailResponse.status}).`
    );
  }

  const rawApi1Response = await eventDetailResponse.json();
  const eventDetail: EventDetail =
    rawApi1Response.event || rawApi1Response.data || rawApi1Response;

  if (!eventDetail.event_name) {
    // console.error("🚨 API 1 returned data but event_name is missing. Raw response logged to server console.");
    // console.log(JSON.stringify(rawApi1Response, null, 2));
    throw new Error("Event details could not be parsed from API response.");
  }

  // console.log("✅ API 1 Success: Event Details fetched for:", eventDetail.event_name);

  apiDebug.push({
    name: "API 1: Event Details",
    url: eventDetailUrl,
    status: eventDetailResponse.status,
    summary: `Event: ${eventDetail.event_name}`,
    data: eventDetail,
  });

  // --- B. Prepare Concurrent Fetches (PARALLEL) ---
  const eventName = eventDetail.event_name;
  const eventVenue = eventDetail.event_venue || "";
  const eventTiming = eventDetail.event_timing || "";

  const ticketUrl = `${API_BASE_URL}/real-time-test/?seats=${seats}&event_id=${eventId}&page=1&limit=100&starting_price=0`;
  const aiInfoUrl = `${API_BASE_URL}/ai_eventinfo/?event_name=${encodeURIComponent(
    eventName
  )}&venue=${encodeURIComponent(eventVenue)}&datetime=${encodeURIComponent(
    eventTiming
  )}`;

  // console.log(`📡 API 2 Called: ${ticketUrl}`);
  // console.log(`📡 API 3 Called: ${aiInfoUrl}`);
  // console.log(`📡 API 4 Called: ${GROWTHBOOK_URL}`);

  const fetchTicketData = async (): FetchResult<TicketResponse> => {
    const res = await fetch(ticketUrl, { next: { revalidate: 15 } });
    if (!res.ok) {
      console.error(`🚨 API 2 FAILED (Status: ${res.status})`);
      throw new Error(
        `API 2 /real-time-test failed with status ${res.status}.`
      );
    }
    const data = await res.json();
    // console.log(`✅ API 2 Success: Ticket data fetched. Count: ${data.count}`);
    return {
      data: data as TicketResponse,
      debug: {
        name: "API 2: Real-Time Tickets",
        url: ticketUrl,
        status: res.status,
        summary: `Ticket Count: ${data.count}`,
        data,
      },
    };
  };

  const fetchAiInfo = async (): FetchResult<AiInfoResponse> => {
    const res = await fetch(aiInfoUrl, { next: { revalidate: 24 * 3600 } });
    if (!res.ok) {
      console.error(`🚨 API 3 FAILED (Status: ${res.status})`);
      throw new Error(`API 3 /ai_eventinfo failed with status ${res.status}.`);
    }
    const data = await res.json();
    // console.log(`✅ API 3 Success: AI Info fetched.`);
    return {
      data: data as AiInfoResponse,
      debug: {
        name: "API 3: AI Event Info",
        url: aiInfoUrl,
        status: res.status,
        summary: "AI data fetched successfully.",
        data,
      },
    };
  };

  // const fetchGrowthBook = async (): FetchResult<GrowthBookFeatures> => {
  //     const res = await fetch(GROWTHBOOK_URL, { next: { revalidate: 3600 } });
  //     if (!res.ok) {
  //         console.error(`🚨 API 4 FAILED (Status: ${res.status})`);
  //         throw new Error(`API 4 GrowthBook failed with status ${res.status}.`);
  //     }
  //     const data = await res.json();
  //     return {
  //         data: data as GrowthBookFeatures,
  //         debug: {
  //             name: "API 4: GrowthBook Features",
  //             url: GROWTHBOOK_URL,
  //             status: res.status,
  //             summary: "Features fetched successfully.",
  //             data
  //         }
  //     };
  // };

  const [res2, res3] = await Promise.all([
    fetchTicketData(),
    fetchAiInfo(),
    // fetchGrowthBook()
  ]);

  // Collect parallel debug info
  apiDebug.push(res2.debug, res3.debug);

  return {
    eventDetail,
    ticketData: res2.data,
    aiInfo: res3.data,
    // growthBookFeatures: res4.data,
    apiDebug,
  };
}

async function streamData<T>(
  name: string,
  url: string,
  options: RequestInit = {}
): Promise<{ data: T; debug: any }> {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return {
      data: (data.event || data.data || data) as T,
      debug: {
        name,
        url,
        status: res.status,
        summary: `Fetched in ${Date.now() - start}ms`,
        data,
      },
    };
  } catch (err: any) {
    return {
      data: null as any,
      debug: {
        name,
        url,
        status: 500,
        summary: `Error: ${err.message}`,
        data: null,
      },
    };
  }
}

// =================================================================
// 3. SERVER COMPONENT (WITH RENDER DEBUGGING)
// =================================================================
export default async function TicketListingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: {
    event_id?: string;
    seats?: string;
    debug?: string;
  };
}) {
  const { event_id, seats: raw_seats, debug } = await searchParams;

  const final_seats = raw_seats || "0";
  const isDebugMode = debug === "true" || IS_LOCAL_DEBUG;

  if (!event_id) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Missing event identifier in the URL.
      </div>
    );
  }

  const eventPromise = streamData<any>(
    "API 1: Event Details",
    `${API_BASE_URL}/event_name_return?event_id=${event_id}`,
    { next: { revalidate: 3600 } }
  );
  const ticketPromise = streamData<any>(
    "API 2: Real-Time Tickets",
    `${API_BASE_URL}/real-time-test/?seats=${final_seats}&event_id=${event_id}&page=1&limit=100`,
    { cache: "no-store" }
  );
  // const gbPromise = streamData<any>("API 4: GrowthBook Features", GROWTHBOOK_URL, { next: { revalidate: 3600 } });

  const aiPromise = eventPromise.then(async (res) => {
    if (!res.data)
      return { data: null, debug: { name: "API 3", summary: "Skipped" } };
    const url = `${API_BASE_URL}/ai_eventinfo/?event_name=${encodeURIComponent(
      res.data.event_name
    )}&venue=${encodeURIComponent(
      res.data.event_venue || ""
    )}&datetime=${encodeURIComponent(res.data.event_timing || "")}`;
    return streamData<any>("API 3: AI Event Info", url, {
      next: { revalidate: 86400 },
    });
  });

  // const listingData = await getTicketListingData(event_id, final_seats, '');

  // const eventPromise = Promise.resolve({
  //     data: listingData.eventDetail,
  //     debug: listingData.apiDebug[0]
  // });

  // const ticketPromise = Promise.resolve({
  //     data: listingData.ticketData,
  //     debug: listingData.apiDebug[1]
  // });

  // const aiPromise = Promise.resolve({
  //     data: listingData.aiInfo,
  //     debug: listingData.apiDebug[2]
  // });

  return (
    <ClientTicketListing
      eventPromise={eventPromise}
      ticketPromise={ticketPromise}
      aiPromise={aiPromise}
      // growthBookFeaturesPromise={gbPromise}
      initialSeats={final_seats}
      isDebugMode={isDebugMode}
    />
  );
}
