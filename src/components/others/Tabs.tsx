import { useEffect, useRef, useState } from "react";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  ariaLabel?: string;
};

const TAB_SCROLL_AMOUNT = 160;

export const Tabs = ({ tabs, activeTab, onChange, ariaLabel }: Props) => {
  const tabListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = tabListRef.current;
    if (!el) {
      return;
    }
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  const scrollTabs = (direction: "left" | "right") => {
    tabListRef.current?.scrollBy({
      left: direction === "left" ? -TAB_SCROLL_AMOUNT : TAB_SCROLL_AMOUNT,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateScrollState();
    const el = tabListRef.current;
    if (!el) {
      return;
    }
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [tabs.join(",")]);

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => scrollTabs("left")}
        disabled={!canScrollLeft}
        aria-label="Show previous tabs"
        className="min-h-11 min-w-11 shrink-0 flex items-center justify-center rounded-full
          text-secondary dark:text-secondary-200
          hover:bg-gray-50 dark:hover:bg-gray-800
          disabled:opacity-30 disabled:pointer-events-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>

      <div
        ref={tabListRef}
        role="tablist"
        aria-label={ariaLabel}
        className="flex overflow-x-auto scroll-smooth
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab)}
              className={`min-h-11 shrink-0 px-4 -mb-px border-b-2 text-sm font-medium whitespace-nowrap
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset
                ${
                  isActive
                    ? "border-primary text-primary dark:text-primary-300 font-semibold"
                    : "border-transparent text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollTabs("right")}
        disabled={!canScrollRight}
        aria-label="Show next tabs"
        className="min-h-11 min-w-11 shrink-0 flex items-center justify-center rounded-full
          text-secondary dark:text-secondary-200
          hover:bg-gray-50 dark:hover:bg-gray-800
          disabled:opacity-30 disabled:pointer-events-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </div>
  );
};
