"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  use,
  Suspense,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
// import SeaticsMap from "./SeaticsMap";
import CustomSeatMapCard from "@/components/CustomMapCard";
import styledEmotion from "@emotion/styled";
import { transformTicketDataForSeatics } from "@/lib/functions/_helpers.lib";

import { TicketFilterModal } from "./TicketFilterModal";
import { useTicketStore } from "@/store/ticketStore";
import { useIsDesktop } from "@/hooks/useMediaQuery";
// import TicketList from "./TicketList";
import MobileDrawer from "./MobileDrawer";
import dynamic from "next/dynamic";
import { CheckIcon } from "lucide-react";
import { StreamingHeader } from "./TicketList";

const TicketList = dynamic(() => import("./TicketList"), {
  loading: () => (
    <div className="p-4 h-96 bg-gray-100 animate-pulse rounded-xl" />
  ),
});

function StreamingMapArea({
  eventPromise,
  ticketPromise,
  filterTickets,
  syncTickets,
  onReset,
  checkoutOpen,
  showResetMapButton,
  setShowResetMapButton,
  isDesktop,
}: any) {
  const { data: eventData } = use(eventPromise);
  const { data: ticketData } = use(ticketPromise);

  const { minPriceOnSection, totalTicketsOnSection } = useMemo(() => {
    const rawTickets = ticketData?.tickets || [];
    const prices = rawTickets.map((t: any) => parseFloat(t.all_in_price || 0));
    return {
      minPriceOnSection: prices.length > 0 ? Math.min(...prices) : 0,
      totalTicketsOnSection: rawTickets.length,
    };
  }, [ticketData]);

  return (
    <ResponsiveMapContainer
      className="map-container"
      style={{
        display: !isDesktop && checkoutOpen ? "none" : "block",
      }}
    >
      <CustomSeatMapCard
        minPriceOnSection={minPriceOnSection}
        totalTicketsOnSection={totalTicketsOnSection}
        ticketData={ticketData.ticketnetwork_map_tickets as any}
        eventId={eventData.event_id as string}
        syncTickets={syncTickets}
        filterTickets={filterTickets}
        onReset={onReset}
        isCheckoutOpen={checkoutOpen}
        isShowResetButtonOpen={showResetMapButton}
        setShowResetMapButton={setShowResetMapButton}
      />
    </ResponsiveMapContainer>
  );
}

interface EventDetail {
  event_id: string;
  event_venue: string;
  event_name?: string;
  event_location: string;
  event_timing: string;
  location_point?: { lat: number; lon: number };
}
interface Ticket {
  price: string;
  section_level: string;
  row: string;
  available_tickets: string;
  site_name: string;
  all_in_price: string;
  ticket_link: string;
  service_charge?: string;
  ticket_id?: string;
  ticket_together?: string;
  ticket_uuid?: string;
  image?: string;
  rating?: string;
  review?: string;
  seat_splits?: string[];
  text_all?: string;
}

interface SelectedTicketData {
  ticket_id: string;
  section_level: string;
  row: string;
  price: string;
  all_in_price: string;
  service_charge: string;
  site_name: string;
  ticket_link: string;
  available_tickets: string;
  ticket_together: string;
  seat_splits: string[];
  site_event_id: string;
  ticket_uuid: string;
  image?: string;
  rating?: string;
  review?: string;
  text_all?: string;
}

interface AiInfoResponse {} // Placeholder type
interface GrowthBookFeatures {} // Placeholder type
interface ApiDebugInfo {}

// Props match your API response structure
interface Props {
  eventPromise: EventDetail;
  ticketPromise: any;
  aiPromise: AiInfoResponse;
  // growthBookFeaturesPromise: GrowthBookFeatures;
  // apiDebug: ApiDebugInfo[];
  initialSeats: string;
}

function TicketDataProcessor({
  ticketPromise,
  allMapTickets,
}: {
  ticketPromise: any;
  allMapTickets: any[];
}) {
  const { data: ticketData } = use(ticketPromise);

  const transformedData = useMemo(() => {
    const rawTickets = ticketData?.ticketnetwork_map_tickets || [];
    return transformTicketDataForSeatics(rawTickets);
  }, [ticketData?.ticketnetwork_map_tickets]);

  // MERGED TICKETS (Feeds to store - NO filtering here!)
  const mergedTickets = useMemo(() => {
    const rawTickets = ticketData?.ticketnetwork_map_tickets || [];
    const transformedRegistry = new Map(
      transformedData.map((t: any) => [String(t.tgID), t])
    );
    const mapRegistry = new Map(
      allMapTickets.map((t: any) => [String(t.tgID), t])
    );

    return rawTickets.map((raw: any) => {
      const id = String(raw.ticket_uuid || raw.ticket_id);
      const transformed = transformedRegistry.get(id);
      const mapTicket = mapRegistry.get(id);

      return {
        ...raw,
        ...transformed,
        tgID: id,
        tgColor: mapTicket?.tgColor ?? null,
        sectionName:
          mapTicket?.sectionName ?? raw.section_level ?? transformed?.tgUserSec,
        section: mapTicket?.section
          ? {
              id: mapTicket.section.id,
              name: mapTicket.section.name,
              canonicalName: mapTicket.section.canonicalName,
              centerX: mapTicket.section.centerX,
              centerY: mapTicket.section.centerY,
              code: mapTicket.section.code,
              level: mapTicket.section.level?.name
                ? {
                    id: mapTicket.section.level.id,
                    name: mapTicket.section.level.name,
                    color: mapTicket.section.level.color,
                  }
                : null,
            }
          : null,
        ticket_section_id:
          mapTicket?.ticket_section_id || mapTicket?.section?.id || "",
        all_in_price: Number(
          raw.all_in_price || transformed?.tgAllInPrice || 0
        ),
        seat_splits: raw.seat_splits || transformed?.seat_splits || [],
      };
    });
  }, [ticketData?.ticketnetwork_map_tickets, transformedData, allMapTickets]);

  // useEffect(
  //   () => console.log("raw tickets = ", mergedTickets, filteredTickets),
  //   [mergedTickets]
  // );

  useEffect(() => {
    useTicketStore.getState().setMergedTickets(mergedTickets);
    if (mergedTickets.length > 0) {
      useTicketStore.getState().getFilterStats();
    }
  }, [mergedTickets]);

  return null;
}

export default function ClientTicketListing({
  // eventData,
  // ticketData,
  // aiInfo,
  // growthBookFeatures,
  // apiDebug,
  // initialSeats,
  eventPromise,
  ticketPromise,
  aiPromise,
  // growthBookFeaturesPromise,
  initialSeats,
}: Props) {
  // const { data: eventData } = use(eventPromise);
  // const { data: ticketData } = use(ticketPromise);
  // const { data: aiInfoData } = use(aiPromise);
  // const { data: gbFeaturesData } = use(growthBookFeaturesPromise);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const isDesktop = useIsDesktop();

  const [showResetMapButton, setShowResetMapButton] = useState(false);
  const [allMapTickets, setAllMapTickets] = useState<Array<any>>([]);
  const [pageLoadePopup, setPageLoadPopup] = useState(true);
  // const [highlightedSection, SetHighLightedSection] = useState<Array<string>>(
  //   []
  // );
  const venueLevelResetRef = useRef<(() => void) | null>(null);
  const [mapPosition, setMapPosition] = useState<{
    zoom: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const {
    isFilterOpen,
    setIsFilterOpen,
    filteredTickets,
    appliedFilters,
    setAppliedFilters,
    toggleVenueLevel,
    setActiveFilterSection,
    resetFilters,
  } = useTicketStore();

  const handleBack = () => {
    setSelectedTicket(null);
    // const currentQuery = window.location.search;
    // router.replace(`${pathname}${currentQuery}`, { scroll: false });
    handleGoBackFromCheckout();
    if (contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = listScrollPos.current;
        }
      });
    }
  };

  // useEffect(() => console.log("filter = ", filteredTickets));

  // SYNC Venue Levels (populates options)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const syncVenueLevels = () => {
      const legend = window.Seatics?.MapComponent?.legendItems;
      if (!legend?.length) return;

      const levels = legend
        .map((l: any) => l.name || l.canonicalName)
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);

      useTicketStore.getState().setFilterOptions({
        venueLevels: levels,
        priceBounds: useTicketStore.getState().priceBounds,
      });
    };

    // syncVenueLevels();
    interval = setInterval(syncVenueLevels, 3000);
    return () => clearInterval(interval);
  }, []);

  const showToolTip = (section: any) => {
    if (!section || !window?.Seatics) return;
    const zone = section.zones && section.zones[0];
    window.Seatics.Tooltip.showTooltip(
      section,
      section.centerX,
      section.centerY,
      zone ?? undefined,
      window.Seatics.Tooltip.popupRecapType.both,
      true, // showVfs
      false, // hideEnlargeIcon
      true // forceShow
    );
    if (window.Seatics.MapComponent.mapDisplay.container && isDesktop) {
      window.Seatics.MapComponent.mapDisplay.container[0].style.pointerEvents =
        "none";
    }
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const listScrollPos = useRef(0);

  const updateSectionInfo = (sections: any = {}) => {
    const arr = Object.keys(sections);
    for (let index = 0; index < arr.length; index++) {
      const key = arr[index];
      if (key) {
        const element = sections[key];
        if (element.hasTickets) {
          element.ticketsInfo.count = element.tickets.length;
        }
      }
    }
  };

  const onReset = () => {
    // SetHighLightedSection([]);
    window?.Seatics?.MapComponent?.reset();
    if (venueLevelResetRef.current) {
      venueLevelResetRef.current();
    }

    setAppliedFilters({ venueLevels: [] });

    setShowResetMapButton(false);
    // resetRotation();
  };

  const onReset_TicketList = () => {
    // SetHighLightedSection([]);
    window?.Seatics?.MapComponent?.reset();
    if (venueLevelResetRef.current) {
      venueLevelResetRef.current();
    }

    setShowResetMapButton(false);
    // resetRotation();
  };

  const filterTickets = useCallback(
    (e: any) => {
      if (!e) return;

      if (e.clearAll) {
        setAppliedFilters({ venueLevels: [] });
        return;
      }

      const section =
        e.canonicalName || e.sectionName || e.name || e.userSectionName;
      if (!section) return;

      // We check Seatics 'selected' property to stay in sync with the map's visual state
      if (e.selected !== undefined) {
        const current = useTicketStore.getState().appliedFilters.venueLevels;
        if (e.selected && !current.includes(section)) {
          setAppliedFilters({ venueLevels: [...current, section] });
        } else if (!e.selected && current.includes(section)) {
          setAppliedFilters({
            venueLevels: current.filter((s) => s !== section),
          });
        }
      } else {
        toggleVenueLevel(section);
      }
    },
    [setAppliedFilters, toggleVenueLevel]
  );

  const syncTickets = (e: any) => {
    if (!e || e.length === 0) return;

    let activeTickets = e[0].tickets || [];

    activeTickets = activeTickets.map((ticket: any) => ({
      ...ticket,
      section: ticket.section,
      ticket_section_id: ticket.section?.id || "",
    }));

    // console.log("activeTickets", activeTickets);

    // console.log("Enriched Map Data Received:", {
    //   count: activeTickets.length,
    //   firstTicket: activeTickets[0],
    //   colorFound: activeTickets[0]?.tgColor
    // });
    // console.log("SEATICS TICKETS:", {
    //   hasSectionId: !!activeTickets[0]?.section?.id,
    //   hasTicketSectionId: !!activeTickets[0]?.ticket_section_id,
    //   firstTicketKeys: Object.keys(activeTickets[0] || {}),
    //   sample: activeTickets[0],
    // });

    if (
      window.Seatics.MapComponent.getNumLegendItemsSelected() ||
      window.Seatics.MapComponent.anySelectionsInView()
    ) {
      setShowResetMapButton(true);
    } else {
      setShowResetMapButton(false);
    }

    // This state now holds objects that HAVE .tgColor
    setAllMapTickets(activeTickets);

    // Optional: Update section info for tooltips/header
    if (window.Seatics?.TicketConnector?.SectionsByName) {
      updateSectionInfo(window.Seatics.TicketConnector.SectionsByName);
    }
  };

  // Add function to save current map position
  const saveCurrentMapPosition = useCallback(() => {
    if (window?.Seatics?.MapComponent?.mapDisplay) {
      const mapDisplay = window.Seatics.MapComponent.mapDisplay;
      const currentPosition = {
        zoom: mapDisplay.zoom || 1,
        centerX: mapDisplay.centerX || 0,
        centerY: mapDisplay.centerY || 0,
      };
      setMapPosition(currentPosition);
    }
  }, []);

  const showToolTipForVenueLevel = (section: any) => {
    if (!section || !window?.Seatics) return;
    const zone = section.zones && section.zones[0];
    window.Seatics.Tooltip.showTooltip(
      section,
      section.centerX,
      section.centerY,
      zone ?? undefined
    );
  };

  const handleVenueHover = useCallback(
    (venue: Record<string, any>, isHovering: boolean) => {
      if (isHovering) {
        const sectionsWithMinPrice = venue.sections.filter(
          (section: any) => section.ticketsInfo && section.ticketsInfo.from
        );
        const minPriceSection = sectionsWithMinPrice.find(
          (section: any) => section.ticketsInfo.from === venue.minPrice
        );
        const svg = document.querySelector(`.venue-map-svg ~.venue-map-svg`);

        sectionsWithMinPrice.forEach((section: any) => {
          const path = document.querySelector(
            `.venue-map-svg path[rel-id="${section.id}"]`
          );
          if (path) {
            path.classList.add("selected");
            console.log("minPriceSection = ", minPriceSection);
            showToolTipForVenueLevel(minPriceSection);
          } else {
            section.mapObjects.forEach((item: any) => {
              const pathPoint = item.canvasablePath.PathParser.tokens
                .toString()
                .replaceAll(",", " ");
              const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              path.setAttribute("d", pathPoint);
              path.setAttribute("fill", "transparent");
              path.setAttribute("opacity", "0");
              path.setAttribute("rel-id", section.id);
              path.classList.add("selected", "temp-generated");
              svg && svg.appendChild(path);
            });
          }
        });
      } else {
        venue.sections.forEach((section: any) => {
          const path = document.querySelector(
            `.venue-map-svg path[rel-id="${section.id}"]`
          );
          if (path) {
            path.classList.remove("selected");
            window.Seatics.Tooltip.hideTooltip();
          } else {
            section.rows.forEach((e: any) => {
              const path = document.querySelector(
                `.venue-map-svg path[rel-id="${e.id}"]`
              );
              if (path) {
                path.classList.remove("selected");
                window.Seatics.Tooltip.hideTooltip();
              }
            });
          }
        });
      }
    },
    []
  );

  //This function zooms in into the specific area of the map when a specific ticket is clicked.
  const hightLightMapShape = useCallback(
    (item: Ticket) => {
      if (window?.Seatics?.MapComponent?.getTgFromId) {
        saveCurrentMapPosition();

        window.Seatics.MapComponent.removeHighlight();
        window.Seatics.Tooltip.hideTooltip();

        const ticketId = item.tgID || item.ticket_uuid;

        // Get the fresh ticket object from Seatics (with section references)
        const ticket = window.Seatics.MapComponent.getTgFromId(ticketId);

        if (ticket && ticket.section) {
          const { section } = ticket;

          if (section.centerX !== undefined && section.centerY !== undefined) {
            window.Seatics.MapComponent.mapDisplay.animateToZoomAndCenterPosition(
              2,
              section.centerX,
              section.centerY
            );
            // handleTicketHover(ticket, true);
            const path = document.querySelector(
              `.venue-map-svg path[rel-id="${section.id}"]`
            );
            const svg = document.querySelector(
              `.venue-map-svg ~.venue-map-svg`
            );
            if (path) {
              path.classList.add("selected");
            } else {
              section.mapObjects.forEach((item: any) => {
                const pathPoint = item.canvasablePath.PathParser.tokens
                  .toString()
                  .replaceAll(",", " ");
                const path = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "path"
                );
                path.setAttribute("d", pathPoint);
                path.setAttribute("fill", "transparent");
                path.setAttribute("opacity", "0");
                path.setAttribute("rel-id", section.id);
                path.classList.add("selected", "temp-generated");
                svg && svg.appendChild(path);
              });
              // section.rows.forEach((e: any) => {
              //   const path = document.querySelector(`.venue-map-svg path[rel-id="${e.id}"]`);
              //   if (path) {
              //     path.classList.add('selected');
              //   }
              // });
            }

            // console.log('section.mapObjects: ', section.mapObjects);
            // section.mapObjects.map((e: any) => {
            //   e.strokeColor = 'blue';
            //   e.strokeWidth = '2px';
            //   section.draw();
            // });
            if (window.innerWidth > 500) {
              setTimeout(() => {
                showToolTip(section);
              }, 600);
            }
          } else {
            // console.warn('Section found but missing centerX or centerY properties:', section);
          }
        } else {
          // console.warn(
          //   'Ticket not found or section is null for item:',
          //   item._id ?? item.ticket_uuid
          // );
        }
      }
    },
    [showToolTip, saveCurrentMapPosition]
  );

  //This funciton handles the processes after user clicks on a ticket in the ticket scrollbar
  const hoverSelectTicket = (ticket: Ticket, isHovering: boolean) => {
    // console.log(ticket, isHovering);

    if (!window?.Seatics?.MapComponent?.getTgFromId) return;

    if (isHovering) {
      const mapTicket = window.Seatics.MapComponent.getTgFromId(ticket.tgID);
      // console.log(mapTicket);
      if (mapTicket) {
        showToolTip(mapTicket.section);
        window.Seatics.MapComponent.highlightTicket(mapTicket);
      }
    } else {
      window.Seatics.MapComponent.removeHighlight();
      window.Seatics.Tooltip.hideTooltip();
      if (window.Seatics.MapComponent.mapDisplay.container) {
        window.Seatics.MapComponent.mapDisplay.container[0].style.pointerEvents =
          "inherit";
      }
    }
  };

  // Add function to restore map position
  const restoreMapPosition = useCallback(() => {
    if (mapPosition && window?.Seatics?.MapComponent?.mapDisplay) {
      setTimeout(() => {
        // Clear any map selections before reset to prevent filtering issues
        // if (window.Seatics.MapComponent.getNumLegendItemsSelected()) {
        //   window.Seatics.MapComponent.legend.dropDown.deSelectAll();
        // }
        // window.Seatics.MapComponent.reset();
        if (window.Seatics.MapComponent.mapDisplay.container) {
          window.Seatics.MapComponent.mapDisplay.container[0].style.pointerEvents =
            "inherit";
        }

        const tempPath = document.querySelector(".selected.temp-generated");
        if (tempPath) {
          tempPath.classList.remove("selected");
        }
      }, 100);
    }
  }, [mapPosition]);

  //This function handle the ui processes once the user returns back from the checkout box
  const handleGoBackFromCheckout = useCallback(() => {
    // Clear any highlights and tooltips
    if (window?.Seatics?.MapComponent) {
      window.Seatics.MapComponent.removeHighlight();
      window.Seatics.Tooltip.hideTooltip();
    }
    if (window.Seatics.MapComponent.mapDisplay.container?.[0]) {
      window.Seatics.MapComponent.mapDisplay.container[0].style.pointerEvents =
        "inherit";
    }

    // isDesktop &&
    restoreMapPosition();

    window?.Seatics?.MapComponent?.mapDisplay?.updateSize();
  }, [mapPosition]);

  const handleSelectTicket = (ticket: Ticket) => {
    // console.log("clicked =", ticket);
    if (contentRef.current) {
      listScrollPos.current = contentRef.current.scrollTop;
    }
    hightLightMapShape(ticket);
    setSelectedTicket(ticket);

    // const currentQuery = window.location.search;
    // router.push(`${pathname}${currentQuery}#checkout`, { scroll: false });
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== "#checkout" && selectedTicket) {
        handleBack();
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [selectedTicket, handleBack]);

  useEffect(() => {
    if (selectedTicket && contentRef.current) {
      contentRef.current.scrollTop = 0;
    } else if (!selectedTicket && contentRef.current) {
      contentRef.current.scrollTop = listScrollPos.current;
    }
  }, [selectedTicket]);

  // useEffect(() => {
  //   const tId = searchParams.get("ticketId");
  //   if (tId && ticketData?.tickets) {
  //     const ticket = ticketData.tickets.find(
  //       (t: any) => t.tgID === tId || t.ticket_id === tId
  //     );
  //     if (ticket) {
  //       setSelectedTicket(ticket);
  //       hightLightMapShape(ticket);
  //     }
  //   }
  // }, [ticketData]);

  return (
    <div className="relative h-full w-full flex overflow-hidden bg-white dark:bg-black relative">
      <TicketDataProcessor
        ticketPromise={ticketPromise}
        allMapTickets={allMapTickets}
      />
      <main className="mapContainer absolute inset-0 md:pl-[540px] md:min-pl-[480px] ">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center animate-pulse text-gray-300 font-bold uppercase tracking-widest">
              Initialising Map...
            </div>
          }
        >
          <div className="block md:hidden">
            <StreamingHeader
              eventPromise={eventPromise}
              aiPromise={aiPromise}
              ticketPromise={ticketPromise}

              // ticket={filteredTickets}
              // setIsFilterOpen={setIsFilterOpen}
            />
          </div>
          <StreamingMapArea
            eventPromise={eventPromise}
            ticketPromise={ticketPromise}
            filterTickets={filterTickets}
            syncTickets={syncTickets}
            onReset={onReset}
            checkoutOpen={!!selectedTicket}
            showResetMapButton={showResetMapButton}
            setShowResetMapButton={setShowResetMapButton}
            isDesktop={isDesktop}
          />
        </Suspense>
      </main>
      <div className="hidden md:block absolute top-4 left-4 bottom-4 w-[520px] z-20">
        <div className="h-full rounded-2xl overflow-hidden glass-strong border shadow-lg">
          <Suspense
            fallback={<div className="p-4 text-white">Loading list...</div>}
          >
            <TicketList
              eventPromise={eventPromise}
              ticketPromise={ticketPromise}
              tickets={filteredTickets}
              aiPromise={aiPromise}
              selectedTicket={selectedTicket}
              onSelectTicket={handleSelectTicket}
              onVenueHover={handleVenueHover}
              onTicketHover={hoverSelectTicket}
              onBack={handleBack}
              setIsFilterOpen={setIsFilterOpen}
            />
          </Suspense>
        </div>
      </div>
      <div id="scrollable-ticket-list" className="listContainer md:hidden">
        <MobileDrawer checkoutMode={!!selectedTicket}>
          <Suspense fallback={<>Loading...</>}>
            <TicketList
              eventPromise={eventPromise}
              ticketPromise={ticketPromise}
              tickets={filteredTickets}
              aiPromise={aiPromise}
              selectedTicket={selectedTicket}
              onSelectTicket={handleSelectTicket}
              onTicketHover={hoverSelectTicket}
              onBack={handleBack}
              setIsFilterOpen={setIsFilterOpen}
            />
          </Suspense>
        </MobileDrawer>
      </div>

      {/* Global Modals */}
      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={() => {
          useTicketStore.getState().setActiveFilterSection(null);
        }}
      >
        {isFilterOpen && <TicketFilterModal onReset={onReset_TicketList} />}
      </AnimatePresence>

      {pageLoadePopup && (
        <div className="absolute z-[1000] w-full h-full top-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4">
          {/* Added max-w-[540px] and w-full so it shrinks on small screens */}
          <div className="w-full max-w-[540px] bg-white dark:bg-black p-6 md:p-[30px] space-y-6 flex items-center justify-between flex-col rounded-[20px] shadow-xl">
            <div className="Heading w-full flex items-center justify-start flex-col text-2xl md:text-4xl font-semibold text-brand gap-[10px] dark:text-white text-center">
              How Many Tickets?
              <p className="text-sm md:text-[14px] text-black/60 dark:text-white/60 font-medium">
                You'll be seated together.
              </p>
            </div>

            {/* Responsive Grid: 3 columns on small mobile, 4 columns on larger screens */}
            <div className="Seats grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4 w-full">
              {Array(12)
                .fill(0)
                .map((_, idx: number) => {
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setAppliedFilters({ seatSplit: idx + 1 });
                        setPageLoadPopup(false);
                      }}
                      className="IndvButton w-full h-[60px] md:h-[50px] border-[1px] border-gray-300 text-brand dark:text-white dark:border-white rounded-[12px] font-semibold text-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 active:bg-brand active:text-white hover:bg-brand hover:text-white"
                    >
                      {idx + 1}
                    </button>
                  );
                })}
            </div>

            <div className="Button w-full">
              <button
                onClick={() => {
                  setAppliedFilters({ seatSplit: null });
                  setPageLoadPopup(false);
                }}
                className="w-full text-base py-4 bg-brand text-white rounded-xl font-medium active:scale-[0.98] transition-transform"
              >
                Any
              </button>
            </div>

            <div className="flex flex-col gap-1 text-center bg-brand/10 w-full py-4 rounded-xl px-2">
              <p className="text-sm md:text-base font-medium text-brand leading-tight">
                All-In Prices! What you see is what you pay.
              </p>
              <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
                (Taxes &amp; delivery not included, where applicable)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ResponsiveMapContainer = styledEmotion.div`
  width: 100%;
  height: 100vh; /* Responsive height */
  min-height: 100%;
  max-height: 100%;
  position: relative;
  touch-action: none !important;
  overflow: hidden;

  @media (max-width: 1200px) {
    height: 69vh;
    min-height: 350px;
  }

  @media (max-width: 991px) {
    height: 60vh;
    min-height: 300px;
  }

  @media(max-width:767px){
    height: 50vh;
    min-height: 250px;
  }

  /* Ensure the Seatics map fills the container */
  & > div {
    width: 100% !important;
    height: 100% !important;
    touch-action: auto !important;
  }

  /* Enable zoom for map elements */
  #venue-map, .venue-map {
    touch-action: auto !important;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Ensure zoom controls are visible and functional */
  .sea-zoom-controls,
  .venue-map-controls,
  .sea-map-controls,
  .zoom-controls,
  .map-zoom-controls {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 9999 !important;
    touch-action: auto !important;
  }

  /* Mobile-specific zoom control styling */
  @media (max-width: 899px) {
    .sea-zoom-controls,
    .venue-map-controls,
    .sea-map-controls {
      position: absolute !important;
      bottom: 20px !important;
      right: 20px !important;
      z-index: 10000 !important;
    }
    
    .sea-zoom-controls button,
    .venue-map-controls button,
    .sea-map-controls button {
      min-width: 44px !important;
      min-height: 44px !important;
      font-size: 18px !important;
      background: rgba(255, 255, 255, 0.9) !important;
      border: 1px solid #ccc !important;
      border-radius: 4px !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
    }
  }
`;
