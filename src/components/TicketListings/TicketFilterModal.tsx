import { useTicketStore } from "@/store/ticketStore";
import { motion, PanInfo, useDragControls } from "framer-motion";
import {
  CheckIcon,
  DollarSignIcon,
  MoveDownIcon,
  MoveUpIcon,
  RotateCcwIcon,
  Sparkles,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ListOrdered,
} from "lucide-react";

interface AppliedFilters {
  priceRange: [number, number];
  venueLevels: string[];
  seatSplit: number | null;
  sections?: string[];
  sortOrder:
    | "asc"
    | "desc"
    | "section_asc"
    | "row_asc"
    | "row_desc"
    | "level_asc";
  quantity: number;
  whizDealsOnly: boolean;
}

export function TicketFilterModal({ onReset }: { onReset: () => void }) {
  const controls = useDragControls();

  const {
    isFilterOpen,
    setIsFilterOpen,
    activeFilterSection,
    sectionOptions,
    priceHistogram,
    priceBounds,
    appliedFilters,
    ticketModalFilters,
    // setTicketModalFilters,
    setTicketModalFilters,
    setAppliedFilters,
    SubmitToMap,
    // setTicketModalFilters,
    resetTicketsFilters,
    resetFilters,
    getTicketCounts,
  } = useTicketStore();

  const counts = getTicketCounts();
  const maxVal = Math.max(...priceHistogram, 1);
  const currentSort = ticketModalFilters.sortOrder;

  const [exitAnimating, setExitAnimating] = useState(false);
  const [frozenActiveSection, setFrozenActiveSection] =
    useState(activeFilterSection);

  // Sorting Toggle Logic
  const isPriceActive = currentSort === "asc" || currentSort === "desc";
  const isRowActive = currentSort === "row_asc" || currentSort === "row_desc";

  // const [localFilter, setTicketModalFilters] = useState<any>({ ...appliedFilters });

  // useEffect(() => {
  //   setTicketModalFilters({ priceRange: priceBounds });
  // }, []);

  const histogramData = useMemo(() => {
    const [minBound, maxBound] = priceBounds;
    return priceHistogram.map((count, i) => {
      const bucketPrice = minBound + (i * (maxBound - minBound)) / 20;
      return {
        count,
        price: Math.round(bucketPrice),
        isActive:
          bucketPrice >= ticketModalFilters.priceRange[0] &&
          bucketPrice <= ticketModalFilters.priceRange[1],
      };
    });
  }, [
    priceHistogram,
    priceBounds,
    ticketModalFilters.priceRange,
    ticketModalFilters.priceRange,
  ]);

  // Compact Toggle Handlers
  const handleToggle = (key: "venueLevels" | "seatSplit", value: any) => {
    const current = ticketModalFilters[key] as any[];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    setTicketModalFilters({ [key]: next });
  };

  useEffect(() => {
    if (priceBounds[0] !== 0 && ticketModalFilters.priceRange[0] === 0) {
      setTicketModalFilters({
        priceRange: priceBounds,
      });
    }
  }, [priceBounds, ticketModalFilters.priceRange, setTicketModalFilters]);

  useEffect(() => {
    if (isFilterOpen && !exitAnimating) {
      setFrozenActiveSection(activeFilterSection);
    }
  }, [isFilterOpen, activeFilterSection, exitAnimating]);

  const onClose = () => {
    //  alert("in");
    setExitAnimating(true);
    setIsFilterOpen(false);
    setAppliedFilters(ticketModalFilters);
    SubmitToMap();
  };

  const onDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) onClose();
  };

  // if (!isFilterOpen) return null;

  const showAll = frozenActiveSection === null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 ">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <motion.div
        drag={exitAnimating ? false : "y"}
        dragControls={controls}
        dragListener={!exitAnimating}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ bottom: 0.6, top: 0.1 }}
        onDragEnd={onDragEnd}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
          duration: 0.15,
        }}
        className="relative z-[101] w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800 h-fit max-h-[90vh]"
      >
        {/* Compact Header */}
        <div
          onPointerDown={(e) => controls.start(e)}
          className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing"
        >
          <div className="h-1 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        </div>

        {/* 2. Title/Close Layer (Below the handle) */}
        {/* <div className="flex items-center justify-between px-6 pb-2">
          <h3 className="text-lg font-bold">Filters</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div> */}

        <div className="relative px-6 pb-6 overflow-y-auto space-y-6">
          {(showAll || !frozenActiveSection) && (
            <>
              {/* <DualToneProgressBar counts={counts} /> */}
              {/* <section className="space-y-4">
                <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest">
                  Sort & Preference
                </h4>
                <div className="flex justify-center flex-wrap items-center gap-1.5">
                  <button
                    onClick={() =>
                      setTicketModalFilters({
                        whizDealsOnly: !ticketModalFilters.whizDealsOnly,
                      })
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-xs font-medium cursor-pointer
                  ${
                    ticketModalFilters.whizDealsOnly
                      ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                  }`}
                  >
                    Whiz Deals
                  </button>

                  <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />

                  <button
                    onClick={() =>
                      setTicketModalFilters({
                        sortOrder: currentSort === "asc" ? "desc" : "asc",
                      })
                    }
                    className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                  ${
                    isPriceActive
                      ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                  }`}
                  >
                    <DollarSignIcon className="w-3.5 h-3.5" />
                    Price: {currentSort === "desc" ? "High" : "Low"}
                    {currentSort === "desc" ? (
                      <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpWideNarrow className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setTicketModalFilters({
                        sortOrder:
                          currentSort === "row_asc" ? "row_desc" : "row_asc",
                      })
                    }
                    className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                  ${
                    isRowActive
                      ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                  }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    Row: {currentSort === "row_desc" ? "High" : "Low"}
                    {currentSort === "row_desc" ? (
                      <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpWideNarrow className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </section> */}
            </>
          )}
          {(showAll || frozenActiveSection === "sort") && (
            <section className="space-y-4">
              <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest">
                Sort Order
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                {/* 1. Price Low → Row Low */}
                <button
                  onClick={() => setTicketModalFilters({ sortOrder: "asc" })}
                  className={`flex justify-between items-center gap-1 px-4 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                    ${
                      currentSort === "asc"
                        ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                    }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <DollarSignIcon className="inline w-3.5 h-3.5" />
                    Price Asc
                  </span>
                  <MoveDownIcon className="w-3.5 h-3.5" />
                </button>

                {/* 2. Price High → Row Low */}
                <button
                  onClick={() => setTicketModalFilters({ sortOrder: "desc" })}
                  className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                      ${
                        currentSort === "desc"
                          ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                      }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <DollarSignIcon className="inline w-3.5 h-3.5" />
                    Price Desc
                  </span>
                  <MoveUpIcon className="w-3.5 h-3.5" />
                </button>

                {/* 3. Price Low → Row High */}
                <button
                  onClick={() =>
                    setTicketModalFilters({ sortOrder: "row_asc" })
                  }
                  className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                      ${
                        currentSort === "row_asc"
                          ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                      }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <ListOrdered className="inline w-3.5 h-3.5" />
                    Row Asc
                  </span>
                  <MoveDownIcon className="w-3.5 h-3.5" />
                </button>

                {/* 4. Price High → Row High */}
                <button
                  onClick={() =>
                    setTicketModalFilters({ sortOrder: "row_desc" })
                  }
                  className={`flex justify-between items-center gap-1 px-3 py-2 rounded-full transition-all border-2 text-xs font-medium cursor-pointer
                      ${
                        currentSort === "row_desc"
                          ? "bg-brand/10 dark:bg-gold/10 border-brand dark:border-gold text-brand dark:text-gold"
                          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500"
                      }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <ListOrdered className="inline w-3.5 h-3.5" />
                    Row Desc
                  </span>
                  <MoveUpIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          )}

          {(showAll || frozenActiveSection === "price") && (
            <section id="filter-price" className="space-y-2 mb-[30px]">
              <div className="flex justify-between items-end mb-4">
                <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest">
                  Price Range
                </h4>
                <span className="text-xs text-brand dark:text-gold font-medium">
                  ${ticketModalFilters.priceRange[0]} — $
                  {ticketModalFilters.priceRange[1]}
                </span>
              </div>

              <div className="flex items-end gap-[1px] h-14 px-1">
                {histogramData.map(({ count, isActive, price }, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all duration-300 group relative ${
                      isActive
                        ? "bg-brand dark:bg-gold opacity-100 shadow-sm hover:shadow-md"
                        : "bg-neutral-200 dark:bg-neutral-700 opacity-40 group-hover:opacity-60"
                    }`}
                    style={{
                      height: `${Math.max((count / maxVal) * 100, 4)}%`,
                    }}
                    title={`$${price}: ${count} tickets`}
                  >
                    {/* Price labels on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${price}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative h-6 flex items-center">
                <div className="absolute w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                <div
                  className="absolute h-1 bg-brand dark:bg-gold rounded-full transition-all z-10"
                  style={{
                    left: `${
                      ((ticketModalFilters.priceRange[0] - priceBounds[0]) /
                        (priceBounds[1] - priceBounds[0])) *
                      100
                    }%`,
                    right: `${
                      100 -
                      ((ticketModalFilters.priceRange[1] - priceBounds[0]) /
                        (priceBounds[1] - priceBounds[0])) *
                        100
                    }%`,
                  }}
                />
                {/* Min Slider */}
                <input
                  type="range"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  value={appliedFilters.priceRange[0]}
                  onChange={(e) => {
                    const val = Math.min(
                      +e.target.value,
                      ticketModalFilters.priceRange[1] - 1
                    );
                    setTicketModalFilters({
                      priceRange: [val, ticketModalFilters.priceRange[1]],
                    });
                  }}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                />
                {/* Max Slider */}
                <input
                  type="range"
                  // min={
                  //   ticketModalFilters.priceRange[0] > priceBounds[0]
                  //     ? priceBounds[0]
                  //     : ticketModalFilters.priceRange[0]
                  // }
                  // max={
                  //   ticketModalFilters.priceRange[1] < priceBounds[1]
                  //     ? priceBounds[1]
                  //     : ticketModalFilters.priceRange[1]
                  // }
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  value={appliedFilters.priceRange[1]}
                  onChange={(e) => {
                    const val = Math.max(
                      +e.target.value,
                      ticketModalFilters.priceRange[0] + 1
                    );
                    setTicketModalFilters({
                      priceRange: [ticketModalFilters.priceRange[0], val],
                    });
                  }}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gold [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing"
                />
              </div>

              <div className="w-full h-[40px] flex items-center justify-between gap-[10px]">
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
                      value={ticketModalFilters.priceRange[0]}
                      onChange={
                        (e) =>
                          setTicketModalFilters({
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
                      value={ticketModalFilters.priceRange[1]}
                      onChange={
                        (e) =>
                          setTicketModalFilters({
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
            </section>
          )}

          {/* 3. Seat Splits - Chips (More compact) */}
          {(showAll || frozenActiveSection === "seats") && (
            <section id="filter-seats" className="space-y-3">
              <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest">
                Seats Together
              </h4>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 no-scrollbar -mx-1 px-1 snap-x">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                  (n, idx: number) => {
                    const isSelected = ticketModalFilters.seatSplit === n;
                    // Visual logic: highlights everything up to the selected number
                    const isVisualRange =
                      ticketModalFilters.seatSplit !== null &&
                      n <= ticketModalFilters.seatSplit;
                    return (
                      <div className="w-full h-full flex justify-center">
                        <button
                          key={n}
                          onClick={() => {
                            const newValue = isSelected ? null : n;
                            setTicketModalFilters({ seatSplit: newValue });
                            setTicketModalFilters({ quantity: idx + 1 });
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
                            className={isSelected ? "font-bold" : "font-normal"}
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
                      </div>
                    );
                  }
                )}
              </div>
              <button
                onClick={() => {
                  setTicketModalFilters({ seatSplit: null });
                  setTicketModalFilters({ quantity: 1 });
                }}
                className={`w-full py-2 text-center rounded-xl cursor-pointer text-sm transition-all border-2
                ${
                  ticketModalFilters.seatSplit === null
                    ? "bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-500"
                    : "bg-brand dark:bg-gold hover:opacity-80 text-background"
                }`}
              >
                Any
              </button>
            </section>
          )}

          {/* 4. Venue Levels - List View with minimal styling */}
          {(showAll || frozenActiveSection === "sections") && (
            <section id="filter-sections" className="space-y-3">
              <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest">
                Sections
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {sectionOptions.map((opt) => {
                  const isSelected = ticketModalFilters.venueLevels.includes(
                    opt.name
                  );
                  // Single-liner to prevent "Section Section" repetition
                  const displayName = opt.name.toLowerCase().includes("section")
                    ? opt.name
                    : `${opt.name} Section`;

                  return (
                    <button
                      key={opt.name}
                      onClick={() => handleToggle("venueLevels", opt.name)}
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
            </section>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-2 pl-5 pr-3 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              setExitAnimating(true);
              setIsFilterOpen(false);
              resetFilters();
              resetTicketsFilters();
              onReset();
              if (
                typeof window !== "undefined" &&
                window.Seatics?.MapComponent
              ) {
                window.Seatics.MapComponent.legend?.dropDown?.deSelectAll?.();
                window.Seatics.MapComponent.setFilterOptions(
                  new window.Seatics.FilterOptions()
                );
              }
              // SubmitToMap();
            }}
            className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-wider"
          >
            <RotateCcwIcon className="w-3.5 h-3.5" />
            Clear All
          </button>

          <button
            onClick={onClose}
            className="px-10 py-3.5 bg-brand text-background dark:bg-gold rounded-2xl text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-neutral-200 dark:shadow-none"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const DualToneProgressBar = ({ counts }) => {
  const [hovered, setHovered] = useState(null); // 'standard' or 'whiz'

  const totalMax = Math.max(counts.totalAll, 1);
  const filteredTotal = counts.filteredAll;

  const filteredWhiz = counts.filteredWhiz;
  const filteredStandard = Math.max(0, counts.filteredAll - filteredWhiz);

  const activeWidthPercent = (filteredTotal / totalMax) * 100;

  const standardInnerPercent =
    (filteredStandard / Math.max(filteredTotal, 1)) * 100;
  const whizInnerPercent = (filteredWhiz / Math.max(filteredTotal, 1)) * 100;

  return (
    <div className="w-full pt-12 pb-4">
      <div className="relative h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-visible">
        <div
          className="absolute  inset-y-0 left-0 flex transition-all duration-500 ease-out rounded-full overflow-hidden"
          style={{ width: `${activeWidthPercent}%` }}
        >
          {/* Standard Portion */}
          <div
            onMouseEnter={() => setHovered("standard")}
            onMouseLeave={() => setHovered(null)}
            className={`h-full transition-all duration-300 cursor-pointer bg-brand/30 dark:bg-gold-dark
              ${hovered === "whiz" ? "saturate-0 opacity-30" : "saturate-100"}`}
            style={{ width: `${standardInnerPercent}%` }}
          />

          {/* Whiz Portion */}
          <div
            onMouseEnter={() => setHovered("whiz")}
            onMouseLeave={() => setHovered(null)}
            className={`h-full transition-all duration-300 cursor-pointer bg-brand dark:bg-gold
              ${
                hovered === "standard"
                  ? "saturate-0 opacity-30"
                  : "saturate-100"
              }`}
            style={{ width: `${whizInnerPercent}%` }}
          />
        </div>

        {/* FLOATING NUMBERS & LABELS */}

        {/* Left Label (Standard) */}
        <div className="absolute -top-9 left-0 transition-opacity duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-wider opacity-60 text-brand dark:text-gold-dark uppercase leading-none">
              Standard
            </span>
            <span className="text-base text-brand dark:text-gold-dark">
              {filteredStandard}
            </span>
          </div>
        </div>

        {/* Right Label (Whiz) */}
        <div className="absolute -top-9 right-0 transition-opacity duration-300 text-right">
          <div className="flex flex-col items-end">
            <span className="text-[10px] tracking-wider opacity-60 text-brand dark:text-gold uppercase leading-none">
              Whiz
            </span>
            <span className="text-base  text-brand dark:text-gold">
              {filteredWhiz}
            </span>
          </div>
        </div>

        {/* Total Indicator (at the very end of the grey bar) */}
        <div className="absolute -bottom-6 right-0">
          <span className="text-[10px] text-neutral-400 font-medium">
            Total: {counts.totalAll}
          </span>
        </div>
      </div>
    </div>
  );
};
