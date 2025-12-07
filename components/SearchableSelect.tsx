"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

type SearchableSelectOption = {
  value: string | number;
  label: string;
  searchText?: string;
  [key: string]: any;
};

type SearchableSelectProps = {
  options?: SearchableSelectOption[];
  value?: string | number | null;
  onChange?: (value: string | number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
  renderOption?: (option: SearchableSelectOption) => React.ReactNode;
  onCreateNew?: () => void;
  emptyMessage?: string;
  dropdownMaxHeight?: string;
  inputId?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  // دعم البحث الديناميكي
  onSearch?: (searchTerm: string) => Promise<SearchableSelectOption[]>;
  defaultOptions?: SearchableSelectOption[];
  isLoading?: boolean;
  searchDebounceMs?: number;
  // callback يتم استدعاؤه بعد اختيار العنصر (للاستخدام في الانتقال للحقل التالي)
  onSelectComplete?: () => void;
  // دعم التحميل التدريجي (Infinite Scroll)
  onLoadMore?: (
    page: number,
    searchTerm: string,
  ) => Promise<SearchableSelectOption[]>;
  hasMore?: boolean;
};

/**
 * مكون قائمة منسدلة موحدة قابلة للبحث
 *
 * @param {Object} props
 * @param {Array} props.options - مصفوفة الخيارات [{value: '', label: '', ...}]
 * @param {string|number} props.value - القيمة المحددة حالياً
 * @param {Function} props.onChange - دالة التغيير (value) => void
 * @param {string} props.placeholder - النص الافتراضي
 * @param {string} props.searchPlaceholder - نص البحث
 * @param {boolean} props.disabled - تعطيل القائمة
 * @param {string} props.className - كلاسات إضافية
 * @param {string} props.error - رسالة الخطأ
 * @param {boolean} props.required - حقل مطلوب
 * @param {Function} props.renderOption - دالة تخصيص عرض الخيار
 * @param {Function} props.onCreateNew - دالة إنشاء عنصر جديد (اختياري)
 */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  disabled = false,
  className = "",
  error = "",
  required = false,
  renderOption,
  onCreateNew,
  emptyMessage = "لا توجد نتائج",
  dropdownMaxHeight = "max-h-60",
  inputId,
  onKeyDown,
  onSearch,
  defaultOptions = [],
  isLoading: externalIsLoading = false,
  searchDebounceMs = 300,
  onSelectComplete,
  onLoadMore,
  hasMore = false,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadedOptions, setLoadedOptions] = useState<SearchableSelectOption[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(hasMore ?? false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  // حساب موضع القائمة المنسدلة
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest('[role="listbox"]')
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // تركيز على البحث عند فتح القائمة
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // دمج الخيارات: options (ثابتة) + loadedOptions (من البحث الديناميكي)
  const allOptions = useMemo(() => {
    if (onSearch) {
      // إذا كان هناك بحث ديناميكي، نستخدم loadedOptions + defaultOptions
      const combined = [...defaultOptions, ...loadedOptions];
      // إزالة التكرارات بناءً على value
      const unique = combined.filter(
        (opt, index, self) =>
          index === self.findIndex((o) => o.value === opt.value),
      );

      // إذا كانت هناك قيمة محددة لكنها غير موجودة في الخيارات، نضيفها
      if (
        value !== null &&
        value !== undefined &&
        !unique.find((opt) => opt.value === value)
      ) {
        // نحاول إنشاء option من القيمة المحددة
        unique.push({
          value: value,
          label: String(value),
        });
      }

      return unique;
    }

    return options;
  }, [options, loadedOptions, defaultOptions, onSearch, value]);

  // الحصول على العنصر المحدد
  const selectedOption = allOptions.find((opt) => opt.value === value);

  // البحث الديناميكي مع debounce
  useEffect(() => {
    if (!onSearch || !isOpen) {
      return;
    }

    // إلغاء timer السابق
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    // إذا كان البحث فارغاً، نحمل أول صفحة (عند فتح القائمة)
    if (!searchTerm.trim()) {
      setIsLoading(true);
      setCurrentPage(1);
      onSearch("")
        .then((results) => {
          setLoadedOptions(Array.isArray(results) ? results : []);
          // الاعتماد على hasMore prop الذي يتم تحديثه من handleItemSearch
          setHasMorePages(hasMore ?? true);
        })
        .catch((error) => {
          console.error("Error in onSearch:", error);
          setLoadedOptions([]);
          setHasMorePages(false);
        })
        .finally(() => {
          setIsLoading(false);
        });

      return;
    }

    // إنشاء timer جديد للبحث
    setIsLoading(true);
    searchDebounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await onSearch(searchTerm.trim());

        setLoadedOptions(Array.isArray(results) ? results : []);
        setCurrentPage(1); // إعادة تعيين الصفحة عند البحث الجديد
        // الاعتماد على hasMore prop الذي يتم تحديثه من handleItemSearch
        setHasMorePages(hasMore ?? true);
      } catch (error) {
        console.error("Error in onSearch:", error);
        setLoadedOptions([]);
        setHasMorePages(false);
      } finally {
        setIsLoading(false);
        searchDebounceTimerRef.current = null;
      }
    }, searchDebounceMs);

    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, [searchTerm, isOpen, onSearch, searchDebounceMs]);

  // إعادة تعيين loadedOptions عند إغلاق القائمة
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setLoadedOptions([]);
      setCurrentPage(1);
    }
  }, [isOpen]);

  // تحديث hasMorePages عند تغيير prop hasMore
  useEffect(() => {
    setHasMorePages(hasMore ?? false);
  }, [hasMore]);

  // Infinite Scroll: تحميل المزيد عند الوصول لنهاية القائمة
  useEffect(() => {
    if (!isOpen || !onLoadMore || !hasMorePages || isLoadingMore) return;

    const optionsList = optionsListRef.current;

    if (!optionsList) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = optionsList;
      // عند الوصول لـ 80% من القائمة، نحمل المزيد
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage >= 0.8 && !isLoadingMore) {
        setIsLoadingMore(true);
        const nextPage = currentPage + 1;

        onLoadMore(nextPage, searchTerm.trim())
          .then((newOptions) => {
            if (newOptions && newOptions.length > 0) {
              setLoadedOptions((prev) => [...prev, ...newOptions]);
              setCurrentPage(nextPage);
              // الاعتماد على hasMore prop الذي يتم تحديثه من handleLoadMoreItems
              // لا نتحقق من length لأن API قد يرجع أقل من 20
            } else {
              // إذا لم تكن هناك نتائج، لا توجد صفحات إضافية
              setHasMorePages(false);
            }
          })
          .catch((error) => {
            console.error("Error loading more options:", error);
            setHasMorePages(false);
          })
          .finally(() => {
            setIsLoadingMore(false);
          });
      }
    };

    optionsList.addEventListener("scroll", handleScroll);

    return () => {
      optionsList.removeEventListener("scroll", handleScroll);
    };
  }, [
    isOpen,
    onLoadMore,
    hasMorePages,
    currentPage,
    searchTerm,
    isLoadingMore,
  ]);

  // تصفية الخيارات بناءً على البحث
  const filteredOptions = useMemo(() => {
    if (onSearch) {
      // إذا كان هناك بحث ديناميكي
      if (!searchTerm.trim()) {
        // إذا كان البحث فارغاً، نعرض defaultOptions فقط
        return defaultOptions.length > 0 ? defaultOptions : [];
      }
      // إذا كان هناك بحث، نعرض loadedOptions (التي تم البحث عنها)
      if (isLoading) {
        // إذا كان البحث قيد التحميل، نعرض defaultOptions فقط
        return defaultOptions;
      }

      // نعرض loadedOptions فقط (النتائج من البحث)
      // لا ندمج مع defaultOptions لأن البحث يجب أن يعرض النتائج المطابقة فقط
      return loadedOptions.length > 0 ? loadedOptions : [];
    }
    // للخيارات الثابتة، نطبق التصفية
    if (!searchTerm) return allOptions;
    const searchLower = searchTerm.toLowerCase();

    return allOptions.filter((option) => {
      return (
        option.label?.toLowerCase().includes(searchLower) ||
        option.searchText?.toLowerCase().includes(searchLower)
      );
    });
  }, [
    allOptions,
    searchTerm,
    onSearch,
    defaultOptions,
    loadedOptions,
    isLoading,
  ]);

  const handleSelect = (optionValue: string | number) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm("");

    // استدعاء callback بعد اختيار العنصر (للاستخدام في الانتقال للحقل التالي)
    if (onSelectComplete) {
      setTimeout(() => {
        onSelectComplete();
      }, 50);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
    setSearchTerm("");
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "F4") {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }

      return;
    }

    if (e.key === "Enter") {
      if (isOpen) {
        // إذا كانت القائمة مفتوحة، نغلقها
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);

        return;
      }

      // إذا كانت القائمة مغلقة
      if (!value) {
        // إذا كان فارغاً، نفتح القائمة
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          setIsOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }

        return;
      }

      // إذا كان له قيمة، نسمح بالانتقال للحقل التالي
      // (سيتم التعامل معه في onKeyDown)
      if (onKeyDown) {
        onKeyDown(e);
      }

      return;
    }

    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);

      return;
    }

    // تمرير الأحداث الأخرى إلى onKeyDown
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();

      // الانتقال للعنصر الأول في القائمة (بما أن القائمة في Portal)
      const listboxId = inputId ? `searchable-select-listbox-${inputId}` : null;
      const listbox = listboxId
        ? document.getElementById(listboxId)
        : document.querySelector('[role="listbox"]');

      if (listbox) {
        const firstOption = listbox.querySelector(
          '[role="option"]:first-child',
        ) as HTMLElement;

        if (firstOption) {
          firstOption.focus();
          // تمرير تلقائي لإظهار العنصر
          firstOption.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }

      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();

      // الانتقال للعنصر الأخير في القائمة
      const listboxId = inputId ? `searchable-select-listbox-${inputId}` : null;
      const listbox = listboxId
        ? document.getElementById(listboxId)
        : document.querySelector('[role="listbox"]');

      if (listbox) {
        const options = listbox.querySelectorAll(
          '[role="option"]',
        ) as NodeListOf<HTMLElement>;

        if (options.length > 0) {
          const lastOption = options[options.length - 1];

          lastOption.focus();
          // تمرير تلقائي لإظهار العنصر
          lastOption.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }

      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      if (filteredOptions.length > 0) {
        // الانتقال للعنصر الأول
        const listboxId = inputId
          ? `searchable-select-listbox-${inputId}`
          : null;
        const listbox = listboxId
          ? document.getElementById(listboxId)
          : document.querySelector('[role="listbox"]');

        if (listbox) {
          const firstOption = listbox.querySelector(
            '[role="option"]:first-child',
          ) as HTMLElement;

          if (firstOption) {
            firstOption.focus();
            firstOption.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }
        }
      } else {
        // إذا لم تكن هناك نتائج، نغلق القائمة
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent,
    optionValue: string | number,
    index: number,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      handleSelect(optionValue);

      // onSelectComplete سيتم استدعاؤه من handleSelect
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();

      // الحصول على جميع العناصر من Portal
      const listboxId = inputId ? `searchable-select-listbox-${inputId}` : null;
      const listbox = listboxId
        ? document.getElementById(listboxId)
        : document.querySelector('[role="listbox"]');

      if (!listbox) return;

      const options = listbox.querySelectorAll(
        '[role="option"]',
      ) as NodeListOf<HTMLElement>;

      if (options.length === 0) return;

      // التنقل الدائري: الانتقال للعنصر التالي أو الأول
      const nextIndex = index < options.length - 1 ? index + 1 : 0;
      const nextOption = options[nextIndex];

      if (nextOption) {
        nextOption.focus();
        // تمرير تلقائي لإظهار العنصر
        nextOption.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();

      // الحصول على جميع العناصر من Portal
      const listboxId = inputId ? `searchable-select-listbox-${inputId}` : null;
      const listbox = listboxId
        ? document.getElementById(listboxId)
        : document.querySelector('[role="listbox"]');

      if (!listbox) return;

      const options = listbox.querySelectorAll(
        '[role="option"]',
      ) as NodeListOf<HTMLElement>;

      if (options.length === 0) return;

      // التنقل الدائري: الانتقال للعنصر السابق أو الأخير
      const prevIndex = index > 0 ? index - 1 : options.length - 1;
      const prevOption = options[prevIndex];

      if (prevOption) {
        prevOption.focus();
        // تمرير تلقائي لإظهار العنصر
        prevOption.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      {/* زر القائمة */}
      <button
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`searchable-select-listbox-${inputId || "default"}`}
        className={clsx(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          error && "border-red-500 focus:ring-red-500",
          isOpen && "ring-2 ring-ring ring-offset-2",
        )}
        disabled={disabled}
        id={inputId}
        role="combobox"
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleButtonKeyDown}
      >
        <span
          className={clsx(
            "truncate",
            !selectedOption && "text-muted-foreground",
          )}
        >
          {selectedOption?.label || placeholder}
          {required && !selectedOption && (
            <span className="text-red-500 mr-1">*</span>
          )}
        </span>

        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <XMarkIcon
              className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDownIcon
            className={clsx(
              "h-4 w-4 text-gray-400 transition-transform",
              isOpen && "transform rotate-180",
            )}
          />
        </div>
      </button>

      {/* رسالة الخطأ */}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {/* القائمة المنسدلة - استخدام Portal لتجنب مشاكل overflow */}
      {isOpen &&
        dropdownPosition &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999] rounded-md border border-gray-200 bg-white shadow-lg animate-in fade-in zoom-in-95"
            id={`searchable-select-listbox-${inputId || "default"}`}
            role="listbox"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {/* حقل البحث */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  className="w-full h-9 pr-9 pl-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={searchPlaceholder}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchTerm && (
                  <button
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* قائمة الخيارات */}
            <div
              ref={optionsListRef}
              className={clsx(dropdownMaxHeight, "overflow-y-auto py-1")}
            >
              {isLoading || externalIsLoading ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  جاري البحث...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                  {emptyMessage}
                </div>
              ) : (
                <>
                  {/* عرض جميع النتائج - لا يوجد حد */}
                  {filteredOptions.map((option, index) => (
                    <button
                      key={`${option.value}-${index}`} // استخدام index أيضاً لتجنب مشاكل key
                      aria-selected={option.value === value}
                      className={clsx(
                        "w-full px-3 py-2 text-right text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50",
                        option.value === value &&
                          "bg-blue-50 text-blue-700 font-medium",
                      )}
                      data-index={index}
                      role="option"
                      tabIndex={0}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      onKeyDown={(e) =>
                        handleOptionKeyDown(e, option.value, index)
                      }
                    >
                      {renderOption ? renderOption(option) : option.label}
                    </button>
                  ))}
                  {/* مؤشر التحميل عند التمرير */}
                  {isLoadingMore && hasMorePages && (
                    <div className="px-3 py-2 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      جاري تحميل المزيد...
                    </div>
                  )}
                  {/* عرض عدد النتائج */}
                  {filteredOptions.length > 0 && (
                    <div className="px-3 py-2 text-center text-xs text-gray-400 border-t border-gray-100">
                      عرض {filteredOptions.length} نتيجة
                    </div>
                  )}
                </>
              )}
            </div>

            {/* زر إنشاء جديد (اختياري) */}
            {onCreateNew && (
              <div className="p-2 border-t border-gray-100">
                <button
                  className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center justify-center gap-2"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCreateNew();
                    setIsOpen(false);
                  }}
                >
                  <span className="text-lg">+</span>
                  إضافة جديد
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default SearchableSelect;
