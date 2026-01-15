"use client";

import type {
  InvoiceItemTableHandle,
  InvoiceItemTableProps,
} from "@/app/[locale]/(pages)/forms/invoices/components/InvoiceItemTable";
import { type AdditionalExpansesTableHandle } from "@/app/[locale]/(pages)/forms/invoices/components/AdditionalExpansesTable";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useLocale } from "next-intl";

import InvoiceSelectors from "@/app/[locale]/(pages)/forms/invoices/components/InvoiceSelectors";
import InvoiceItemTableSkeleton from "@/app/[locale]/(pages)/forms/invoices/components/InvoiceItemTableSkeleton";
import InvoiceTotalsDisplay from "@/app/[locale]/(pages)/forms/invoices/components/InvoiceTotalsDisplay";
import {
  Invoice,
  InvoiceDetail,
  PaymentTypes,
  TransTypes,
} from "@/types/models/invoice";
import useInvoiceForm from "@/app/[locale]/(pages)/forms/invoices/hooks/useInvoiceForm";
import {
  hydrateInvoiceTotalsStore,
  resetInvoiceTotalsStore,
} from "@/stores/invoiceTotalsStore";
import useFractions from "@/utilities/useFractions";
import { calculateValueAndWagesTax } from "@/utilities/invoiceForm";
import { getMaxInvoiceIdAction } from "@/app/actions/invoice";
import { STORAGE_KEYS } from "@/constants";
import accountService from "@/services/api/account.service";
import { Account } from "@/types/models/account";

const InvoiceItemTable = dynamic(
  () =>
    import(
      "@/app/[locale]/(pages)/forms/invoices/components/InvoiceItemTable"
    ).then((mod) => {
      const ForwardedInvoiceItemTable = forwardRef<
        InvoiceItemTableHandle,
        InvoiceItemTableProps
      >((props, ref) => <mod.default {...props} ref={ref} />);

      ForwardedInvoiceItemTable.displayName = "InvoiceItemTable";

      return ForwardedInvoiceItemTable;
    }),
  {
    loading: () => <InvoiceItemTableSkeleton />,
    ssr: false,
  },
);

type InvoicePageType = "sale" | "purchase" | "sale-return" | "purchase-return";

const FORM_CONTEXT_MAP: Record<
  InvoicePageType,
  "sale" | "purchase" | "sale_return" | "purchase_return"
> = {
  sale: "sale",
  purchase: "purchase",
  "sale-return": "sale_return",
  "purchase-return": "purchase_return",
};

const SELECTOR_TYPE_MAP: Record<InvoicePageType, TransTypes> = {
  sale: TransTypes.SALES,
  purchase: TransTypes.PURCHASE,
  "sale-return": TransTypes.SALES_RETURN,
  "purchase-return": TransTypes.PURCHASE_RETURN,
};

const TOTALS_TYPE_MAP: Record<InvoicePageType, TransTypes> = {
  sale: TransTypes.SALES,
  purchase: TransTypes.PURCHASE,
  "sale-return": TransTypes.SALES_RETURN,
  "purchase-return": TransTypes.PURCHASE_RETURN,
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;

  return null;
};

export interface InvoiceClientPageProps {
  invoiceData: Invoice | null;
  invoiceDetailsData: InvoiceDetail[];
  isNewInvoice: boolean;
  invoiceRecordId?: number | string | null;
  boxes: any[];
  customers: any[];
  items: any[];
  categories: any[];
  goldPrice: number | null;
  homePurity: number;
  startInEditMode?: boolean;
  invoiceType?: InvoicePageType;
  formMode?: "new" | "edit" | "preview";
  newInvoiceHref?: string;
}

export default function InvoiceClientPage({
  invoiceData,
  invoiceDetailsData,
  isNewInvoice,
  invoiceRecordId,
  boxes: initialBoxes,
  customers: initialCustomers,
  items: initialItems,
  categories: initialCategories,
  goldPrice: initialGoldPrice,
  homePurity: initialHomePurity,
  startInEditMode = false,
  invoiceType = "sale",
  formMode = "new",
  newInvoiceHref,
}: InvoiceClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [maxInvoiceId, setMaxInvoiceId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const {
    // lists
    items,
    categories,
    customers,
    setItems,

    // UI state
    employee,
    setEmployee,
    isEditing,
    setIsEditing,
    isLoading,

    // form & invoice items
    form,
    dispatchForm,
    invoiceItems,
    setInvoiceItems,

    // prices & settings
    goldPrice,
    homePurity,
    paymentMethod,
    setPaymentMethod,
    handlingMethod,
    setHandlingMethod,
    mobileMethod,
    setMobileMethod,

    // search
    searchNumber,
    setSearchNumber,
    searchValue,
    setSearchValue,

    // helpers & actions
    computeTotals,
    handleBarcodeSearch,
    saveInvoice,
    previewInvoice,
    handleItemRemoved,

    // manual totals

    // other
    goldPrice: maybeGoldPrice, // already have goldPrice but keep alias if needed
  } = useInvoiceForm({
    invoiceData,
    invoiceDetailsData,
    isNewInvoice,
    initialBoxes,
    initialCustomers,
    initialItems,
    initialCategories,
    initialGoldPrice,
    initialHomePurity,
    invoiceRecordId,
    context: FORM_CONTEXT_MAP[invoiceType],
    maxInvoiceId,
  });
  const fractions = useFractions();
  const allowEditing = formMode === "edit" || isNewInvoice;
  const itemTableRef = useRef<InvoiceItemTableHandle | null>(null);
  const additionalExpansesRef = useRef<AdditionalExpansesTableHandle | null>(
    null,
  );

  // Derive selected box ID from customer selection
  const selectedBoxId = useMemo(() => {
    if (!form.cust_code) return null;
    const selectedBox = customers.find(
      (c: any) => String(c.cust_code) === String(form.cust_code),
    );

    return selectedBox?.id ?? null;
  }, [customers, form.cust_code]);

  // Update note field and all item descriptions
  const handleNoteChange = useCallback(
    (newNote: string) => {
      dispatchForm({
        type: "SET_FIELD",
        field: "inv_notes",
        value: newNote,
      });

      // Update all existing items' descriptions
      if (invoiceItems.length > 0) {
        const updatedItems = invoiceItems.map((item) => ({
          ...item,
          item_desc: newNote,
        }));

        setInvoiceItems(updatedItems);
      }
    },
    [invoiceItems, setInvoiceItems, dispatchForm],
  );

  useEffect(() => {
    if (allowEditing && (startInEditMode || formMode === "edit")) {
      setIsEditing(true);
    }
  }, [allowEditing, formMode, setIsEditing, startInEditMode]);

  const selectorsInvoiceType = SELECTOR_TYPE_MAP[invoiceType];
  const totalsInvoiceType = TOTALS_TYPE_MAP[invoiceType];
  const resolvedNewInvoiceHref =
    newInvoiceHref ??
    `/forms/invoices?type=${encodeURIComponent(invoiceType)}&mode=new`;

  // Fetch max invoice ID for new invoices
  useEffect(() => {
    if (isNewInvoice && !maxInvoiceId) {
      getMaxInvoiceIdAction(selectorsInvoiceType)
        .then((response) => {
          if (response?.max_inv_id) {
            setMaxInvoiceId(response.max_inv_id);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch max invoice ID:", error);
        });
    }
  }, [isNewInvoice, selectorsInvoiceType, maxInvoiceId]);

  useEffect(() => {
    accountService
      .getAccounts()
      .then((data) => setAccounts(data || []))
      .catch((error) => console.error("Error loading accounts:", error));
  }, []);

  const buildUrl = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const sp = new URLSearchParams(searchParams?.toString() || "");

      // apply updates
      Object.entries(updates).forEach(([k, v]) => {
        if (v == null || v === "") sp.delete(k);
        else sp.set(k, v);
      });
      // ensure we never keep legacy edit=true when mode is managed
      if (updates.mode) sp.delete("edit");

      return `${pathname}?${sp.toString()}`;
    },
    [pathname, searchParams],
  );

  const saveAdditionalExpenses = useCallback(
    async (invoiceId: number) => {
      if (additionalExpansesRef.current) {
        const companyId = parseInt(
          getCookieValue(STORAGE_KEYS.COMPANY_ID) || "1",
        );
        const userId = getCookieValue(STORAGE_KEYS.USER_ID) || "1";

        await additionalExpansesRef.current.saveRows({
          invoiceId,
          transType: selectorsInvoiceType,
          companyId,
          userId,
        });
      }
    },
    [selectorsInvoiceType],
  );

  const handleSaveAndNavigate = useCallback(async () => {
    const result = await saveInvoice();

    if (!result || result.ok !== true) return;

    if (result.recordId) {
      await saveAdditionalExpenses(result.recordId);
    }

    if (result.invoiceBoxCount > 1 && result.hasAmountChanged) {
      const companyId = getCookieValue(STORAGE_KEYS.COMPANY_ID) || "1";

      const totalsForPayment = computeTotals(form.pay_type, invoiceItems);

      const paymentUrl = new URLSearchParams({
        total: String(totalsForPayment.netAmount),
        inv_number: String(result.invoiceNumber),
        customer: form.cust_name || "",
        inv: String(result.recordId),
        com: companyId,
        trans_type: String(selectorsInvoiceType),
        inv_type: invoiceType,
      });

      if (selectedBoxId) {
        paymentUrl.set("box_id", String(selectedBoxId));
      }

      router.push(`/forms/invoices/payment?${paymentUrl.toString()}`);

      return;
    }

    const invNumber = String(result.invoiceNumber);
    // Prefer inv_id; also remove id to avoid ambiguity
    const url = buildUrl({ mode: "preview", inv_id: invNumber, id: null });

    router.replace(url);
  }, [
    buildUrl,
    router,
    saveInvoice,
    computeTotals,
    form.pay_type,
    invoiceItems,
    form.cust_name,
    selectorsInvoiceType,
    invoiceType,
    selectedBoxId,
  ]);

  // Navigate to entered invoice id on search
  const handleSearchByInvoiceId = useCallback(() => {
    if (
      (invoiceData?.last_invoice_id &&
        searchNumber > invoiceData.last_invoice_id) ||
      (invoiceData?.first_invoice_id &&
        searchNumber < invoiceData.first_invoice_id)
    ) {
      toast.error("هذه الفاتورة غير موجودة.");

      return;
    }

    const rawSearch = (searchNumber ?? "").toString().trim();

    if (!rawSearch) return;

    // normalize to integer-like string
    const parsed = Number(rawSearch);
    const id =
      Number.isFinite(parsed) && parsed > 0 ? String(parsed) : rawSearch;

    // Set mode to preview and update only the id param; clear inv_id to avoid ambiguity
    const url = buildUrl({ mode: "preview", id, inv_id: null });

    router.replace(url);
  }, [buildUrl, invoiceData, router, searchNumber]);

  const resolvePaginatedInvoiceHref = useCallback(
    (inv_id: string | null) => {
      if (!inv_id) return null;

      const searchParams = new URLSearchParams({
        type: invoiceType,
        mode: "preview",
        id: String(inv_id),
      });

      return `${pathname}?${searchParams.toString()}`;
    },
    [invoiceType, pathname],
  );

  const metadata = useMemo(() => {
    if (!invoiceData) return null;

    return {
      nextInvoiceHref: resolvePaginatedInvoiceHref(
        invoiceData?.next_invoice_id,
      ),
      prevInvoiceHref: resolvePaginatedInvoiceHref(
        invoiceData?.previous_invoice_id,
      ),
      lastInvoiceHref: resolvePaginatedInvoiceHref(
        invoiceData?.last_invoice_id,
      ),
      firstInvoiceHref: resolvePaginatedInvoiceHref(
        invoiceData?.first_invoice_id,
      ),
      totalInvoices: invoiceData?.invoices_count,
    };
  }, [invoiceData, resolvePaginatedInvoiceHref]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    const invId = form.inv_id ? String(form.inv_id) : undefined;
    const url = buildUrl({ mode: "edit", inv_id: invId });

    router.replace(url);
  }, [buildUrl, form.inv_id, router, setIsEditing]);

  // join any derived totals via computeTotals (hook exposes computeTotals)
  const totals = useMemo(() => {
    return computeTotals(form.pay_type, invoiceItems);
  }, [computeTotals, form.pay_type, invoiceItems]);

  const { totalAmount, netAmount, totalDiscount, taxAmount, totalGWeight } =
    totals;

  // Calculate separate tax values for value and wages
  const { totalValueTax, totalWagesTax } = useMemo(() => {
    return calculateValueAndWagesTax(invoiceItems, form.pay_type);
  }, [invoiceItems, form.pay_type]);

  const locale = useLocale();
  const formattedDateTime = useMemo(() => {
    if (!form.inv_date) return "";

    const localeCode = locale === "ar" ? "ar-EG" : "en-US";

    return new Date(form.inv_date).toLocaleString(localeCode);
  }, [form.inv_date, locale]);

  const setInvoiceDateField = useCallback(
    (value: string) =>
      dispatchForm({
        type: "SET_FIELD",
        field: "inv_date",
        value: value ? new Date(value).toISOString() : "",
      }),
    [dispatchForm],
  );

  const invoiceNumber = form.inv_id ? String(form.inv_id) : "";

  const commitFieldSetter = useCallback(
    (value: boolean) =>
      dispatchForm({ type: "SET_FIELD", field: "commit", value }),
    [dispatchForm],
  );

  const printFieldSetter = useCallback(
    (value: boolean) =>
      dispatchForm({ type: "SET_FIELD", field: "print", value }),
    [dispatchForm],
  );

  const handlePaymentClick = useCallback(async () => {
    const result = await saveInvoice({ skipDefaultBoxCreation: !isNewInvoice });

    if (!result || result.ok !== true) {
      toast.error("فشل في حفظ الفاتورة. يرجى المحاولة مرة أخرى.");

      return;
    }

    if (result.recordId) {
      await saveAdditionalExpenses(result.recordId);
    }

    const companyId = getCookieValue(STORAGE_KEYS.COMPANY_ID) || "1";

    const paymentUrl = new URLSearchParams({
      total: String(netAmount),
      inv_number: String(result.invoiceNumber),
      customer: form.cust_name || "",
      inv: String(result.recordId),
      com: companyId,
      trans_type: String(selectorsInvoiceType),
      inv_type: invoiceType,
    });

    // Add box_id if available
    if (selectedBoxId) {
      paymentUrl.set("box_id", String(selectedBoxId));
    }

    router.push(`/forms/invoices/payment?${paymentUrl.toString()}`);
  }, [
    saveInvoice,
    netAmount,
    form.cust_name,
    selectorsInvoiceType,
    router,
    invoiceItems,
    selectedBoxId,
  ]);

  useEffect(() => {
    hydrateInvoiceTotalsStore({
      metadata,
      invoiceNumber,
      maxInvoiceId,
      formattedDateTime,
      saveInvoice: handleSaveAndNavigate,
      previewInvoice,
      totalAmount,
      taxAmount: taxAmount ?? 0,
      netAmount,
      totalDiscount,
      invoiceDate: form.inv_date,
      setInvoiceDate: setInvoiceDateField,
      commit: form.commit,
      setCommit: commitFieldSetter,
      print: form.print,
      setPrint: printFieldSetter,
      isDone: form.is_done,
      isOk: form.is_ok,
      isEditing,
      onEdit: handleStartEdit,
      invoiceType: totalsInvoiceType,
      searchNumber,
      setSearchNumber,
      onInvoiceSearch: handleSearchByInvoiceId,
      totalGWeight: totalGWeight ?? 0,
      paymentMethod: paymentMethod ?? PaymentTypes.CASH,
      newInvoiceHref: resolvedNewInvoiceHref,
      isNewInvoice,
    });
  }, [
    metadata,
    invoiceNumber,
    maxInvoiceId,
    formattedDateTime,
    handleSaveAndNavigate,
    previewInvoice,
    totalAmount,
    taxAmount,
    netAmount,
    totalDiscount,
    form.commit,
    commitFieldSetter,
    form.print,
    printFieldSetter,
    form.is_done,
    form.is_ok,
    form.inv_date,
    setInvoiceDateField,
    isEditing,
    handleStartEdit,
    totalsInvoiceType,
    searchNumber,
    setSearchNumber,
    handleSearchByInvoiceId,
    totalGWeight,
    paymentMethod,
    resolvedNewInvoiceHref,
    isNewInvoice,
  ]);

  useEffect(() => {
    return () => {
      resetInvoiceTotalsStore();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <InvoiceSelectors
        accounts={accounts}
        area={form.area}
        buildNo={form.build_no}
        city={form.city}
        crNo={form.cr_no}
        customers={customers}
        employee={employee}
        goldPrice={goldPrice}
        // goldPriceValue={goldPrice ?? maybeGoldPrice}
        gov={form.gov}
        handlingMethod={handlingMethod}
        invoiceType={selectorsInvoiceType}
        isEditing={isEditing}
        mobileMethod={mobileMethod}
        note={form.inv_notes}
        payType={form.pay_type}
        paymentMethod={paymentMethod}
        postCode={form.post_code}
        postNo={form.post_no}
        referenceNumber={form.ref_no}
        searchValue={searchValue}
        selectedCustomer={form.cust_code}
        selectedCustomerName={form.cust_name}
        setArea={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "area", value: v })
        }
        setBuildNo={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "build_no", value: v })
        }
        setCity={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "city", value: v })
        }
        setCrNo={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "cr_no", value: v })
        }
        setEmployee={setEmployee}
        setGov={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "gov", value: v })
        }
        setHandlingMethod={setHandlingMethod}
        setMobileMethod={setMobileMethod}
        setNote={handleNoteChange}
        setPayType={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "pay_type", value: v })
        }
        setPaymentMethod={setPaymentMethod}
        setPostCode={(v) =>
          dispatchForm({
            type: "SET_FIELD",
            field: "post_code",
            value: v,
          })
        }
        setPostNo={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "post_no", value: v })
        }
        setReferenceNumber={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "ref_no", value: v })
        }
        setSearchValue={setSearchValue}
        setSelectedCustomer={(v) =>
          dispatchForm({
            type: "SET_FIELD",
            field: "cust_code",
            value: v !== null && v !== undefined ? String(v) : null,
          })
        }
        setSelectedCustomerName={(value) =>
          dispatchForm({
            type: "SET_FIELD",
            field: "cust_name",
            value,
          })
        }
        setStreet={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "street", value: v })
        }
        setVatNumber={(v) =>
          dispatchForm({ type: "SET_FIELD", field: "vat_no", value: v })
        }
        street={form.street}
        onBarcodeSearch={() => handleBarcodeSearch()}
        onFocusNextSection={() =>
          itemTableRef.current?.focusFirstRow() ?? false
        }
        onInvoiceSelect={() => {}}
        additionalExpansesRef={additionalExpansesRef}
      />

      <InvoiceItemTable
        ref={itemTableRef}
        categories={categories}
        defaultDescription={form.inv_notes}
        goldPrice={goldPrice ?? maybeGoldPrice ?? null}
        homePurity={homePurity}
        invoiceItems={invoiceItems}
        isEditing={isEditing}
        items={items}
        payType={form.pay_type}
        setInvoiceItems={setInvoiceItems}
        setItems={setItems}
        onItemRemoved={handleItemRemoved}
      />

      <InvoiceTotalsDisplay
        boxId={selectedBoxId}
        customerName={form.cust_name || ""}
        formMode={formMode}
        fractions={{
          frac: typeof fractions === "object" ? fractions.frac : 2,
          frac2: typeof fractions === "object" ? fractions.frac2 : 3,
        }}
        invoiceId={form.inv_id ? String(form.inv_id) : ""}
        invoiceNumber={form.inv_id ? String(form.inv_id) : ""}
        netAmount={netAmount}
        paymentMethod={paymentMethod}
        taxAmount={taxAmount ?? 0}
        totalAmount={totalAmount}
        totalDiscount={totalDiscount}
        totalGWeight={totalGWeight ?? 0}
        totalValueTax={totalValueTax}
        totalWagesTax={totalWagesTax}
        hasItems={invoiceItems.some((item: any) => {
          const itemId = Number(item.item || item.item_id || 0);

          return itemId > 0;
        })}
        onPaymentClick={handlePaymentClick}
      />
    </div>
  );
}
