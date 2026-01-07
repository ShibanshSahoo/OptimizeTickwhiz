"use client";

import React, {
  useState,
  use,
  Suspense,
  useTransition,
  useEffect,
  useMemo,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, ShareIcon } from "@heroicons/react/20/solid";
import {
  MapPin,
  Calendar,
  Share2,
  RefreshCw,
  ChevronLeft,
  Sparkles,
  ArrowDownToLine,
  Star,
  Armchair,
  Zap,
  Crown,
  FilterIcon,
  ExternalLinkIcon,
  ShieldCheck,
  Info,
  CheckIcon,
  ChevronRightIcon,
  ArrowUpWideNarrowIcon,
  ArrowDownWideNarrowIcon,
  DollarSignIcon,
  ListOrderedIcon,
  MapIcon,
  ArmchairIcon,
  SlidersHorizontalIcon,
  ArrowUpDownIcon,
  MoveUpIcon,
  MoveDownIcon,
  PlusIcon,
  Funnel,
  RotateCcwIcon,
  SparklesIcon,
  InfoIcon,
  ArrowUpWideNarrow,
  Share,
} from "lucide-react";
import { BRAND_LOGOS } from "@/components/json/brandlogo";
import { Button } from "@/components/ui/button";
import { useTicketStore } from "@/store/ticketStore";
import { DrawerDragContext } from "./MobileDrawer";
import InfiniteScroll from "react-infinite-scroll-component";
import ClearFilterIcon from "@/components/ui/ClearFilterIcon";
import NumberFlow from "@number-flow/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrowserTheme } from "@/hooks/useBrowserTheme";

const formatScannedTime = (date: Date) => {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear().toString().slice(-2);
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const suffix = ["th", "st", "nd", "rd"][
    day % 10 > 3 ? 0 : (day % 100) - (day % 10) !== 10 ? day % 10 : 0
  ];
  return `Last Scanned at  ${month} ${day} 20${year}, ${time}`;
};

export default function TicketList({
  eventPromise,
  ticketPromise,
  tickets,
  aiPromise,
  selectedTicket,
  onSelectTicket,
  onTicketHover,
  onBack,
  onVenueHover,
  setIsFilterOpen,
  filters,
  onReset,
}: any) {
  // Animation variants
  // Animation variants
  const { data: event } = use(eventPromise);

  const theme = useBrowserTheme();

  const imagesData = [
    {
      img: "slider.png",
      src: "stubhub",
    },
    {
      img: "slider1.png",
      src: "TicketNetwork",
    },
    {
      img: theme == "light" ? "slider2.png" : "slider2_dark.png",
      src: "gametime",
    },
    {
      img: theme == "light" ? "slider4.png" : "slider4_Dark.png",
      src: "vividseats",
    },
    {
      img: theme == "light" ? "event365N.png" : "slider8.avif",
      src: "event365",
    },
    {
      img: theme == "light" ? "slider5_N.png" : "slider5_N_dark.png",
      src: "megaseats",
    },
    {
      img: "slider6.png",
      src: "seatgeek",
    },
  ];

  const {
    filteredTickets,
    appliedFilters,
    setAppliedFilters,
    getTicketCounts,
    computeWhizDeals,
    resetFilters,
  } = useTicketStore();

  const counts = getTicketCounts();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastScanned, setLastScanned] = useState(new Date());

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // const [localTickets, setLocalTickets] = useState([]);

  const [visibleCount, setVisibleCount] = useState(50);

  const dragProps = React.useContext(DrawerDragContext);
  const currentSort = appliedFilters.sortOrder;
  const isPriceActive = currentSort === "asc" || currentSort === "desc";
  const isRowActive = currentSort === "row_asc" || currentSort === "row_desc";

  // useEffect(() => {
  //   if (
  //     appliedFilters.quantity > 1 &&
  //     selectedQuantity != appliedFilters.quantity
  //   ) {
  //     setSelectedQuantity(appliedFilters.quantity);
  //   }
  // }, [appliedFilters.quantity]);

  useEffect(() => {
    if (selectedTicket) {
      const splits = selectedTicket.seat_splits
        ?.map(Number)
        .sort((a, b) => a - b) || [1];
      if (!splits.includes(selectedQuantity)) {
        setSelectedQuantity(splits[0]);
      }
    }
  }, [selectedTicket, selectedQuantity]);

  const getUpdatedUrlWithQuantity = (url: string, quantity: number): string => {
    try {
      const updatedUrl = new URL(url);

      if (updatedUrl.hostname.includes("stubhub.prf.hn")) {
        const pathParts = updatedUrl.pathname.split("/");
        const destinationIndex = pathParts.findIndex((part) =>
          part.startsWith("destination:")
        );

        if (destinationIndex !== -1) {
          const destinationPart = pathParts[destinationIndex];
          if (!destinationPart) return url;
          const destinationUrl = decodeURIComponent(
            destinationPart.replace("destination:", "")
          );
          const innerUrl = new URL(destinationUrl);

          innerUrl.searchParams.set("quantity", quantity.toString());

          const newDestinationPart =
            "destination:" + encodeURIComponent(innerUrl.toString());
          pathParts[destinationIndex] = newDestinationPart;
          updatedUrl.pathname = pathParts.join("/");

          return updatedUrl.toString();
        }
      }

      // Handle nested URL structure (for affiliate redirect URLs)
      if (
        (updatedUrl.hostname.includes("ticketnetwork.lusg.net") ||
          updatedUrl.hostname.includes("vivid-seats.pxf.io") ||
          updatedUrl.hostname.includes("vividseats.pxf.io") ||
          updatedUrl.hostname.includes("seatgeek.pxf.io") ||
          updatedUrl.hostname.includes("pxf.io") ||
          updatedUrl.hostname.includes("7eer.net") ||
          updatedUrl.hostname.includes("anrdoezrs.net") ||
          updatedUrl.hostname.includes("dpbolvw.net") ||
          updatedUrl.hostname.includes("kqzyfj.com") ||
          updatedUrl.hostname.includes("hnyj8s.net")) &&
        updatedUrl.searchParams.has("u")
      ) {
        const innerUrlString = updatedUrl.searchParams.get("u") || "";
        const innerUrl = new URL(decodeURIComponent(innerUrlString));

        if (innerUrl.hostname.includes("vividseats.com")) {
          innerUrl.searchParams.set("qty", quantity.toString());
        } else if (innerUrl.hostname.includes("gametime.co")) {
          innerUrl.searchParams.set("seat_count", quantity.toString());
        } else if (innerUrl.hostname.includes("seatgeek.com")) {
          innerUrl.searchParams.set("quantity", quantity.toString());
        } else {
          innerUrl.searchParams.set("quantity", quantity.toString());
        }

        updatedUrl.searchParams.set("u", innerUrl.toString());
        return updatedUrl.toString();
      }

      // Handle direct URLs
      if (updatedUrl.hostname.includes("tickpick.com")) {
        updatedUrl.searchParams.set("quantity", quantity.toString());
        return updatedUrl.toString();
      }

      if (updatedUrl.hostname.includes("vividseats.com")) {
        updatedUrl.searchParams.set("qty", quantity.toString());
        return updatedUrl.toString();
      }

      if (updatedUrl.hostname.includes("stubhub.com")) {
        updatedUrl.searchParams.set("quantity", quantity.toString());
        return updatedUrl.toString();
      }

      if (updatedUrl.hostname.includes("gametime.co")) {
        updatedUrl.searchParams.set("seat_count", quantity.toString());
        return updatedUrl.toString();
      }

      if (updatedUrl.hostname.includes("seatgeek.com")) {
        updatedUrl.searchParams.set("quantity", quantity.toString());
        return updatedUrl.toString();
      }

      // Handle Ticket Whiz URLs
      if (updatedUrl.hostname.includes("ticketwhiz.events365.com")) {
        updatedUrl.searchParams.set("quantity", quantity.toString());
        return updatedUrl.toString();
      }

      // console.log("No matching hostname found, returning original URL");
      return url;
    } catch (error) {
      console.error("Error updating quantity in URL:", error);
      return url;
    }
  };

  const listAnim = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
  };

  //variable widths for site logo in checkout page
  const variable_Dimensions = (src: string) => {
    if (src == "vividseats") {
      return "h-[22px]";
    }
    if (src == "stubhub") {
      return "w-[80px]";
    }
    if (src == "TicketNetwork") {
      return "h-[35px]";
    }
    if (src == "gametime") {
      return "h-[15px]";
    }
    if (src == "event365") {
      return "h-[20px]";
    }
    if (src == "seatgeek") {
      return "w-[50px]";
    }
    if (src == "megaseats") {
      return "w-[100px]";
    }

    return "w-[30px]";
  };

  // This loads 50 tickets at a time to keep the page running fast
  const visibleTickets = React.useMemo(() => {
    return filteredTickets.slice(0, visibleCount);
  }, [filteredTickets, visibleCount]);

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 50, filteredTickets.length));
  };

  const [scrollVal, setScollVal] = useState(0);

  const handleScroll = (e) => {
    setScollVal(e.target.scrollHeight);
  };

  const sentinelRef = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadMore();
          }
        });
      },
      {
        root: null, // Watch the main viewport
        threshold: 0.1, // Trigger as soon as 10% is visible
        rootMargin: "0px 0px 100px 0px", // Trigger 50px BEFORE it hits the bottom
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [scrollVal]);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      setLastScanned(new Date());
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-100 dark:bg-background">
      <AnimatePresence>
        {!selectedTicket ? (
          /* --- LIST VIEW --- */
          <motion.div
            key="list"
            {...listAnim}
            {...(dragProps || {})}
            className="flex flex-col w-full h-full"
          >
            {/* STICKY HEADER AREA */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm shrink-0 ">
              <Suspense fallback={<HeaderSkeleton />}>
                <div className="hidden md:block">
                  <StreamingHeader
                    eventPromise={eventPromise}
                    aiPromise={aiPromise}
                    ticketPromise={ticketPromise}
                    onVenueHover={onVenueHover}
                    // ticket={filteredTickets}
                    // setIsFilterOpen={setIsFilterOpen}
                  />
                </div>
              </Suspense>
            </div>

            {/* <pre className="text-[10px] leading-tight font-mono overflow-x-auto p-2 bg-black text-green-400 rounded-lg">
                    {JSON.stringify(ticketData, null, 2)}
                  </pre> */}
            {/* <div className="flex-1 min-h-0 bg-black">
              <div className="h-full overflow-y-auto scrollbar-thin space-y-2 p-1 bg-neutral-100 dark:bg-background rounded-t-2xl"></div> */}
            <div className="flex md:hidden px-4 py-2.5 bg-brand dark:bg-gradient-to-b from-gold  to-gold-dark  text-white dark:text-black  items-center justify-between text-[10px] ">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75  ${
                      isPending ? "bg-red-700" : "bg-gold   dark:bg-blue-400/40"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isPending
                        ? "bg-red-800"
                        : "bg-gradient-to-b from-gold  to-gold-dark dark:from-blue-400/70 dark:to-brand"
                    }`}
                  />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wide">
                  {formatScannedTime(lastScanned)}
                </span>
              </div>
              <button
                className="cursor-pointer"
                onClick={handleRefresh}
                disabled={isPending}
              >
                <RefreshCw
                  size={12}
                  className={isPending ? "animate-spin" : ""}
                />
              </button>
            </div>
            <div className="flex mx-4 justify-between  items-center max-[500px]:flex-col-reverse max-[500px]:items-start max-[500px]:gap-[10px] mt-4 md:mt-0">
              <div className="flex flex-col items-start justify-center italic">
                <p className="text-lg text-primary dark:text-gold leading-3 mt-1 font-medium">
                  {counts.filteredAll.toLocaleString("en-US")}
                </p>
                <p className="text-[0.65rem] text-muted-foreground ml-0.5">
                  Listing{counts?.filteredAll > 1 && "s"}
                </p>
              </div>
              <div className="h-full flex items-center justify-end max-[500px]:w-full ">
                <div className="flex min-w-[16rem] max-[500px]:w-full bg-brand/10 dark:bg-gold/10 rounded-[50px] mr-[10px] items-center">
                  <button
                    onClick={() => setAppliedFilters({ whizDealsOnly: false })}
                    className={`flex-1 min-w-12 cursor-pointer flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-l-2xl shadow-2xl transition-all border-y-2 border-l-2 ${
                      !appliedFilters.whizDealsOnly
                        ? "text-brand dark:text-gold border-brand dark:border-gold"
                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
                    }`}
                  >
                    All Tickets
                  </button>
                  <button
                    onClick={() => setAppliedFilters({ whizDealsOnly: true })}
                    className={`flex-1 min-w-12 relative cursor-pointer flex items-center justify-center pr-[15px] gap-2 py-2 text-xs font-medium rounded-r-2xl shadow-2xl transition-all border-y-2 border-r-2 overflow-hidden ${
                      appliedFilters.whizDealsOnly
                        ? "text-brand dark:text-gold border-brand dark:border-gold"
                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
                    }`}
                  >
                    Lowest Price{" "}
                    <SparklesIcon className="text-brand dark:text-gold w-[12px] absolute right-[12px]" />
                  </button>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="h-full min-w-[35px] ">
                      <button className="h-full w-full flex items-center justify-center border-[2px] border-brand bg-brand/10 dark:border-gold dark:text-gold rounded-[30px] cursor-pointer">
                        <ArrowUpWideNarrow className="w-4 h-4 text-brand dark:text-gold" />
                      </button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 overflow-hidden rounded-[2rem] shadow-2xl border-brand/20 dark:border-gold/30 bg-white dark:bg-neutral-950/70 backdrop-blur-md">
                    {/* Your existing 4-button grid from modal - copy paste here */}
                    <div className="p-5 space-y-4">
                      <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium">
                        Sort Order
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Price Low → Row Low */}
                        <button
                          onClick={() =>
                            setAppliedFilters({ sortOrder: "asc" })
                          }
                          className={`flex justify-between items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                                            ${
                                              appliedFilters.sortOrder === "asc"
                                                ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                                            }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <DollarSignIcon className="w-3.5 h-3.5" />
                            Price Low
                          </span>
                          <MoveDownIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Price High → Row Low */}
                        <button
                          onClick={() =>
                            setAppliedFilters({ sortOrder: "desc" })
                          }
                          className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                                            ${
                                              appliedFilters.sortOrder ===
                                              "desc"
                                                ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                                            }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <DollarSignIcon className="w-3.5 h-3.5" />
                            Price High
                          </span>
                          <MoveUpIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Price Low → Row High */}
                        <button
                          onClick={() =>
                            setAppliedFilters({ sortOrder: "row_asc" })
                          }
                          className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                                            ${
                                              currentSort === "row_asc"
                                                ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                                            }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <ListOrderedIcon className="w-3.5 h-3.5" />
                            Row Low
                          </span>
                          <MoveDownIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Price High → Row High */}
                        <button
                          onClick={() =>
                            setAppliedFilters({ sortOrder: "row_desc" })
                          }
                          className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                                            ${
                                              currentSort === "row_desc"
                                                ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                                                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                                            }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <ListOrderedIcon className="w-3.5 h-3.5" />
                            Row High
                          </span>
                          <MoveUpIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* SCROLLABLE TICKETS */}
            <div className="relative flex-1 min-h-0 ">
              <div className="absolute top-0 left-0 right-0 h-12 z-30 pointer-events-none bg-linear-to-b from-neutral-100 dark:from-background to-transparent" />
              <div
                id="scrollable-ticket-list"
                onScroll={handleScroll}
                className="h-full relative overflow-y-auto scrollbar-thin space-y-2 p-1 bg-neutral-100 dark:bg-background rounded-t-2xl"
              >
                {visibleTickets.length > 0 ? (
                  <div className="flex flex-col gap-1 p-1 space-y-2">
                    <div className="h-1"></div>

                    <InfiniteScroll
                      dataLength={visibleTickets.length}
                      next={loadMore}
                      className="flex flex-col gap-1 space-y-2"
                      // next={() => alert("working")}
                      // hasMore={
                      //   displayTickets.length > visibleTickets.length
                      //     ? true
                      //     : false
                      // }
                      hasMore={visibleTickets.length < filteredTickets.length}
                      loader={<h1>Loading</h1>}
                      endMessage={<h1></h1>}
                      scrollableTarget="scrollable-ticket-list"
                      style={{ overflow: "hidden" }}
                    >
                      {visibleTickets?.map((ticket: any) => {
                        const siteName = ticket.tgNotes || "Provider";
                        const row = ticket.tgUserRow || "TBD";

                        return (
                          <div
                            key={ticket.tgID}
                            onClick={() => onSelectTicket(ticket)}
                            onMouseEnter={() => {
                              console.log("width", window.innerWidth);
                              if (window.innerWidth > 500) {
                                onTicketHover?.(ticket, true);
                              }
                            }}
                            onMouseLeave={() => {
                              if (window.innerWidth > 500) {
                                onTicketHover?.(ticket, false);
                              }
                            }}
                            className="cursor-pointer relative flex items-center gap-2 group p-2 rounded-xl transition-all bg-linear-to-r from-foreground/10 hover:bg-gold/20 to-90% m-1 hover:ring-2 hover:ring-gold"
                          >
                            {/* Color Indicator */}
                            <div
                              className="w-2 rounded-full my-2 self-stretch dark:invert"
                              style={{
                                backgroundColor: ticket.tgColor || "#e5e7eb",
                              }}
                            />

                            <div
                              title={ticket?.tgNotes}
                              className="shrink-0 aspect-square w-20 rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#3f3f3f,#0f0f0f)] relative overflow-hidden"
                            >
                              <div className="absolute inset-0 z-20 opacity-30 mix-blend-screen bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                              <div className="absolute -top-2.5 -left-2.5 w-[30px] h-[30px] z-50 blur-sm bg-[radial-gradient(ellipse_at_center,_#ffffff,_rgba(255,255,255,0.3),_rgba(255,255,255,0.1),_transparent)]" />
                              {BRAND_LOGOS[siteName] ? (
                                <img
                                  src={
                                    BRAND_LOGOS[ticket.tgNotes] ??
                                    "/slider6.png"
                                  }
                                  alt="ticket"
                                  className="w-full h-full object-contain relative z-10 saturate-150"
                                />
                              ) : (
                                <span className="text-xs  text-muted-foreground uppercase">
                                  {siteName.slice(0, 2)}
                                </span>
                              )}
                              {/* <div className="absolute -top-100 left-1/2 transform z-[500] -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-gold backdrop-blur-sm text-black px-3 py-1.5 rounded-lg text-xs font-medium shadow-2xl border border-foreground/20 whitespace-nowrap z-50 transition-all duration-200 scale-95 group-hover:scale-100 origin-bottom pointer-events-none">
                                {ticket?.tgNotes.charAt(0).toUpperCase() +
                                  ticket?.tgNotes.slice(1)}
                             
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gold -mt-px" />
                              </div> */}
                            </div>
                            <div className="absolute rounded-full w-6 h-6 bg-neutral-100 dark:bg-background -bottom-3 left-26   transition-colors"></div>
                            <div className="absolute rounded-full w-6 h-6 bg-neutral-100 dark:bg-background -top-3 left-26"></div>
                            {/* <pre className="text-[10px] leading-tight font-mono overflow-x-auto p-2 bg-black text-green-400 rounded-lg">
                            {JSON.stringify(ticket, null, 2)}
                          </pre> */}

                            <div className="flex-1 min-w-0 py-1">
                              <div className="flex justify-between items-start gap-2 ml-4">
                                <div className="min-w-0">
                                  <div className="flex items-center text-[0.65rem] tracking-wide text-foreground/80">
                                    <span className="text-muted-foreground truncate shrink max-w-[100px]">
                                      {/* {ticket?.section?.level?.name
                                        ? `${ticket.section.level.name
                                            .replace(/section/gi, "")
                                            .trim()} Section`
                                        : "Section"} */}
                                      Section
                                    </span>
                                    {/* {ticket?.section !== null && (
                                      <span className="text-brand dark:text-gold/80 truncate inline-flex items-center">
                                        <ChevronRightIcon className="w-3 h-3 inline pb-0.25" />{" "}
                                        {ticket?.section?.canonicalName}
                                      </span>
                                    )} */}
                                  </div>
                                  <p className=" text-lg leading-tight truncate">
                                    {ticket.tgUserSec || ticket.section_level}
                                  </p>

                                  <p className="text-[0.65rem] mt-2 tracking-wide text-muted-foreground">
                                    Row
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span>
                                      {row === "TBD" || row === "N/A" ? (
                                        <span className="bg-foreground/20 px-1.5 py-0.5 rounded text-[10px]">
                                          {row}
                                        </span>
                                      ) : (
                                        `${ticket.tgUserRow || ticket.row}`
                                      )}
                                    </span>
                                    <span className="opacity-30">•</span>
                                    <span className="text-xs truncate">
                                      {(() => {
                                        const splits =
                                          ticket.tgSplits ||
                                          ticket.seat_splits ||
                                          [];
                                        const nums = splits
                                          .map(Number)
                                          .filter((n: any) => !Number.isNaN(n))
                                          .sort((a: any, b: any) => a - b);
                                        if (nums.length === 0)
                                          return `${
                                            ticket.tgQty || 0
                                          } tickets `;

                                        const parts = [];
                                        for (let j = 0; j < nums.length; ) {
                                          const start = nums[j];
                                          let end = start;
                                          while (
                                            j < nums.length - 1 &&
                                            nums[j + 1] === end + 1
                                          ) {
                                            j++;
                                            end++;
                                          }
                                          parts.push(
                                            start === end
                                              ? `${start}`
                                              : `${start}-${end}`
                                          );
                                          j++;
                                        }
                                        const text = parts.join(" or ");
                                        return `${text} ticket${
                                          nums[0] === 1 && parts.length === 1
                                            ? ""
                                            : "s"
                                        } `;
                                      })()}
                                    </span>
                                  </div>
                                </div>
                                {/* Price Section */}
                                <div className="text-right shrink-0 flex flex-col justify-center">
                                  {/* WHIZ DEAL SLOT (always occupies space) */}
                                  <div className="flex w-full justify-end mb-2 h-[22px]">
                                    {ticket.isWhizDeal && (
                                      <span
                                        className={`
                                          flex items-center gap-1 px-2 py-1 rounded-xl 
                                          text-[9px]
                                          text-white shadow-md ${ticket.whizDeal.color}
                                        `}
                                      >
                                        {ticket.whizDeal.label}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-lg md:text-xl font-semibold leading-none">
                                    ${Number(ticket.tgAllInPrice).toFixed(2)}
                                    <span className="text-sm font-medium ml-0.5">
                                      ea
                                    </span>
                                  </p>

                                  <p className="text-[10px] tracking-wide text-muted-foreground">
                                    Incl. Fees
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* This div makes the inifinite scroll work on responsive settings */}
                      <div
                        className="w-full h-[50px] hidden max-[500px]:block bg-[rgba(0,0,0,0)]"
                        ref={sentinelRef}
                        onClick={loadMore}
                      ></div>
                    </InfiniteScroll>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-12 z-20 pointer-events-none bg-gradient-to-t from-neutral-100 dark:from-background to-transparent" />
            </div>
          </motion.div>
        ) : (
          (() => {
            const t = selectedTicket;
            const siteName = t.tgNotes || "Secure Provider";

            // const basePrice = parseNum(t.price || t.tgPrice || "0");
            // const serviceFee = parseNum(t.service_charge || t.tgServiceFee);

            // Actual Price = Base + Service
            const pricePerTicket = Number(t.tgAllInPrice).toFixed(2);
            const finalBillingPrice = pricePerTicket * selectedQuantity;

            const splits = t.seat_splits?.map(Number) || [1];
            const maxAvailable = Math.max(...splits);

            const section = t.tgUserSec || t.section || "General";
            const row = t.tgUserRow || t.row || "TBD";
            const ticketUrl = t.tgClientData;

            const qtyOptions = Array.from(
              { length: Math.min(maxAvailable, 9) },
              (_, i) => i + 1
            );

            return (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="flex flex-col w-full h-full overflow-hidden"
              >
                <motion.div
                  {...(dragProps || {})}
                  className="bg-foreground/5 sticky top-0 z-50  p-4 flex items-center gap-4"
                >
                  <div className="min-w-0 flex flex-col gap-1 w-full">
                    <div className="w-full flex justify-between items-center">
                      <button
                        onClick={() => {
                          onBack();
                          if (appliedFilters.quantity > 1) {
                            setSelectedQuantity(appliedFilters.quantity);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-brand dark:bg-gradient-to-b from-gold  to-gold-dark/70 text-white dark:text-black flex items-center justify-center hover:opacity-90 transition-opacity shrink-0
                            focus:outline-none overflow-hidden cursor-pointer
                            shadow-[0_3px_8px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_2px_rgba(0,0,0,0.3)_inset]
                        dark:shadow-[0_4px_12px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_3px_rgba(0,0,0,0.6)]"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <div>
                        {/* {BRAND_LOGOS[siteName] && ( */}
                        <img
                          src={`/${
                            imagesData.filter((e) => e.src == siteName)[0].img
                          }`}
                          alt="ticket"
                          className={`${variable_Dimensions(
                            siteName
                          )}  object-contain relative z-10 saturate-150`}
                        />
                        {/* )} */}
                      </div>
                    </div>

                    <div className="flex justify-between w-full items-center">
                      <div className="content-event flex-1">
                        <h1 className="text-xl font-medium leading-tight ">
                          {event.name || event.event_name || "Event Details"}
                        </h1>
                        <p className="text-[14px]">{event.event_venue}</p>
                      </div>
                      <div className="h-[50px] w-[30px] " />
                      {/* <div className="shrink-0 aspect-square w-20 rounded-2xl border-[0.1] shadow-2xl border-white bg-[radial-gradient(circle_at_50%_30%,#3f3f3f,#0f0f0f)] relative overflow-hidden">
                        <div className="absolute inset-0 z-20 opacity-30 mix-blend-screen bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                        <div className="absolute -top-2.5 -left-2.5 w-[30px] h-[30px] z-50 blur-sm bg-[radial-gradient(ellipse_at_center,_#ffffff,_rgba(255,255,255,0.3),_rgba(255,255,255,0.1),_transparent)]" />
                        {BRAND_LOGOS[siteName] ? (
                          <img
                            src={BRAND_LOGOS[siteName] ?? "/slider6.png"}
                            alt="ticket"
                            className="w-full h-full object-contain relative z-10 saturate-150"
                          />
                        ) : (
                          <span className="text-xs  text-muted-foreground uppercase">
                            {siteName.slice(0, 2)}
                          </span>
                        )}
                      </div> */}
                    </div>
                    {/* <div className="flex md:flex-row flex-col items-start md:items-center gap-1 md:gap-2 mt-1">
                      <p className="text-[14px]">{formatDate()}</p>
                      <span className="text-[14px] hidden md:inline-block">
                        •
                      </span>
                      <p
                        title={event.venue}
                        className="text-[14px] truncate max-w-[240px]"
                      >
                        {event.venue || event.event_location}
                      </p>
                    </div> */}
                  </div>
                </motion.div>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 md:p-6 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[0.65rem] tracking-widest text-foreground/80 uppercase ">
                          Section
                        </p>
                        <h2 className="text-3xl tracking-tighter">{section}</h2>
                        <p className="mt-4 text-[0.65rem] tracking-widest text-foreground/80 uppercase ">
                          Row
                        </p>
                        <p className="text-xl">{row}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase text-muted-foreground mb-1">
                          Price
                        </p>
                        <p className="text-3xl text-primary">
                          ${pricePerTicket}
                          <span className="text-sm ml-2">ea</span>
                        </p>
                        <p className="text-xs text-muted-foreground/80 mt-1">
                          (Incl. Fees)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs pl-0.5 uppercase tracking-wider text-foreground">
                          How many tickets?
                        </label>
                        {/* Tooltip for 'Splits' - Explained in plain English */}
                        <div className="group relative">
                          <span className="text-[10px] bg-secondary px-2 py-1 rounded-full text-muted-foreground flex items-center gap-1 cursor-help">
                            <Info className="w-3 h-3" /> Why are some missing?
                          </span>
                          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-popover text-[10px] rounded shadow-xl border invisible group-hover:visible z-50">
                            The seller only allows tickets to be bought in these
                            specific quantities to avoid leaving single seats.
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {qtyOptions.map((num) => {
                          const isAvailable = splits.includes(num);

                          // Exact match: the actual target quantity
                          const isSelected = selectedQuantity === num;

                          // Range match: highlights everything from 1 up to the selected quantity
                          const isVisualRange =
                            selectedQuantity !== null &&
                            num <= selectedQuantity;

                          return (
                            <button
                              key={num}
                              disabled={!isAvailable}
                              onClick={() => {
                                // if(appliedFilters.quantity > 1){
                                //     const newValue = isSelected ? null : appliedFilters.quantity;
                                //     setSelectedQuantity(newValue);
                                // }
                                // If already selected, toggle off (null), otherwise set to num
                                const newValue = isSelected ? null : num;
                                setSelectedQuantity(newValue);
                              }}
                              className={`
                                relative h-12 w-12 rounded-xl font-bold transition-all cursor-pointer
                                ${!isAvailable ? "hidden" : "border-2"} 
                                ${
                                  isSelected
                                    ? "bg-brand border-gold text-white shadow-md scale-105 z-10"
                                    : isVisualRange
                                    ? "bg-background border-muted hover:border-gold text-foreground"
                                    : "bg-background border-muted hover:border-gold text-foreground"
                                }
                              `}
                            >
                              <span
                                className={
                                  isSelected ? "scale-110 inline-block" : ""
                                }
                              >
                                {num}
                              </span>

                              {isSelected && (
                                <motion.div
                                  layoutId="qtyCheck"
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center shadow-sm"
                                >
                                  <CheckIcon className="w-2.5 h-2.5 text-black" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* <pre className="text-[10px] leading-tight font-mono overflow-x-auto p-2 bg-black text-green-400 rounded-lg">
                      {JSON.stringify(event, null, 2)}
                    </pre>
                    <pre className="text-[10px] leading-tight font-mono overflow-x-auto p-2 bg-black text-green-400 rounded-lg">
                      {JSON.stringify(selectedTicket, null, 2)}
                    </pre> */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <span className="text-[10px]  uppercase leading-tight">
                          100% Buyer
                          <br />
                          Protected
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px]  uppercase leading-tight">
                          Instant
                          <br />
                          Delivery
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="WarningMessage w-full min-h-[80px] p-[20px] mb-[5px]">
                  <div className="w-full h-full flex items-center justify-between rounded-[10px] pl-[10px] pr-[10px]">
                    <p className="text-xs italic">
                      Prices may vary. Final pricing, including any applicable
                      taxes or fees, is set by the marketplace at checkout.
                    </p>
                    {/* <div className="IconHolder">
                      <InfoIcon className="text-brand dark:text-gold" />
                    </div> */}
                  </div>
                </div>

                {/* Fixed bottom CTA */}
                <div className="px-4 md:px-6 py-3 bg-background border-t shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-end mb-2">
                    {/* Total Price Section */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Total
                      </span>
                      <div className="flex items-baseline text-3xl font-medium">
                        <NumberFlow
                          value={finalBillingPrice}
                          className="tabular-nums"
                          format={{
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }}
                        />
                        <span className="text-sm">&nbsp;Incl. Fees</span>
                      </div>
                    </div>

                    {/* Quantity Section */}
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Count
                      </span>
                      <div className="flex items-baseline gap-1 text-3xl font-medium">
                        <span className="text-xl font-semibold text-muted-foreground">
                          x
                        </span>
                        <NumberFlow
                          value={selectedQuantity}
                          className="tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full text-lg group bg-brand hover:bg-gradient-to-br from-gold to-gold-dark hover:text-black hover:saturate-150 text-white rounded-md shadow-md hover:scale-[0.99] transition-all"
                    asChild
                  >
                    <a
                      href={getUpdatedUrlWithQuantity(
                        ticketUrl,
                        selectedQuantity
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Checkout on{" "}
                      {siteName.charAt(0).toUpperCase() + siteName.slice(1)}
                      <ExternalLinkIcon className="w-5 h-5 ml-1" />
                    </a>
                  </Button>
                  <p className="text-center text-[10px] text-muted-foreground mt-3 font-medium uppercase tracking-widest">
                    Redirecting to {siteName} checkout
                  </p>
                </div>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}

export function StreamingHeader({
  eventPromise,
  aiPromise,
  ticketPromise,
  onVenueHover,
}: // ticket,
// setIsFilterOpen,
any) {
  const { data: eventData } = use(eventPromise);
  const { data: aiData } = use(aiPromise);
  const { data: ticketData } = use(ticketPromise);

  const isDesktop = useIsDesktop();
  // const [isAIExpanded, setIsAIExpanded] = useState(false);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastScanned, setLastScanned] = useState(new Date());

  const {
    setIsFilterOpen,
    appliedFilters,
    setAppliedFilters,
    ticketModalFilters,
    setTicketModalFilters,
    priceBounds,
    priceHistogram,
    sectionOptions,
    filteredTickets,
    computeWhizDeals,
    SubmitToMap,
    resetFilters,
    resetTicketsFilters,
    applyVenueToMap,
    // setMergedTickets,
  } = useTicketStore();

  // useEffect(() => console.log(appliedFilters), [appliedFilters]);

  // const counts = getTicketCounts();
  const currentSort = appliedFilters.sortOrder;
  const isPriceActive = currentSort === "asc" || currentSort === "desc";
  const isRowActive = currentSort === "row_asc" || currentSort === "row_desc";

  useEffect(() => {
    if (priceBounds[0] > 0) setAppliedFilters({ priceRange: priceBounds });
  }, []);

  // Calculate total active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (
      appliedFilters.priceRange[0] !== priceBounds[0] ||
      appliedFilters.priceRange[1] !== priceBounds[1]
    )
      count++;
    if (appliedFilters.seatSplit !== null) count++;
    if (appliedFilters.venueLevels.length > 0) count++;
    if (appliedFilters.whizDealsOnly) count++;

    return count;
  }, [appliedFilters, priceBounds]);

  const handleToggle = (key: "venueLevels" | "seatSplit", value: any) => {
    // console.log("for venue");
    const current = appliedFilters[key] as any[];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    setAppliedFilters({ [key]: next });
    // SubmitToMap();

    // applyVenueToMap();
  };

  const histogramData = useMemo(() => {
    const [minBound, maxBound] = priceBounds;
    return priceHistogram.map((count, i) => {
      const bucketPrice = minBound + (i * (maxBound - minBound)) / 20;
      return {
        count,
        isActive:
          bucketPrice >= appliedFilters.priceRange[0] &&
          bucketPrice <= appliedFilters.priceRange[1],
      };
    });
  }, [priceHistogram, priceBounds, appliedFilters.priceRange]);

  const maxVal = Math.max(...priceHistogram, 1);

  // Label Helpers
  const getPriceLabel = () => {
    const [min, max] = appliedFilters.priceRange;
    const [bMin, bMax] = priceBounds;
    if (min > bMin && max < bMax) return `$${min}-$${max}`;
    if (min > bMin) return `> $${min}`;
    if (max < bMax) return `< $${max}`;
    return "Any Price";
  };

  const truncateString = (str: string) => {
    return str.length > 8 ? str.slice(0, 8) + "..." : str;
  };

  const getSectionLabel = () => {
    const selected = appliedFilters.venueLevels;
    const count = selected.length;

    if (count === 0) return "All Sections";
    if (count === 1) return `${truncateString(selected[0])}`;
    // if (count === 2) return `${selected[0]} & ${selected[1]}`;
    return `${truncateString(selected[0])} (+${count - 1})`;
  };

  const getSortLabel = () => {
    switch (currentSort) {
      case "desc":
        return "Price High";
      case "row_asc":
        return "Row Low";
      case "row_desc":
        return "Row High";
      default:
        return "Price Low";
    }
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      setLastScanned(new Date());
    });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNativeShare = async (shareData: {
    title?: string;
    text: string;
    url?: string;
  }) => {
    if (
      "share" in navigator &&
      typeof (navigator as any).share === "function"
    ) {
      try {
        await (navigator as any).share(shareData);
      } catch (err) {
        console.log("Native share failed:", err);
      }
    }
  };

  const handleShare = async (customMessage?: string) => {
    const eventName = eventData?.event_name || "this event";
    const venue = eventData?.event_venue || "venue";
    const date = formatEventDate(eventData?.event_timing || "");
    const url = window.location.href;

    const defaultMessage = `🎫 Check out ${eventName} tickets at ${venue}! Showtime: ${date}\n\n${url}`;
    const message = customMessage || defaultMessage;

    const shareData = {
      title: `${eventName} - Live Tickets`,
      text: message,
      url: url,
    };

    await handleNativeShare(shareData);

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(message);
      alert("Link copied to clipboard! 📋");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const theme = useBrowserTheme();

  return (
    <div className="bg-neutral-100/80 text-black dark:bg-gradient-to-t from-neutral-950 to-neutral-800 dark:text-white ">
      <div className="hidden md:flex px-4 py-2.5 bg-brand dark:bg-gradient-to-b from-gold  to-gold-dark  text-white dark:text-black  items-center justify-between text-[10px] ">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75  ${
                isPending ? "bg-red-700" : "bg-gold   dark:bg-blue-400/40"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPending
                  ? "bg-red-800"
                  : "bg-gradient-to-b from-gold  to-gold-dark dark:from-blue-400/70 dark:to-brand"
              }`}
            />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wide">
            {formatScannedTime(lastScanned)}
          </span>
        </div>
        <button
          className="cursor-pointer"
          onClick={handleRefresh}
          disabled={isPending}
        >
          <RefreshCw size={12} className={isPending ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="px-4 md:px-4 pt-4 flex flex-col ">
        <div className="flex items-stretch justify-between  ">
          <div className=" space-y-1 md:space-y-2 min-w-0 flex-1">
            <h1 className="text-lg md:text-2xl font-semibold leading-tight">
              {eventData?.event_name}{" "}
            </h1>

            <div className="flex  md:flex-row md:flex-wrap gap-x-2 gap-y-0.5 md:gap-y-1 text-[11px] md:text-xs opacity-90">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 hidden md:block" />
                <span className="truncate">{eventData?.event_venue}</span>
                {eventData?.event_city && (
                  <>
                    <span className="opacity-80">•</span>
                    <span className="hidden md:block">
                      {eventData.event_city}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 hidden md:block" />
                <span>{formatEventDate(eventData.event_timing)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {ticketData?.site_details?.length > 0 && (
                <div className="flex items-center justify-start gap-1">
                  {ticketData.site_details.map((site, idx) => (
                    <a
                      key={site.site_name}
                      href={site.event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative inline-block cursor-pointer"
                      title={site.site_name}
                      aria-label={`Tickets from ${site.site_name}`}
                    >
                      <div className="h-5 w-5 rounded-sm shadow-2xs  overflow-hidden hover:scale-125 hover:-translate-y-1 transition-all duration-200">
                        {BRAND_LOGOS[site.site_name] ? (
                          <img
                            src={BRAND_LOGOS[site.site_name] ?? "/slider6.png"}
                            alt={site.site_name}
                            className="h-full w-full object-contain"
                            aria-hidden="true"
                          />
                        ) : (
                          <span className="text-[8px]  text-muted-foreground flex items-center justify-center h-full">
                            {site.site_name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="absolute -top-100 left-1/2 transform -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-gold backdrop-blur-sm text-black px-3 py-1.5 rounded-lg text-xs font-medium shadow-2xl border border-foreground/20 whitespace-nowrap z-50 transition-all duration-200 scale-95 group-hover:scale-100 origin-bottom pointer-events-none">
                        {site.site_name.charAt(0).toUpperCase() +
                          site.site_name.slice(1)}
                        {/* {" >"} */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gold -mt-px" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex md:flex-col  justify-start items-center gap-2.5 md:gap-2   ">
            {/* <button
              className="w-10 h-10 rounded-full bg-brand dark:bg-gradient-to-b from-gold from-50% to-gold-dark flex items-center justify-center hover:opacity-90 transition-opacity shrink-0
              focus:outline-none overflow-hidden cursor-pointer
              shadow-[0_3px_8px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_2px_rgba(0,0,0,0.3)_inset]
              dark:shadow-[0_4px_12px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_3px_rgba(0,0,0,0.6)]
            "
            >
              <ShareIcon className="w-4 h-4 text-background" />
            </button> */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center justify-center group outline-none translate-y-[2px] p-2 rounded-full bg-brand/10 dark:bg-gradient-to-b from-gold from-50% to-gold-dark hover:opacity-90 transition-opacity shrink-0
                  focus:outline-none overflow-hidden cursor-pointer"
                >
                  <Share className="size-[18px] text-brand/70 hover:text-brand text-bold" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0 overflow-hidden rounded-[2rem] shadow-2xl border-brand/20 dark:border-gold/30 bg-white dark:bg-neutral-950/70 backdrop-blur-md"
                align="end"
                sideOffset={8}
              >
                {/* Simple Header */}
                <div className="px-6 py-4 bg-muted-background">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-brand dark:text-gold" />
                    <h3 className="text-base font-medium tracking-tight dark:text-gold">
                      Share Event
                    </h3>
                  </div>
                </div>

                {/* Compact Share Options */}
                <div className="p-5 space-y-4 max-h-[340px] overflow-y-auto no-scrollbar">
                  {[
                    {
                      icon: "👔",
                      title: "Colleagues",
                      message: `Check out ${eventData?.event_name} tickets at ${eventData?.event_venue}! Great seats available.`,
                    },
                    {
                      icon: "🎉",
                      title: "Friends",
                      message: `Want to catch ${eventData?.event_name} live at ${eventData?.event_venue}?`,
                    },
                    {
                      icon: "👨‍👩‍👧‍👦",
                      title: "Family",
                      message: `${eventData?.event_name} at ${eventData?.event_venue}! Perfect group event.`,
                    },
                  ].map((option, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group"
                    >
                      <button
                        onClick={() =>
                          handleShare(
                            `${option.message} ${window.location.href}`
                          )
                        }
                        className="w-full p-3.5 bg-neutral-50 dark:bg-gold/10 rounded-2xl border border-neutral-100 dark:border-gold/50 hover:shadow-md active:scale-[0.98] transition-all group-hover:border-brand/50 dark:group-hover:border-gold/50"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0 mt-0.5">
                            {option.icon}
                          </span>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-foreground/90 group-hover:text-brand dark:group-hover:text-gold">
                              {option.title}
                            </p>
                            <p className="text-[10px] text-foreground/70 mt-1 line-clamp-2 leading-tight">
                              {option.message}
                            </p>
                          </div>
                          <Share2 className="w-3.5 h-3.5 text-foreground/40 group-hover:text-brand dark:group-hover:text-gold flex-shrink-0 mt-0.5" />
                        </div>
                      </button>
                    </motion.div>
                  ))}

                  {/* Copy Link Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={() => handleShare()}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-brand/5 dark:bg-gold/20 hover:bg-brand/10 dark:hover:bg-gold/30 border border-dashed border-neutral-200 dark:border-gold/40 rounded-2xl text-xs font-medium transition-all hover:border-brand/30 dark:hover:border-gold/50"
                    >
                      <PlusIcon className="w-3.5 h-3.5 text-foreground/50" />
                      Copy Custom Link
                    </button>
                  </motion.div>
                </div>

                {/* Simple Footer */}
                <div className="p-5 pt-4 bg-neutral-50/80 dark:bg-neutral-900/50 border-t border-neutral-100/50 dark:border-neutral-800/50">
                  <button
                    onClick={() =>
                      handleNativeShare({
                        title: `${eventData?.event_name || "Event"} Tickets`,
                        text: `Great tickets for ${
                          eventData?.event_name || "this event"
                        } at ${eventData?.event_venue || "venue"}`,
                        url: window.location.href,
                      })
                    }
                    className="w-full px-4 py-3 bg-brand dark:bg-gold text-background rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Native Share
                  </button>
                  <p className="text-[10px] text-neutral-400 text-center mt-2">
                    {eventData?.event_venue || "Event"}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center justify-center group outline-none translate-y-[2px] p-2 rounded-full bg-brand/10 dark:bg-gradient-to-b from-gold from-50% to-gold-dark hover:opacity-90 transition-opacity shrink-0
                  focus:outline-none overflow-hidden cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    className="text-brand/70 hover:text-brand"
                  >
                    <path
                      fill="currentColor"
                      d="M10.277 16.515c.005-.11.187-.154.24-.058c.254.45.686 1.111 1.177 1.412c.49.3 1.275.386 1.791.408c.11.005.154.186.058.24c-.45.254-1.111.686-1.412 1.176s-.386 1.276-.408 1.792c-.005.11-.187.153-.24.057c-.254-.45-.686-1.11-1.176-1.411s-1.276-.386-1.792-.408c-.11-.005-.153-.187-.057-.24c.45-.254 1.11-.686 1.411-1.177c.301-.49.386-1.276.408-1.791m8.215-1c-.008-.11-.2-.156-.257-.062c-.172.283-.421.623-.697.793s-.693.236-1.023.262c-.11.008-.155.2-.062.257c.283.172.624.42.793.697s.237.693.262 1.023c.009.11.2.155.258.061c.172-.282.42-.623.697-.792s.692-.237 1.022-.262c.11-.009.156-.2.062-.258c-.283-.172-.624-.42-.793-.697s-.236-.692-.262-1.022M14.704 4.002l-.242-.306c-.937-1.183-1.405-1.775-1.95-1.688c-.545.088-.806.796-1.327 2.213l-.134.366c-.149.403-.223.604-.364.752c-.143.148-.336.225-.724.38l-.353.141l-.248.1c-1.2.48-1.804.753-1.881 1.283c-.082.565.49 1.049 1.634 2.016l.296.25c.325.275.488.413.58.6c.094.187.107.403.134.835l.024.393c.093 1.52.14 2.28.634 2.542s1.108-.147 2.336-.966l.318-.212c.35-.233.524-.35.723-.381c.2-.032.402.024.806.136l.368.102c1.422.394 2.133.591 2.52.188c.388-.403.196-1.14-.19-2.613l-.099-.381c-.11-.419-.164-.628-.134-.835s.142-.389.365-.752l.203-.33c.786-1.276 1.179-1.914.924-2.426c-.254-.51-.987-.557-2.454-.648l-.379-.024c-.417-.026-.625-.039-.806-.135c-.18-.096-.314-.264-.58-.6m-5.869 9.324C6.698 14.37 4.919 16.024 4.248 18c-.752-4.707.292-7.747 1.965-9.637c.144.295.332.539.5.73c.35.396.852.82 1.362 1.251l.367.31l.17.145c.005.064.01.14.015.237l.03.485c.04.655.08 1.294.178 1.805"
                    ></path>
                  </svg>
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="w-80 p-0 overflow-hidden rounded-[2rem] shadow-2xl border-brand/20 dark:border-gold/30 bg-white dark:bg-neutral-950/70 backdrop-blur-md"
                align="end"
                sideOffset={8}
              >
                {/* AI Header */}
                <div className="px-6 py-4 bg-muted-background">
                  <div className="flex items-center gap-2">
                    {/* <Sparkles className="w-4 h-4 text-brand dark:text-gold" /> */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      className="text-brand dark:text-gold"
                    >
                      <path
                        fill="currentColor"
                        d="M10.277 16.515c.005-.11.187-.154.24-.058c.254.45.686 1.111 1.177 1.412c.49.3 1.275.386 1.791.408c.11.005.154.186.058.24c-.45.254-1.111.686-1.412 1.176s-.386 1.276-.408 1.792c-.005.11-.187.153-.24.057c-.254-.45-.686-1.11-1.176-1.411s-1.276-.386-1.792-.408c-.11-.005-.153-.187-.057-.24c.45-.254 1.11-.686 1.411-1.177c.301-.49.386-1.276.408-1.791m8.215-1c-.008-.11-.2-.156-.257-.062c-.172.283-.421.623-.697.793s-.693.236-1.023.262c-.11.008-.155.2-.062.257c.283.172.624.42.793.697s.237.693.262 1.023c.009.11.2.155.258.061c.172-.282.42-.623.697-.792s.692-.237 1.022-.262c.11-.009.156-.2.062-.258c-.283-.172-.624-.42-.793-.697s-.236-.692-.262-1.022M14.704 4.002l-.242-.306c-.937-1.183-1.405-1.775-1.95-1.688c-.545.088-.806.796-1.327 2.213l-.134.366c-.149.403-.223.604-.364.752c-.143.148-.336.225-.724.38l-.353.141l-.248.1c-1.2.48-1.804.753-1.881 1.283c-.082.565.49 1.049 1.634 2.016l.296.25c.325.275.488.413.58.6c.094.187.107.403.134.835l.024.393c.093 1.52.14 2.28.634 2.542s1.108-.147 2.336-.966l.318-.212c.35-.233.524-.35.723-.381c.2-.032.402.024.806.136l.368.102c1.422.394 2.133.591 2.52.188c.388-.403.196-1.14-.19-2.613l-.099-.381c-.11-.419-.164-.628-.134-.835s.142-.389.365-.752l.203-.33c.786-1.276 1.179-1.914.924-2.426c-.254-.51-.987-.557-2.454-.648l-.379-.024c-.417-.026-.625-.039-.806-.135c-.18-.096-.314-.264-.58-.6m-5.869 9.324C6.698 14.37 4.919 16.024 4.248 18c-.752-4.707.292-7.747 1.965-9.637c.144.295.332.539.5.73c.35.396.852.82 1.362 1.251l.367.31l.17.145c.005.064.01.14.015.237l.03.485c.04.655.08 1.294.178 1.805"
                      ></path>
                    </svg>
                    <h3 className="text-base font-medium tracking-tight dark:text-gold truncate">
                      {/* {aiData?.event_name}  */}
                      AI Insights
                    </h3>
                  </div>
                </div>

                {/* Content Area with Smooth Fade Masks */}
                <div className="relative">
                  <motion.div
                    className="p-5 space-y-6 max-h-[320px] overflow-y-auto no-scrollbar"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                    }}
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1,
                          delayChildren: 0.1,
                        },
                      },
                    }}
                  >
                    {aiData?.seo_content ? (
                      <>
                        {/* Section 1 */}
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            show: { opacity: 1, y: 0 },
                          }}
                          className="space-y-2.5"
                        >
                          <h4 className="text-[10px] font-medium uppercase text-center tracking-wider text-foreground/80">
                            Event Overview
                          </h4>
                          <div className="p-3.5 bg-neutral-50 dark:bg-gold/10 rounded-2xl border border-neutral-100 dark:border-gold/50">
                            <p className="text-xs leading-relaxed text-foreground/80">
                              {aiData.seo_content.contain_1}
                            </p>
                          </div>
                        </motion.div>

                        {/* Section 2 */}
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            show: { opacity: 1, y: 0 },
                          }}
                          className="space-y-2.5 pb-4"
                        >
                          <h4 className="text-[10px] font-medium uppercase text-center tracking-wider text-foreground/80">
                            Price Highlights
                          </h4>
                          <div className="p-3.5 bg-neutral-50 dark:bg-gold/10 rounded-2xl border border-neutral-100 dark:border-gold/50">
                            <p className="text-xs leading-relaxed text-foreground/80">
                              {aiData.seo_content.contain_2}
                            </p>
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      <div className="py-12 text-center">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Bottom Fixed Footer */}
                <motion.div
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                  className="p-5 bg-neutral-50 dark:bg-neutral-900/80 border-t border-neutral-100 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    {/* Date Tag - Sized Up */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm transition-colors">
                      <Calendar className="w-3.5 h-3.5 text-brand dark:text-gold" />
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                        {new Date(eventData.event_timing).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {/* Location Tag - Sized Up */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-brand dark:text-gold" />
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 truncate">
                        {eventData?.event_city}, {eventData?.event_state}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-400 italic leading-tight text-center">
                    Generated for{" "}
                    <span className="text-neutral-600 dark:text-gold/80 font-medium not-italic">
                      {eventData.event_venue}
                    </span>
                  </p>
                </motion.div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center justify-start gap-2 py-3 w-full overflow-x-visible max-[500px]:overflow-x-auto no-scrollbar ">
          {/* Main Filter Icon with Badge */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`relative shrink-0 flex items-center justify-center h-[38px] w-[38px] rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                  ${
                    activeFilterCount > 0
                      ? "bg-brand text-white border-gold"
                      : "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                  }`}
          >
            <SlidersHorizontalIcon className="w-4 h-4" />

            {/* Active Filter Badge */}
            {activeFilterCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-black text-[10px] font-bold dark:border-neutral-900"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </button>

          {/* {activeFilterCount > 0 && ( */}
          <button
            onClick={() => {
              resetFilters(), resetTicketsFilters();
              window?.Seatics?.MapComponent?.reset();
            }}
            className={`relative shrink-0 flex items-center justify-center h-[38px] w-[38px] p-[8px] rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                  ${
                    activeFilterCount > 0
                      ? "bg-brand text-white border-gold"
                      : "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                  }
                  `}
          >
            <ClearFilterIcon />
          </button>
          {/* // )} */}

          {/* Quick Price Toggle/Popover */}
          {isDesktop ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`shrink-0 flex items-center gap-1 px-2 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                  ${
                    appliedFilters.priceRange[0] !== priceBounds[0]
                      ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
                  }`}
                >
                  <DollarSignIcon className="w-3.5 h-3.5" />
                  {getPriceLabel()}
                  <ChevronDownIcon className="h-3 w-3 opacity-80" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-6 rounded-[2rem] shadow-xl border-neutral-200 dark:border-neutral-800"
                align="start"
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-end">
                    <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest">
                      Price Range
                    </h4>
                    <span className="text-xs text-brand dark:text-gold font-medium">
                      ${appliedFilters.priceRange[0]} — $
                      {appliedFilters.priceRange[1]}
                    </span>
                  </div>

                  <div className="w-full h-[35px] flex items-center justify-baseline gap-[10px]">
                    {/* <div className="Badges h-full min-w-[50px] pl-[15px] pr-[15px] rounded-[50px] border-2 border-black">
                      Under 70$
                    </div> */}
                    <div
                      onClick={() => {
                        // setLocalFilter((prev) => ({
                        //   ...prev,
                        //   priceRange: [priceBounds[0], priceBounds[0] + 50],
                        // }));
                        setAppliedFilters({
                          priceRange: [priceBounds[0], priceBounds[0] + 50],
                        });

                        SubmitToMap();
                      }}
                      className="Badges h-full min-w-[40px] pl-[10px] pr-[10px] rounded-[50px] border-2 flex items-center justify-center border-brand dark:border-gold text-brand dark:text-gold cursor-pointer text-[12px] font-medium"
                    >
                      Under {priceBounds[0] + 50}$
                    </div>
                    <div
                      onClick={() => {
                        // setLocalFilter((prev) => ({
                        //   ...prev,
                        //   priceRange: [priceBounds[0], priceBounds[0] + 100],
                        // }));
                        setAppliedFilters({
                          priceRange: [priceBounds[0], priceBounds[0] + 100],
                        });

                        SubmitToMap();
                      }}
                      className="Badges h-full min-w-[40px] pl-[10px] pr-[10px] rounded-[50px] border-2 flex items-center justify-center border-brand dark:border-gold text-brand dark:text-gold cursor-pointer text-[12px] font-medium"
                    >
                      Under {priceBounds[0] + 100}$
                    </div>
                  </div>

                  <div className="CustomInputs w-full h-[40px] flex items-center justify-between gap-[10px]">
                    <div className="relative min-w-[120px] mt-5">
                      <label className="absolute bg-[white] dark:bg-[rgba(23,23,23)] dark:text-gold text-xs text-[color:var(--color-brand)] font-semibold z-[1] px-[5px] py-0 left-3 -top-2.5">
                        Min
                      </label>
                      <div className="flex items-center border-[color:var(--color-brand)] dark:border-gold px-3 py-2 rounded-[50px] border-2 border-solid">
                        <span className="text-brand dark:text-gold mr-[8px] font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          value={appliedFilters.priceRange[0]}
                          onChange={
                            (e) =>
                              setAppliedFilters({
                                priceRange: [
                                  Number(e.target.value),
                                  priceBounds[1],
                                ],
                              })
                            // setLocalFilter((prev) => ({
                            //   ...prev,
                            //   priceRange: [
                            //     Number(e.target.value),
                            //     prev.priceRange[1],
                            //   ],
                            // }))
                          }
                          className="custom-number-input"
                        />
                      </div>
                    </div>
                    <div className="relative min-w-[120px] mt-5">
                      <label className="absolute bg-[white] dark:bg-[rgba(23,23,23)] dark:text-gold text-xs text-[color:var(--color-brand)] font-semibold z-[1] px-[5px] py-0 left-3 -top-2.5">
                        Max
                      </label>
                      <div className="flex items-center border-[color:var(--color-brand)] dark:border-gold px-3 py-2 rounded-[50px] border-2 border-solid ">
                        <span className="text-brand dark:text-gold mr-[8px] font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          value={appliedFilters.priceRange[1]}
                          onChange={
                            (e) =>
                              setAppliedFilters({
                                priceRange: [
                                  priceBounds[0],
                                  Number(e.target.value),
                                ],
                              })
                            // setLocalFilter((prev) => ({
                            //   ...prev,
                            //   priceRange: [
                            //     prev.priceRange[0],
                            //     Number(e.target.value),
                            //   ],
                            // }))
                          }
                          // onChange={(e) => onChange(Number(e.target.value))}
                          className="custom-number-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Histogram - Matched to your modal logic */}
                  <div className="flex items-end gap-[1px] h-14 px-1">
                    {histogramData.map(({ count, isActive, price }, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-sm transition-all duration-300 group relative ${
                          isActive
                            ? "bg-brand dark:bg-gold opacity-100 shadow-sm"
                            : "bg-neutral-200 dark:bg-neutral-700 opacity-40"
                        }`}
                        style={{
                          height: `${Math.max((count / maxVal) * 100, 4)}%`,
                        }}
                      >
                        {/* Tooltip for Popover */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          ${price}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Range Slider - Matched to your working modal structure */}
                  <div className="relative h-6 flex items-center">
                    {/* Background Track */}
                    <div className="absolute w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full" />

                    {/* Active Selection Highlight */}
                    <div
                      className="absolute h-1 bg-brand dark:bg-gold rounded-full transition-all z-10"
                      style={{
                        left: `${
                          ((appliedFilters.priceRange[0] - priceBounds[0]) /
                            (priceBounds[1] - priceBounds[0])) *
                          100
                        }%`,
                        right: `${
                          100 -
                          ((appliedFilters.priceRange[1] - priceBounds[0]) /
                            (priceBounds[1] - priceBounds[0])) *
                            100
                        }%`,
                      }}
                    />

                    {/* Slider Inputs */}
                    <input
                      type="range"
                      min={priceBounds[0]}
                      max={priceBounds[1]}
                      value={appliedFilters.priceRange[0]}
                      onChange={(e) => {
                        const val = Math.min(
                          +e.target.value,
                          appliedFilters.priceRange[1] - 1
                        );
                        // console.log("this is the price");
                        setAppliedFilters({
                          priceRange: [val, appliedFilters.priceRange[1]],
                        });

                        // setLocalFilter((prev) => ({
                        //   ...prev,
                        //   priceRange: [val, prev.priceRange[1]],
                        // }));
                        // setLocalFilter(prev => ({
                        //   ...prev,priceRange:[val,prev.priceRange[1]]
                        // }))
                        // computeWhizDeals(filteredTickets);
                        // compute
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                    />
                    <input
                      type="range"
                      min={priceBounds[0]}
                      max={priceBounds[1]}
                      value={appliedFilters.priceRange[1]}
                      onChange={(e) => {
                        const val = Math.max(
                          +e.target.value,
                          appliedFilters.priceRange[0] + 1
                        );
                        // setLocalFilter((prev) => ({
                        //   ...prev,
                        //   priceRange: [prev.priceRange[0], val],
                        // }));
                        setAppliedFilters({
                          priceRange: [appliedFilters.priceRange[0], val],
                        });
                      }}
                      className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                    />
                  </div>

                  {/* Reset Footer */}
                  {/* <PopoverClose> */}
                  <div className="w-full flex items-center justify-between gap-[10px]">
                    <button
                      onClick={() => {
                        // resetFilters();
                        // resetTicketsFilters();
                        // window?.Seatics?.MapComponent?.reset();

                        setAppliedFilters({ priceRange: priceBounds });
                        //  if (typeof window !== "undefined" && window.Seatics?.MapComponent) {
                        //   // window.Seatics.MapComponent.legend?.dropDown?.deSelectAll?.();
                        //   window.Seatics.MapComponent.setFilterOptions(
                        //     new window.Seatics.FilterOptions()
                        //   );
                        // }
                        SubmitToMap();
                      }}
                      className="flex items-center gap-2 text-xs w-1/2 cursor-pointer font-medium text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                    >
                      <RotateCcwIcon className="w-3.5 h-3.5" />
                      Clear All
                    </button>
                    {/* <button
                      onClick={(e) => {
                        setAppliedFilters({ priceRange: [0, 100000] });
                        // SubmitToMap();
                      }}
                      disabled={
                        appliedFilters.priceRange[0] !== priceBounds[0]
                          ? true
                          : false
                      }
                      className={`w-full py-3 text-center rounded-xl cursor-pointer text-base transition-all font-medium
                    shadow-[0_3px_8px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_2px_rgba(0,0,0,0.3)_inset]
                    dark:shadow-[0_4px_12px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_3px_rgba(0,0,0,0.6)]
                    ${
                      appliedFilters.priceRange[0] !== priceBounds[0]
                        ? "bg-brand dark:bg-gold hover:opacity-80 text-background"
                        : "bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-900 dark:text-white"
                    }   ${
                        appliedFilters.priceRange[0] == priceBounds[0]
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }
                          text-[12px]
                      
                      `}
                    >
                      CLEAR
                    </button> */}
                    <button
                      onClick={(e) => {
                        // e.preventDefault();
                        // setAppliedFilters({
                        //   priceRange: [
                        //     appliedFilters.priceRange[0],
                        //     appliedFilters.priceRange[1],
                        //   ],
                        // })
                        setAppliedFilters({
                          priceRange: [
                            appliedFilters.priceRange[0],
                            appliedFilters.priceRange[1],
                          ],
                        });
                        SubmitToMap();
                        // SubmitToMap({
                        //   priceRange: [
                        //     appliedFilters.priceRange[0],
                        //     appliedFilters.priceRange[1],
                        //   ],
                        //       ${
                        //   localFilter.priceRange[0] !== priceBounds[0]
                        //     ? "bg-brand dark:bg-gold hover:opacity-80 text-background"
                        //     : "bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-900 dark:text-white"
                        // }
                        // });
                        // setAppliedFilters({ priceRange: priceBounds })
                      }}
                      className={`w-full py-3 text-center rounded-xl cursor-pointer text-base transition-all font-medium
                    shadow-[0_3px_8px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_2px_rgba(0,0,0,0.3)_inset]
                    dark:shadow-[0_4px_12px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_3px_rgba(0,0,0,0.6)]
                          text-[12px]
                    bg-brand dark:bg-gold hover:opacity-80 text-background
                    `}
                    >
                      APPLY
                    </button>
                  </div>

                  {/* </PopoverClose> */}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <button
              onClick={() => setIsFilterOpen(true, "price")}
              className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                  ${
                    appliedFilters.priceRange[0] !== priceBounds[0]
                      ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
                  }`}
            >
              <DollarSignIcon className="w-3.5 h-3.5" />
              {getPriceLabel()}
              <ChevronDownIcon className="h-3 w-3 opacity-80" />
            </button>
          )}

          {isDesktop ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`shrink-0 flex items-center gap-1 px-2 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                  ${
                    appliedFilters.seatSplit !== null
                      ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
                  }`}
                >
                  <ArmchairIcon className="w-3.5 h-3.5" />
                  {appliedFilters.seatSplit
                    ? `${appliedFilters.seatSplit} Seats`
                    : "Any Seats"}
                  <ChevronDownIcon className="h-3 w-3 opacity-80" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="w-80 p-0 overflow-hidden rounded-[2rem] shadow-xl border-neutral-200 dark:border-neutral-800"
                align="start"
              >
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium">
                      Seats Together
                    </h4>
                    <span className="text-[11px] text-neutral-500 font-normal">
                      {appliedFilters.seatSplit !== null
                        ? "Minimum grouping"
                        : "No preference"}
                    </span>
                  </div>

                  {/* Seat Picker */}
                  <div className="relative">
                    <div className="grid grid-cols-4 gap-3 no-scrollbar -mx-1 px-1 snap-x">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                        (n, idx: number) => {
                          const isSelected = appliedFilters.seatSplit === n;
                          // Visual logic: highlights everything up to the selected number
                          const isVisualRange =
                            appliedFilters.seatSplit !== null &&
                            n <= appliedFilters.seatSplit;

                          return (
                            <button
                              key={n}
                              onClick={() => {
                                const newValue = isSelected ? null : n;
                                setAppliedFilters({ quantity: idx + 1 });
                                setAppliedFilters({ seatSplit: newValue });
                                SubmitToMap();
                              }}
                              className={`relative shrink-0 h-12 w-12 rounded-2xl text-sm transition-all duration-300 border-2 snap-center cursor-pointer
                            ${
                              isSelected
                                ? "bg-brand border-gold text-white shadow-md z-10"
                                : // : isVisualRange
                                  // ? "bg-brand/80 border-gold text-white"
                                  "bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:bg-brand/30"
                            }`}
                            >
                              <span
                                className={
                                  isSelected ? "font-bold" : "font-normal"
                                }
                              >
                                {n}
                              </span>

                              {isSelected && (
                                <motion.div
                                  layoutId="seatCheck"
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center shadow-sm"
                                >
                                  <CheckIcon className="w-2.5 h-2.5 text-black" />
                                </motion.div>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Subtle Gradient to show scroll availability */}
                    {/* <div className="absolute left-0 right-0 bottom-4 h-8 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent pointer-events-none" /> */}
                  </div>

                  <button
                    onClick={() => {
                      setAppliedFilters({ quantity: 1 });
                      setAppliedFilters({ seatSplit: null });
                      // window?.Seatics?.MapComponent?.reset();

                      SubmitToMap();
                    }}
                    className={`w-full py-3 text-center rounded-xl cursor-pointer text-base transition-all font-medium
                              shadow-[0_3px_8px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_2px_rgba(0,0,0,0.3)_inset]
                    dark:shadow-[0_4px_12px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_3px_rgba(0,0,0,0.6)]
                    ${
                      appliedFilters.seatSplit === null
                        ? "bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-900 dark:text-white"
                        : "bg-brand dark:bg-gold hover:opacity-80 text-background"
                    }`}
                  >
                    Any
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <button
              onClick={() => setIsFilterOpen(true, "seats")}
              className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                  ${
                    appliedFilters.seatSplit !== null
                      ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
                  }`}
            >
              <ArmchairIcon className="w-3.5 h-3.5" />
              {appliedFilters.seatSplit
                ? `${appliedFilters.seatSplit} Seats`
                : "Any Seats"}
              <ChevronDownIcon className="h-3 w-3 opacity-80" />
            </button>
          )}

          {isDesktop ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`shrink-0 flex items-center gap-1 px-2 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                ${
                  appliedFilters.venueLevels.length > 0
                    ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
                }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate">
                    {getSectionLabel()}
                  </span>
                  <ChevronDownIcon className="h-3 w-3 opacity-80" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                className="w-80 p-0 overflow-hidden rounded-[2rem] shadow-xl border-neutral-200 dark:border-neutral-800"
                align="start"
              >
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium">
                      Sections
                    </h4>
                    <button
                      onClick={() => {
                        setAppliedFilters({ venueLevels: [] });
                        window?.Seatics?.MapComponent?.reset();
                      }}
                      disabled={appliedFilters.venueLevels.length === 0}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 h-6 min-w-[60px] justify-center
                      ${
                        appliedFilters.venueLevels.length > 0
                          ? "bg-brand/90 hover:bg-brand dark:bg-gold/90 dark:hover:bg-gold text-white hover:shadow-md cursor-pointer"
                          : "bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400 cursor-not-allowed"
                      }`}
                    >
                      {appliedFilters.venueLevels.length > 0
                        ? "Reset All"
                        : "0"}
                    </button>
                  </div>

                  {/* Sections Grid */}
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {sectionOptions.map((opt) => {
                      const isSelected = appliedFilters.venueLevels.includes(
                        opt.name
                      );
                      // Single-liner to prevent "Section Section" repetition
                      const displayName = opt.name
                        .toLowerCase()
                        .includes("section")
                        ? opt.name
                        : `${opt.name} Section`;

                      // console.log(opt);

                      return (
                        <button
                          key={opt.name}
                          onClick={() => {
                            handleToggle("venueLevels", opt.name);
                            SubmitToMap();
                          }}
                          // onMouseEnter={() => onVenueHover?.(opt, true)}
                          // onMouseLeave={() => onVenueHover?.(opt, false)}
                          className={`relative flex items-center gap-3 shrink-0 border-2 rounded-xl px-4 py-3 text-xs font-semibold text-left cursor-pointer transition-all ${
                            isSelected
                              ? "bg-brand border-gold text-white shadow-md"
                              : "bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:bg-brand/30"
                          }`}
                        >
                          {/* Dynamic Color Indicator from the object */}
                          <div
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-neutral-100 dark:border-neutral-800 dark:invert"
                            style={{ backgroundColor: opt.color }}
                          />

                          <span className="truncate">{displayName}</span>

                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center"
                            >
                              <CheckIcon className="w-3 h-3 text-black" />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <button
              onClick={() => setIsFilterOpen(true, "sections")}
              className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                ${
                  appliedFilters.venueLevels.length > 0
                    ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
                }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate">
                {getSectionLabel()}
              </span>
              <ChevronDownIcon className="h-3 w-3 opacity-80" />
            </button>
          )}

          {/* Price Toggle */}
          {/* <button
            onClick={() =>
              setAppliedFilters({
                sortOrder: currentSort === "asc" ? "desc" : "asc",
              })
            }
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer shrink-0
              ${
                isPriceActive
                  ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
              }`}
          >
            <DollarSignIcon className="w-3.5 h-3.5" />
            Price: {currentSort === "desc" ? "High" : "Low"}
            {currentSort === "desc" ? (
              <ArrowDownWideNarrowIcon className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpWideNarrowIcon className="w-3.5 h-3.5" />
            )}
          </button> */}

          {/* Row Toggle */}
          {/* <button
            onClick={() =>
              setAppliedFilters({
                sortOrder: currentSort === "row_asc" ? "row_desc" : "row_asc",
              })
            }
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer shrink-0
              ${
                isRowActive
                  ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                  : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
              }`}
          >
            <ListOrderedIcon className="w-3.5 h-3.5" />
            Row: {currentSort === "row_desc" ? "High" : "Low"}
            {currentSort === "row_desc" ? (
              <ArrowDownWideNarrowIcon className="w-3.5 h-3.5" />
            ) : (
              <ArrowUpWideNarrowIcon className="w-3.5 h-3.5" />
            )}
          </button> */}
        </div>
      </div>
    </div>
  );
}

// const find = () => (
//   <>
//     {/* Price sort */}
//     {/* {isDesktop ? ( */}
//     {false ? (
//       <Popover>
//         <PopoverTrigger asChild>
//           <button
//             className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
//                     ${
//                       isPriceActive || isRowActive
//                         ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
//                         : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
//                     }`}
//           >
//             <ArrowUpDownIcon className="w-3.5 h-3.5" />
//             <span className="max-w-[100px] truncate">{getSortLabel()}</span>
//             <ChevronDownIcon className="h-3 w-3 opacity-80" />
//           </button>
//         </PopoverTrigger>
//         <PopoverContent className="w-80 p-0 overflow-hidden rounded-[2rem] shadow-2xl border-brand/20 dark:border-gold/30 bg-white dark:bg-neutral-950/70 backdrop-blur-md">
//           {/* Your existing 4-button grid from modal - copy paste here */}
//           <div className="p-5 space-y-4">
//             <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium">
//               Sort Order
//             </h4>
//             <div className="grid grid-cols-2 gap-1.5">
//               {/* Price Low → Row Low */}
//               <button
//                 onClick={() => setAppliedFilters({ sortOrder: "asc" })}
//                 className={`flex justify-between items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
//                         ${
//                           currentSort === "asc"
//                             ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
//                             : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
//                         }`}
//               >
//                 <span className="inline-flex items-center gap-1">
//                   <DollarSignIcon className="w-3.5 h-3.5" />
//                   Price Low
//                 </span>
//                 <MoveDownIcon className="w-3.5 h-3.5" />
//               </button>

//               {/* Price High → Row Low */}
//               <button
//                 onClick={() => setAppliedFilters({ sortOrder: "desc" })}
//                 className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
//                         ${
//                           currentSort === "desc"
//                             ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
//                             : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
//                         }`}
//               >
//                 <span className="inline-flex items-center gap-1">
//                   <DollarSignIcon className="w-3.5 h-3.5" />
//                   Price High
//                 </span>
//                 <MoveUpIcon className="w-3.5 h-3.5" />
//               </button>

//               {/* Price Low → Row High */}
//               <button
//                 onClick={() => setAppliedFilters({ sortOrder: "row_asc" })}
//                 className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
//                         ${
//                           currentSort === "row_asc"
//                             ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
//                             : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
//                         }`}
//               >
//                 <span className="inline-flex items-center gap-1">
//                   <ListOrderedIcon className="w-3.5 h-3.5" />
//                   Row Low
//                 </span>
//                 <MoveDownIcon className="w-3.5 h-3.5" />
//               </button>

//               {/* Price High → Row High */}
//               <button
//                 onClick={() => setAppliedFilters({ sortOrder: "row_desc" })}
//                 className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
//                         ${
//                           currentSort === "row_desc"
//                             ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
//                             : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
//                         }`}
//               >
//                 <span className="inline-flex items-center gap-1">
//                   <ListOrderedIcon className="w-3.5 h-3.5" />
//                   Row High
//                 </span>
//                 <MoveUpIcon className="w-3.5 h-3.5" />
//               </button>
//             </div>
//           </div>
//         </PopoverContent>
//       </Popover>
//     ) : (
//       <button
//         onClick={() => setIsFilterOpen(true, "sort")}
//         className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
//                 ${
//                   isPriceActive || isRowActive
//                     ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
//                     : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-foreground/70"
//                 }`}
//       >
//         <ArrowUpDownIcon className="w-3.5 h-3.5" />
//         <span className="max-w-[100px] truncate">{getSortLabel()}</span>
//         <ChevronDownIcon className="h-3 w-3 opacity-80" />
//       </button>
//     )}
//   </>
// );

function HeaderSkeleton() {
  return (
    <div className="bg-red-600">
      {/* Top Status Bar */}
      <div className="px-4 py-2.5 bg-brand dark:bg-gradient-to-b from-gold to-gold-dark text-white dark:text-black flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-gold dark:bg-blue-400/40" />
            <div className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-b from-gold to-gold-dark dark:from-blue-400/70 dark:to-brand" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-4 pt-4 flex flex-col">
        {/* Header Row */}
        <div className="flex items-stretch justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            {/* Event Title */}
            <Skeleton className="h-7 w-4/5 md:h-8 md:w-3/4" />

            {/* Venue & Date */}
            <div className="flex flex-col md:flex-row md:flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-3.5 h-3.5 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-3.5 h-3.5 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            {/* Site Logos */}
            <div className="flex items-center gap-1 pt-1">
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-5 rounded-sm shadow-2xs" />
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col justify-start items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center justify-start gap-2 py-3 w-full overflow-x-auto no-scrollbar">
          {/* Filter Button with Badge */}
          <div className="relative shrink-0 flex items-center justify-center h-[38px] w-[38px] rounded-full bg-brand/10 dark:bg-gold/10 border-2 border-brand dark:border-gold">
            <Skeleton className="w-4 h-4 rounded-full mx-auto" />
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold">
              <Skeleton className="w-3 h-2 rounded-sm" />
            </div>
          </div>

          {/* Price Filter */}
          <div className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-full border-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-3 rounded-sm" />
          </div>

          {/* Seats Filter */}
          <div className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-full border-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-3 rounded-sm" />
          </div>

          {/* Sections Filter */}
          <div className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-full border-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <div className="flex gap-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-3 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
      <div className="text-4xl mb-4">🎫</div>
      <p className="">No tickets found</p>
      <p className="text-sm text-muted-foreground">
        Try adjusting your filters.
      </p>
    </div>
  );
}

export interface MapTicket {
  tgID: string;
  tgUserSec: string;
  tgUserRow: string;
  tgAllInPrice: string;
  tgNotes: string;
  tgColor?: string;
  splits?: string[];
  ticket_uuid: string;
  ticket_link: string;
  ticket_section_id: string;
}
