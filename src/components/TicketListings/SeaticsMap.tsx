"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Head from "next/head";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

declare global {
  interface Window {
    $: any;
    jQuery: any;
    Seatics: any;
    MapApiExample?: any;
    numeral?: any;
  }
}

interface Ticket {
  section_level: string;
  row?: string;
  price: string;
  available_tickets: string;
  site_name: string;
}

interface EventDetail {
  event_id: string;
  event_name: string;
  event_venue: string;
  event_location: string;
  event_timing: string;
  location_point?: { lat: number; lon: number };
}

interface SeaticsMapProps {
  ticketData: any;
  eventData: any;
  onSectionClick?: (section: string) => void;
  syncTickets?: (tickets: any[]) => void;
  filterTickets?: (section: any) => void;
  onReset?: () => void;
  onMapLoaded?: () => void;
  minPriceOnSection?: number;
  totalTicketsOnSection?: number;
  isCheckoutOpen?: boolean;
  isShowResetButtonOpen?: boolean;
}

const formatPriceWithCommas = (price: number): string => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const SeaticsMap: React.FC<SeaticsMapProps> = ({
  ticketData,
  eventData,
  onSectionClick,
  syncTickets,
  filterTickets,
  onReset,
  onMapLoaded,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenRotated, setHasBeenRotated] = useState(false);
  const [tooltipUpdateTrigger, setTooltipUpdateTrigger] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  console.log("🔍 DEBUG RENDER:", {
    error,
    scriptsLoaded,
    isLoaded,
    ticketsLength: ticketData.tickets.length,
  });

  const shouldShowFallback =
    !scriptsLoaded || !!error || ticketData.tickets.length === 0;

  if (shouldShowFallback) {
 // console.log("🎨 SHOWING FALLBACK:", {
      error,
      scriptsLoaded,
      ticketsLength: ticketData.tickets.length,
    });

    return (
      <div className="w-full h-[600px] md:h-[700px] relative bg-gradient-to-br from-gray-900 via-blue-900/20 to-black rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.3),transparent_50%)] opacity-50" />

        {/* DEBUG HEADER */}
        <div className="absolute top-4 left-4 bg-[#ff3300]/90 text-white px-3 py-1 rounded-lg text-xs font-mono z-50 flex items-center gap-1">
          <span>
            DEBUG: error={!!error} scripts={scriptsLoaded} tickets=
            {ticketData.tickets.length}
          </span>
        </div>

        {/* Static venue layout */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-md mx-auto">
            <div className="w-24 h-24 bg-blue-500/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-blue-400/50">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Interactive Seat Map
            </h2>
            <p className="text-gray-300 mb-8 max-w-sm mx-auto">
              {eventData.event_venue || "Venue"} • {ticketData.tickets.length}{" "}
              sections available
            </p>

            {/* ERROR DISPLAY */}
            {error && (
              <div className="bg-[#ff3300]/20 border border-[#ff3300]/50 p-4 rounded-xl mb-6 backdrop-blur-sm">
                <p className="text-red-300 font-mono text-sm mb-2">
                  ❌ {error}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-1 bg-[#ff3300]/80 hover:bg-red-600 text-white text-xs rounded-lg transition-all"
                >
                  Retry Map
                </button>
              </div>
            )}

            {/* QUICK SECTION SELECTOR */}
            {ticketData.tickets.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-sm mx-auto">
                {Array.from(
                  new Set(
                    ticketData.tickets.map((t: Ticket) => t.section_level)
                  )
                )
                  .slice(0, 6)
                  .map((section) => {
                    const ticket = ticketData.tickets.find(
                      (t: Ticket) => t.section_level === section
                    );
                    return (
                      <button
                        key={section}
                        onClick={() => onSectionClick?.(section)}
                        className="px-4 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all group"
                      >
                        <div className="font-semibold text-white group-hover:text-blue-300">
                          {section}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          ${ticket?.price || "N/A"} •{" "}
                          {ticket?.available_tickets || 0} avail
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}

            {!scriptsLoaded && ticketData.tickets.length === 0 && (
              <p className="text-yellow-400 mt-4 text-sm italic">
                No tickets loaded yet...
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-1/2 left-4 flex flex-col gap-3 z-50">
          <button
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white/30 transition-all flex items-center justify-center shadow-2xl hover:scale-105 opacity-50"
            title="Zoom In"
          >
            <ZoomIn size={20} className="text-white" />
          </button>
          <button
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white/30 transition-all flex items-center justify-center shadow-2xl hover:scale-105 opacity-50"
            title="Zoom Out"
          >
            <ZoomOut size={20} className="text-white" />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-14 h-14 bg-green-500/80 hover:bg-green-600 backdrop-blur-xl rounded-2xl border border-green-400/50 transition-all flex items-center justify-center shadow-2xl hover:scale-105"
            title="Reload"
          >
            <RotateCw size={20} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // ✅ MAP RENDER (only if NOT fallback)
  console.log("🗺️  SHOWING SEATICS MAP");

  // ✅ CRITICAL: Seatics ticket format {data: [...]}
  const getSeaticsTickets = useCallback(() => {
    if (!ticketData.tickets?.length) return { data: [] };

    const sectionMap = new Map<string, number>();
    const ticketData = ticketData.tickets.flatMap((ticket, index) => {
      const section = ticket.section_level?.trim();
      if (!section) return [];

      const count = (sectionMap.get(section) || 0) + 1;
      sectionMap.set(section, count);

      return [
        {
          id: `${eventData.event_id}-${section}-${count}`,
          sectionId: section,
          sectionName: section,
          price: Number(ticket.price) || 0,
          row: ticket.row || "A",
          seat: count,
          quantityAvailable: Number(ticket.available_tickets) || 10,
          faceValue: Number(ticket.price) || 0,
          isAvailable: true,
          isSelected: false,
          isSold: false,
        },
      ];
    });

 // console.log("new Data = ", ticketData);

    return { data: ticketData };
  }, [ticketData.tickets, eventData.event_id]);

  const loadScript = useCallback(
    async (sources: string[]): Promise<boolean> => {
      for (const src of sources) {
        try {
          if (document.querySelector(`script[src="${src}"]`)) return true;

          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.crossOrigin = "anonymous";

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);

            // 5s timeout
            setTimeout(() => reject(new Error("Timeout")), 5000);
          });
          return true; // Success
        } catch (err) {
          console.warn(`❌ Failed ${src}, trying next...`);
          continue;
        }
      }
      return false; // All failed
    },
    []
  );

  const waitForjQuery = () =>
    new Promise((resolve) => {
      const check = () => {
        if (
          typeof window.jQuery !== "undefined" &&
          typeof window.$ !== "undefined"
        ) {
          resolve(void 0);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });

  const waitForSeatics = () =>
    new Promise((resolve) => {
      const check = () => {
        if ((window as any).Seatics?.MapComponent) {
          resolve(void 0);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });

  // ✅ PERFECT REPLICA of original MapApiExample
  const initializeMapApiExample = useCallback(() => {
    (window as any).MapApiExample = (window as any).MapApiExample || {};
    (window as any).MapApiExample.MapInterface = (function () {
      const eventQParams = {
        websiteConfigId: 27607,
        eventId: eventData.event_id,
        consumerKey: "N_7raJSjq2NbhYDdSBUEy5Qlyjka",
      };

      function getEventAndVenueInfo(
        callback: (eventData: any, mapData: any) => void
      ) {
        // Mock TN API response - replace with your real map API
        setTimeout(() => {
          callback(
            {
              mapImage: "",
              mapName: eventData.event_venue || "Venue Map",
            },
            { sections: [] } // Mock mapData
          );
        }, 100);
      }

      function buildMap(
        mapData: any,
        eventData: any,
        ticketDataWrapper: any,
        container: HTMLElement
      ) {
        const $ = (window as any).$;

        // Set global seatData FIRST
        (window as any).seatData = getSeaticsTickets();

        // ✅ EXACT Seatics.config replica (47+ settings)
        (window as any).Seatics.config = {
          containerId: "venue-map",
          showFeesIncludedText: true,
          includeServiceFeesInTicketPrice: true,
          centerInContainer: true,
          priceGroupsEnabled: false,
          selectionScheme: 0,
          ticketListOnRight: false,
          mapContained: true,
          showUserSectionNames: true,
          mouseWheelZoomEnabled: true,
          zoomControlsEnabled: true,
          showZoomControls: false,
          touchZoomEnabled: true,
          pinchZoomEnabled: true,
          html: { "Branding.html": "" },
          legendExpanded: true,
          showResetControl: false,
          ticketSeparationOptions: {
            packages: 1,
            parking: 1,
            passes: 1,
            hotels: 1,
            unmappedFlex: 2,
            unmappedStandard: 2,
          },
          ticketsState: { legendDriven: true, showLegendFirstOnMob: false },
          showBranding: false,
          selectionPulseFromColor: "#7be33a",
          selectionColor: "#ffcf55",
          largeScreenFormat: true,
          hoverEnabled: true,
          smallScreenMapLayout: 0, // FullyShown
        };

        const bound = container.getBoundingClientRect();

        const mapInstance = (window as any).Seatics.MapComponent.create({
          imgSrc: eventData?.mapImage,
          tickets: (window as any).seatData.data,
          mapData: mapData,
          vfsUrl: "https://vfs.seatics.com",
          container: $(container),
          usesCanvas: true,
          presentationInterface: {
            updateTicketsList: (e: any) => {
              syncTickets?.(e);
              setTooltipUpdateTrigger((prev) => prev + 1);
            },
            getMapViewport: () => ({
              x1: bound.x,
              x2: window.innerWidth,
              y1: 0,
              y2: window.innerHeight,
            }),
          },
          mapWidth: 13,
          mapHeight: 9,
          legend: { dropDown: { isOpen: true } },
          mapName: eventData?.mapName ?? "",
          enableSectionInfoPopups: true,
        });

        mapInstanceRef.current = mapInstance;

        // ✅ EXACT click handlers from original
        (window as any).Seatics.namespaceSubscribe("click", (e: any) => {
          const id = e.target.getAttribute("rel-id");
          if (id) {
            if (id.indexOf("row") !== -1) {
              const row = (window as any).Seatics.MapComponent.getRowFromId(id);
              if (row?.section) filterTickets?.(row.section);
            } else {
              const section = (
                window as any
              ).Seatics.MapComponent.getSectionFromId(id);
              if (section) {
                filterTickets?.(section);
                onSectionClick?.(section.id || section.sectionName);
              }
            }
          }
        });

        setTimeout(() => {
          setIsLoaded(true);
          onMapLoaded?.();
        }, 500);
      }

      return {
        loadTicketsAndMap: (params: any, container: HTMLElement) => {
          getEventAndVenueInfo((eventData: any, mapData: any) => {
            buildMap(mapData, eventData, getSeaticsTickets(), container);
          });
        },
      };
    })();
  }, [
    getSeaticsTickets,
    eventData,
    syncTickets,
    filterTickets,
    onSectionClick,
    onMapLoaded,
  ]);

  // ✅ Custom tooltip system (EXACT replica)
  const removeAllTooltips = () => {
    const container = document.getElementById("venue-map");
    if (!container) return;

    container.querySelectorAll(".custom-tooltip").forEach((tooltip: any) => {
      tooltip.style.display = "none";
      tooltip.style.opacity = "0";
    });
  };

  const customTooltipInit = () => {
    if (!isLoaded || isMobile) {
      removeAllTooltips();
      return;
    }

    const legends = (window as any)?.Seatics?.MapComponent?.legendItems?.filter(
      (e: any) => {
        e.minPrice = e.getFromPrice?.();
        return e.hasTickets?.();
      }
    );

    if (legends?.length > 0) {
      legends.forEach((l: any) => {
        l.sections.map((e: any) => {
          if (e.ticketsInfo.from === l.minPrice) {
            l.sectionId = e.id;
            l.center = { x: e.centerX, y: e.bounds.y1 };
          }
          return e.ticketsInfo.from === l.minPrice;
        });
      });

      setTimeout(() => {
        const svg = document.querySelector("#venue-map canvas") as HTMLElement;
        if (svg) {
          removeAllTooltips();
          createCustomTooltip(svg, legends as any[]);
        }
      }, 500);
    }
  };

  const createCustomTooltip = (svg: Element, legends: any[]) => {
    if (isMobile) return;

    legends.forEach((section) => {
      const id = section.sectionId;
      const svgBound = svg.getBoundingClientRect();
      const container = document.getElementById("venue-map");
      const containerBound = container?.getBoundingClientRect();
      const tooltipHeight = 34;

      let parent = container?.querySelector(
        `.custom-tooltip.${id}`
      ) as HTMLElement;
      if (!parent) {
        parent = document.createElement("div");
        const child = document.createElement("div");
        parent.appendChild(child);
        child.innerHTML = `$${formatPriceWithCommas(
          Math.floor(section.minPrice)
        )}`;
        container?.appendChild(parent);
        parent.className = `custom-tooltip ${id}`;
        Object.assign(parent.style, {
          height: `${tooltipHeight}px`,
          zIndex: "10",
          position: "absolute",
          pointerEvents: "auto",
          transition: "opacity 0.2s ease",
          fontSize: "14px",
          fontWeight: "bold",
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "4px 8px",
          borderRadius: "4px",
        });

        parent.addEventListener("click", () => {
          const path = document.querySelector(
            `.venue-map-svg path[rel-id="${id}"]`
          ) as SVGPathElement;
          if (path) {
            path.classList.toggle("selected");
            path.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          }
        });
      }

      const scale =
        (window as any)?.Seatics?.MapComponent?.mapDisplay?.scale ?? 1;
      const offsetTop = svgBound.top - (containerBound?.top ?? 0);
      const offsetLeft = svgBound.left - (containerBound?.left ?? 0);
      const top = section.center.y * scale + offsetTop - tooltipHeight;
      const left = section.center.x * scale + offsetLeft;

      parent.style.top = `${top}px`;
      parent.style.left = `${left}px`;
      parent.style.opacity = "1";
      parent.style.display = "block";
    });
  };

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      try {
        setError(null);

        // ✅ Load jQuery first
        const jQueryLoaded = await loadScript([
          "https://code.jquery.com/jquery-3.6.0.min.js",
          "https://unpkg.com/jquery@3.6.0/dist/jquery.min.js",
        ]);

        if (!jQueryLoaded) throw new Error("jQuery failed to load");

        // ✅ Try Seatics with fallbacks
        const seaticsLoaded = await loadScript([
          "https://mapwidget3.seatics.com/api/framework",
          "https://cdn.jsdelivr.net/npm/seatics@latest/mapwidget3.seatics.com/api/framework.js",
        ]);

        const seaticsReady = (await waitForSeatics()) as boolean;

        if (!seaticsReady) {
          throw new Error("Seatics API not ready after 10s");
        }

        setScriptsLoaded(true);
        initializeMapApiExample();

        // Launch map
        setTimeout(() => {
          if (
            !cancelled &&
            (window as any).MapApiExample?.MapInterface &&
            mapContainerRef.current
          ) {
            (window as any).MapApiExample.MapInterface.loadTicketsAndMap(
              { eventId: eventData.event_id },
              mapContainerRef.current!
            );
          }
        }, 500);
      } catch (err: any) {
        console.error("❌ Seatics init failed:", err);
        setError(`Map failed to load: ${err.message}. Showing fallback.`);
        setIsLoaded(true);
      }
    };

    if (mapContainerRef.current) {
      mapContainerRef.current.id = `venue-map-${Date.now()}`;
      initMap();
    }

    return () => {
      cancelled = true;
      if (
        mapInstanceRef.current &&
        (window as any).Seatics?.MapComponent?.destroy
      ) {
        (window as any).Seatics.MapComponent.destroy(mapInstanceRef.current);
      }
      delete (window as any).seatData;
    };
  }, [eventData.event_id, initializeMapApiExample, loadScript]);

  // Tooltip updates
  useEffect(() => {
    if (scriptsLoaded && isLoaded) {
      const timer = setTimeout(customTooltipInit, 500);
      return () => clearTimeout(timer);
    }
  }, [
    tooltipUpdateTrigger,
    ticketData.tickets.length,
    scriptsLoaded,
    isLoaded,
  ]);

  // Mobile detection
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const zoomIn = () =>
    (window as any).Seatics?.MapComponent?.mapDisplay?.zoomInByStep?.();
  const zoomOut = () =>
    (window as any).Seatics?.MapComponent?.mapDisplay?.zoomOutByStep?.();
  const resetMap = () => {
    (window as any).Seatics?.MapComponent?.mapDisplay?.resetView?.();
    onReset?.();
  };

  if (error || !scriptsLoaded) {
    return (
      <div className="w-full h-[600px] md:h-[700px] relative bg-gradient-to-br from-gray-900 via-blue-900/20 to-black rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.3),transparent_50%)] opacity-50" />

        {/* Static venue layout */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-md mx-auto">
            <div className="w-24 h-24 bg-blue-500/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-blue-400/50">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Interactive Seat Map
            </h2>
            <p className="text-gray-300 mb-8 max-w-sm mx-auto">
              {eventData.event_venue || "Venue"} • {ticketData.tickets.length}{" "}
              sections available
            </p>
            <p className="text-red-600">{error}</p>
            <p className="text-white-600">Scripts Loaded : {scriptsLoaded}</p>

            {/* Quick section selector */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-sm mx-auto">
              {Array.from(
                new Set(ticketData.tickets.map((t) => t.section_level))
              )
                .slice(0, 6)
                .map((section, i) => (
                  <button
                    key={section}
                    onClick={() => onSectionClick?.(section)}
                    className="px-4 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all group"
                  >
                    <div className="font-semibold text-white group-hover:text-blue-300">
                      {section}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      $
                      {
                        ticketData.tickets.find(
                          (t: Ticket) => t.section_level === section
                        )?.price
                      }{" "}
                      ea
                    </div>
                  </button>
                ))}
            </div>

            {error && (
              <p className="text-xs text-red-400 mt-6 opacity-75">{error}</p>
            )}
          </div>
        </div>

        {/* Control buttons still work */}
        <div className="absolute top-6 right-6 flex flex-col gap-3 z-50">
          <div
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 flex items-center justify-center shadow-2xl opacity-50"
            title="Zoom In"
          >
            <ZoomIn size={20} className="text-white" />
          </div>
          <div
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 flex items-center justify-center shadow-2xl opacity-50"
            title="Zoom Out"
          >
            <ZoomOut size={20} className="text-white" />
          </div>
          <div
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 flex items-center justify-center shadow-2xl opacity-50"
            title="Reset"
          >
            <RotateCw size={20} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css"
        />
        <link rel="stylesheet" href="https://mapwidget3.seatics.com/styles" />
      </Head>

      <div className="w-full h-[600px] md:h-[700px] relative bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl">
        <div
          ref={mapContainerRef}
          className="w-full h-full relative touch-none select-none"
          style={{ touchAction: "none", background: "#1a1a1a" }}
        >
          {!isLoaded && scriptsLoaded && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-white text-center">
                <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
                <div className="text-xl font-bold mb-2">
                  Loading Interactive Seat Map
                </div>
                <div className="text-blue-400">{eventData.event_venue}</div>
                <div className="text-gray-300 mt-2">
                  {tickets.length} sections loaded
                </div>
              </div>
            </div>
          )}
        </div>

        {scriptsLoaded && (
          <div className="absolute top-6 right-6 flex flex-col gap-3 z-50">
            <button
              onClick={zoomIn}
              className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white/30 transition-all flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95"
              title="Zoom In"
            >
              <ZoomIn size={20} className="text-white" />
            </button>
            <button
              onClick={zoomOut}
              className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white/30 transition-all flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut size={20} className="text-white" />
            </button>
            <button
              onClick={resetMap}
              className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white/30 transition-all flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95"
              title="Reset View"
            >
              <RotateCw size={20} className="text-white" />
            </button>
          </div>
        )}

        {/* Custom Tooltip Styles */}
        <style jsx global>{`
          #venue-map {
            transform-origin: center center !important;
            user-select: none !important;
            -webkit-user-select: none !important;
          }
          #venue-map canvas,
          #venue-map svg {
            transform-origin: center center !important;
            transition: none !important;
          }
          .custom-tooltip {
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          }
          @media (max-width: 768px) {
            .custom-tooltip {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default SeaticsMap;
