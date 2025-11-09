"use client";

import { useEffect, useMemo } from "react";

import InvoiceSelectors from "@/components/InvoiceSelectors";
import InvoiceItemTable from "@/components/InvoiceItemTable";
import InvoiceTotalsActions from "@/components/InvoiceTotalsActions";
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

    // records
    currentRecord,
    setCurrentRecord,
    totalRecords,
    setTotalRecords,

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

  // join any derived totals via computeTotals (hook exposes computeTotals)
  const totals = useMemo(() => {
    return computeTotals(form.pay_type, invoiceItems);
  }, [computeTotals, form.pay_type, invoiceItems]);



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
        autoTotalValue={autoTotalValue}
        autoTotalWages={autoTotalWages}
        canEdit={allowEditing}
        commit={form.commit}
        currentRecord={currentRecord}
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
        saveInvoice={saveInvoice}
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
        totalRecords={totalRecords}
        totalTax={totals.taxAmount ?? 0}
        totalValueTax={totals.taxAmount ?? 0}
        totalWagesTax={0}
        useManualTotals={useManualTotals}
        onEdit={() => {
          if (allowEditing) {
            setIsEditing(true);
          }
        }}
        onInvoiceSearch={handleInvoiceSearch}
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
