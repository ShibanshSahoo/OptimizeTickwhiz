import React, { useState, useEffect, createContext, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";

export const DrawerDragContext = createContext<any>(null);

interface MobileDrawerProps {
  children: React.ReactNode;
  checkoutMode?: boolean;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  children,
  checkoutMode,
}) => {
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 375
  );

  // 48px is the standard height for h-12 in Tailwind
  const HEADER_HEIGHT = 48;
  const SQUARE_AREA = windowWidth;

  // Define Snap Points based on screen height minus header
  const maxPx = windowHeight - HEADER_HEIGHT;
  const minPx = windowHeight - (HEADER_HEIGHT + SQUARE_AREA);
  const midPx = minPx + (maxPx - minPx) * 0.5; // Just the handle and a tiny bit of title

  const snapPoints = [minPx, midPx, maxPx];

  const height = useMotionValue(minPx);

  const lastSnapPoint = useRef(minPx);

  const updateSnapPoint = (newPoint: number) => {
    // Only update the "remembered" point if we are NOT in checkout mode
    if (!checkoutMode) {
      lastSnapPoint.current = newPoint;
    }
  };

  const cycleSnapPoints = () => {
    if (checkoutMode) return;

    const currentHeight = height.get();
    let nextPoint;

    // Logic: find where we are and move to next.
    // We use a small buffer (10px) to account for spring physics resting positions
    if (currentHeight <= minPx + 10) {
      nextPoint = midPx;
    } else if (currentHeight <= midPx + 10) {
      nextPoint = maxPx;
    } else {
      nextPoint = minPx;
    }

    animate(height, nextPoint, { type: "spring", stiffness: 300, damping: 30 });
  };

  useEffect(() => {
    if (checkoutMode) {
      animate(height, maxPx, { type: "spring", stiffness: 300, damping: 30 });
    } else {
      animate(height, lastSnapPoint.current, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  }, [checkoutMode, maxPx]);

  // Transition border radius: Square at top, rounded at bottom
  const borderRadius = useTransform(height, [minPx, maxPx], [12, 0]);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDrag = (_: any, info: PanInfo) => {
    // Current height + inverted delta
    const newHeight = height.get() - info.delta.y;
    // Clamp between minPx and the header touch point
    height.set(Math.max(minPx, Math.min(maxPx, newHeight)));
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const currentHeight = height.get();
    const velocity = info.velocity.y;

    let targetHeight: number;

    // Fast swipe logic
    if (velocity < -500) {
      targetHeight = snapPoints.find((p) => p > currentHeight + 10) || maxPx;
    } else if (velocity > 500) {
      targetHeight =
        [...snapPoints].reverse().find((p) => p < currentHeight - 10) || minPx;
    } else {
      // Find closest snap point
      targetHeight = snapPoints.reduce((prev, curr) =>
        Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight)
          ? curr
          : prev
      );
    }

    animate(height, targetHeight, {
      type: "spring",
      stiffness: 400,
      damping: 40,
      restDelta: 0.5,
    });

    updateSnapPoint(targetHeight);
  };

  const dragProps = {
    drag: "y" as const,
    dragConstraints: { top: 0, bottom: 0 },
    dragElastic: 0, // Set to 0 so it doesn't go ABOVE the header during drag
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  };

  return (
    <motion.div
      style={{
        height,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        touchAction: "none",
        // Force the bottom to stay fixed
        bottom: 0,
      }}
      className="fixed left-0 right-0 z-40 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
    >
      <DrawerDragContext.Provider value={dragProps}>
        {/* Drag handle area - Made larger for better touch target */}
        {/* <motion.div
          {...dragProps}
          className="shrink-0 py-1 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center bg-brand dark:bg-gold"
        >
          <div className="w-10 h-1.5 bg-white dark:bg-neutral-800 rounded-full" />
        </motion.div> */}
        {!checkoutMode && (
          <div
            onClick={cycleSnapPoints}
            className="shrink-0 py-1 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center bg-brand dark:bg-gold"
          >
            <div className="w-12 h-1 bg-white dark:bg-neutral-800 rounded-full" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto md:overflow-visible">
          {children}
        </div>
      </DrawerDragContext.Provider>
    </motion.div>
  );
};

export default MobileDrawer;
