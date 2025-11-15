"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import InvoiceSelectors from "@/app/(pages)/forms/invoices/components/InvoiceSelectors";
import InvoiceItemTable from "@/app/(pages)/forms/invoices/components/InvoiceItemTable";
import InvoiceTotalsActions from "@/app/(pages)/forms/invoices/components/InvoiceTotalsActions";
import { Invoice, InvoiceDetail } from "@/types/models/invoice";
import useInvoiceForm from "@/hooks/useInvoiceForm";

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

const SELECTOR_TYPE_MAP: Record<
  InvoicePageType,
  "sale" | "purchase" | "sale_return" | "purchase_return"
> = {
  sale: "sale",
  purchase: "purchase",
  "sale-return": "sale_return",
  "purchase-return": "purchase_return",
};

const TOTALS_TYPE_MAP: Record<
  InvoicePageType,
  "sales" | "purchase" | "sales_return" | "purchase_return"
> = {
  sale: "sales",
  purchase: "purchase",
  "sale-return": "sales_return",
  "purchase-return": "purchase_return",
};

interface InvoiceClientPageProps {
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
    makeEmptyRow,

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
    frac,
    computeTotals,
    handleBarcodeSearch,
    saveInvoice,
    previewInvoice,
    handleInvoiceSearch,
    handleItemRemoved,
    navigateToInvoice,

    // manual totals
    autoTotalValue,
    autoTotalWages,
    manualTotalValue,
    manualTotalWages,
    useManualTotals,
    setUseManualTotals,
    handleManualTotalChange,
    resetManualTotals,

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
  });
  const allowEditing = formMode === "edit" || isNewInvoice;

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

  const buildUrl = (updates: Record<string, string | null | undefined>) => {
    const sp = new URLSearchParams(searchParams?.toString() || "");
    // apply updates
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null || v === "") sp.delete(k);
      else sp.set(k, v);
    });
    // ensure we never keep legacy edit=true when mode is managed
    if (updates.mode) sp.delete("edit");
    return `${pathname}?${sp.toString()}`;
  };

  const handleSaveAndNavigate = async () => {
    const result = await saveInvoice();
    if (!result || result.ok !== true) return;

    const invNumber = String(result.invoiceNumber);
    // Prefer inv_id; also remove id to avoid ambiguity
    const url = buildUrl({ mode: "preview", inv_id: invNumber, id: null });
    router.replace(url);
  };

  // Navigate to entered invoice id on search
  const handleSearchByInvoiceId = () => {
    const raw = (searchNumber ?? "").toString().trim();
    if (!raw) return;

    // normalize to integer-like string
    const parsed = Number(raw);
    const id = Number.isFinite(parsed) && parsed > 0 ? String(parsed) : raw;

    // Set mode to preview and update only the id param; clear inv_id to avoid ambiguity
    const url = buildUrl({ mode: "preview", id, inv_id: null });
    router.replace(url);
  };

  // join any derived totals via computeTotals (hook exposes computeTotals)
  const totals = useMemo(() => {
    return computeTotals(form.pay_type, invoiceItems);
  }, [computeTotals, form.pay_type, invoiceItems]);

  const resolvePaginatedInvoiceHref = (inv_id: string | null) => {
    if (!inv_id) return null;

    const searchParams = new URLSearchParams({
      type: invoiceType,
      mode: "preview",
      id: String(inv_id),
    });

    return `${pathname}?${searchParams.toString()}`;
  };

  // const resolvedPrevInvoiceHref = () => {
  // 	if (!invoiceData?.previous_invoice_id) return null;

  //   const searchParams = new URLSearchParams({
  //     mode: "preview",
  //     type: invoiceType,
  //     inv_id: String(invoiceData?.previous_invoice_id),
  //   });

  //   return `${pathname}?${searchParams.toString()}`;
  // };

  // const resolvedLastInvoiceHref = () => {
  // 	if (!invoiceData?.last_invoice_id) return null;

  //   const searchParams = new URLSearchParams({
  //     mode: "preview",
  //     type: invoiceType,
  //     inv_id: String(invoiceData?.last_invoice_id),
  //   });

  //   return `${pathname}?${searchParams.toString()}`;
  // };

  // const resolvedFirstInvoiceHref = () => {
  // 	if (!invoiceData?.first_invoice_id) return null;

  //   const searchParams = new URLSearchParams({
  //     mode: "preview",
  //     type: invoiceType,
  //     inv_id: String(invoiceData?.first_invoice_id),
  //   });

  //   return `${pathname}?${searchParams.toString()}`;
  // };

  const metadata = invoiceData
    ? {
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
      }
    : null;

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
    <>
      <InvoiceTotalsActions
        metadata={metadata}
        autoTotalValue={autoTotalValue}
        autoTotalWages={autoTotalWages}
        canEdit={allowEditing}
        commit={form.commit}
        isNewInvoice={isNewInvoice}
        formattedDateTime={new Date(form.inv_date).toLocaleString("ar-EG")}
        invoiceNumber={form.inv_id}
        invoiceType={totalsInvoiceType}
        isEditing={isEditing}
        manualTotalValue={manualTotalValue}
        manualTotalWages={manualTotalWages}
        navigateToInvoice={navigateToInvoice}
        netAmount={totals.netAmount}
        newInvoiceHref={resolvedNewInvoiceHref}
        paymentMethod={paymentMethod}
        previewInvoice={previewInvoice}
        print={form.print}
        saveInvoice={handleSaveAndNavigate}
        searchNumber={searchNumber}
        setCommit={(value: boolean) =>
          dispatchForm({ type: "SET_FIELD", field: "commit", value })
        }
        setPrint={(value: boolean) =>
          dispatchForm({ type: "SET_FIELD", field: "print", value })
        }
        setSearchNumber={setSearchNumber}
        taxAmount={totals.taxAmount}
        totalAmount={totals.totalAmount}
        totalDiscount={totals.totalDiscount}
        totalGWeight={totals.totalGWeight}
        totalRecords={1}
        totalTax={totals.taxAmount ?? 0}
        totalValueTax={totals.taxAmount ?? 0}
        totalWagesTax={0}
        useManualTotals={useManualTotals}
        onEdit={() => {
          setIsEditing(true);
          const invId = form.inv_id ? String(form.inv_id) : undefined;
          const url = buildUrl({ mode: "edit", edit: null, inv_id: invId });
          router.replace(url);
        }}
        onInvoiceSearch={handleSearchByInvoiceId}
        onManualTotalChange={handleManualTotalChange}
        onResetManualTotals={resetManualTotals}
        onUseManualTotalsChange={setUseManualTotals}
      >
        <div className={isEditing ? "" : "pointer-events-none opacity-70"}>
          <InvoiceSelectors
            area={form.area}
            buildNo={form.build_no}
            city={form.city}
            crNo={form.cr_no}
            customers={customers}
            employee={employee}
            goldPrice={goldPrice}
            goldPriceValue={goldPrice ?? maybeGoldPrice}
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
            saleInvoices={[]}
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
            setNote={(v) =>
              dispatchForm({
                type: "SET_FIELD",
                field: "inv_notes",
                value: v,
              })
            }
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
            onInvoiceSelect={() => {}}
          />

          <InvoiceItemTable
            categories={categories}
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
        </div>
      </InvoiceTotalsActions>
    </>
  );
}
