"use client";

import { useEffect, useMemo } from "react";
import InvoiceSelectors from "@/components/InvoiceSelectors";
import InvoiceItemTable from "@/components/InvoiceItemTable";
import InvoiceTotalsActions from "@/components/InvoiceTotalsActions";

import { Invoice, InvoiceDetail } from "@/types/models/invoice";
import useInvoiceForm from "@/hooks/useInvoiceForm";

interface InvoiceClientPageProps {
  invoiceData: Invoice | null;
  invoiceDetailsData: InvoiceDetail[];
  isNewInvoice: boolean;
  customers: any[];
  items: any[];
  categories: any[];
  goldPrice: number | null;
  homePurity: number;
  startInEditMode?: boolean;
}

export default function InvoiceClientPage({
  invoiceData,
  invoiceDetailsData,
  isNewInvoice,
  customers: initialCustomers,
  items: initialItems,
  categories: initialCategories,
  goldPrice: initialGoldPrice,
  homePurity: initialHomePurity,
  startInEditMode = false,
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
    initialCustomers,
    initialItems,
    initialCategories,
    initialGoldPrice,
    initialHomePurity,
  });

  useEffect(() => {
    if (startInEditMode) {
      setIsEditing(true);
    }
  }, [setIsEditing, startInEditMode]);

  // join any derived totals via computeTotals (hook exposes computeTotals)
  const totals = useMemo(() => {
    return computeTotals(form.pay_type, invoiceItems);
  }, [computeTotals, form.pay_type, invoiceItems]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <InvoiceTotalsActions
        invoiceNumber={form.inv_id}
        formattedDateTime={new Date(form.inv_date).toLocaleString("ar-EG")}
        saveInvoice={saveInvoice}
        previewInvoice={previewInvoice}
        totalAmount={totals.totalAmount}
        taxAmount={totals.taxAmount}
        netAmount={totals.netAmount}
        totalDiscount={totals.totalDiscount}
        commit={form.commit}
        setCommit={(value: boolean) =>
          dispatchForm({ type: "SET_FIELD", field: "commit", value })
        }
        print={form.print}
        setPrint={(value: boolean) =>
          dispatchForm({ type: "SET_FIELD", field: "print", value })
        }
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        invoiceType="sales"
        autoTotalValue={autoTotalValue}
        autoTotalWages={autoTotalWages}
        manualTotalValue={manualTotalValue}
        manualTotalWages={manualTotalWages}
        useManualTotals={useManualTotals}
        onManualTotalChange={handleManualTotalChange}
        onUseManualTotalsChange={setUseManualTotals}
        onResetManualTotals={resetManualTotals}
        searchNumber={searchNumber}
        setSearchNumber={setSearchNumber}
        onInvoiceSearch={handleInvoiceSearch}
        totalGWeight={totals.totalGWeight}
        totalValueTax={totals.taxAmount ?? 0}
        totalWagesTax={0}
        totalTax={totals.taxAmount ?? 0}
        paymentMethod={paymentMethod}
        currentRecord={currentRecord}
        totalRecords={totalRecords}
        navigateToInvoice={navigateToInvoice}
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
            gov={form.gov}
            handlingMethod={handlingMethod}
            mobileMethod={mobileMethod}
            note={form.inv_notes}
            payType={form.pay_type}
            paymentMethod={paymentMethod}
            postCode={form.post_code}
            postNo={form.post_no}
            referenceNumber={form.ref_no}
            saleInvoices={[]}
            selectedCustomer={form.cust_code}
            onInvoiceSelect={() => {}}
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
              dispatchForm({ type: "SET_FIELD", field: "inv_notes", value: v })
            }
            setPayType={(v) =>
              dispatchForm({ type: "SET_FIELD", field: "pay_type", value: v })
            }
            setPaymentMethod={setPaymentMethod}
            setPostCode={(v) =>
              dispatchForm({ type: "SET_FIELD", field: "post_code", value: v })
            }
            setPostNo={(v) =>
              dispatchForm({ type: "SET_FIELD", field: "post_no", value: v })
            }
            setReferenceNumber={(v) =>
              dispatchForm({ type: "SET_FIELD", field: "ref_no", value: v })
            }
            setSelectedCustomer={(v) =>
              dispatchForm({ type: "SET_FIELD", field: "cust_code", value: v })
            }
            setStreet={(v) =>
              dispatchForm({ type: "SET_FIELD", field: "street", value: v })
            }
            setVatNumber={(v) =>
              dispatchForm({ type: "SET_FIELD", field: "vat_no", value: v })
            }
            street={form.street}
            vatNumber={form.vat_no}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            onBarcodeSearch={() => handleBarcodeSearch()}
            isEditing={isEditing}
            invoiceType="sale"
          />

          <InvoiceItemTable
            categories={categories}
            goldPrice={goldPrice}
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
