import {
  ChangeEvent,
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactSelect, { type SelectInstance } from "react-select";
import { useTranslations } from "next-intl";

import { AdditionalExpansesTableHandle } from "./AdditionalExpansesTable";
import InvoiceAddressSection from "./InvoiceAddressSection";
import InvoiceAdditionalExpansesSection from "./InvoiceAdditionalExpansesSection";

import { BaseModal } from "@/components/Modal";
import useKeyAsTab from "@/hooks/useKeyAsTab";
import {
  INVOICE_PAY_TYPES,
  type Invoice,
  type InvoicePayType,
  PaymentTypes,
  TransTypes,
} from "@/types/models/invoice";
import { getCustomerInvoicesAction } from "@/app/actions/customer";
import { Account } from "@/types/models/account";

interface Customer {
  id: string;
  cust_name: string;
  cust_code?: string;
  vat_no?: string;
  mobile?: string;
  acc?: number;
  handling?: string;
  cust_type?: number;
  cr_no?: string;
  gov?: string;
  city?: string;
  area?: string;
  street?: string;
  build_no?: string;
  post_no?: string;
  post_code?: string;
}

type CustomerOption = { value: string; label: string };

const useCustomerInvoices = ({
  isReturnInvoice,
  hasCustomerId,
  invoiceType,
  numericCustomerId,
}: {
  isReturnInvoice: boolean;
  hasCustomerId: boolean;
  invoiceType: TransTypes;
  numericCustomerId: number;
}) => {
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [isCustomerInvoicesLoading, setIsCustomerInvoicesLoading] =
    useState(false);

  useEffect(() => {
    let ignore = false;

    if (!isReturnInvoice || !hasCustomerId) {
      setCustomerInvoices([]);

      return;
    }

    const loadCustomerInvoices = async () => {
      setIsCustomerInvoicesLoading(true);

      try {
        const transType =
          invoiceType === TransTypes.PURCHASE_RETURN
            ? TransTypes.PURCHASE_RETURN
            : TransTypes.SALES_RETURN;
        const invoices = await getCustomerInvoicesAction({
          xcust_id: Number(numericCustomerId),
          xtrans_type: transType,
        });

        if (!ignore) {
          setCustomerInvoices(Array.isArray(invoices) ? invoices : []);
        }
      } catch (error) {
        if (!ignore) {
          console.error("Error loading customer invoices:", error);
          setCustomerInvoices([]);
        }
      } finally {
        if (!ignore) {
          setIsCustomerInvoicesLoading(false);
        }
      }
    };

    loadCustomerInvoices();

    return () => {
      ignore = true;
    };
  }, [hasCustomerId, invoiceType, isReturnInvoice, numericCustomerId]);

  const customerInvoiceOptions = useMemo(() => {
    return customerInvoices.map((invoice) => {
      const dateLabel = invoice.inv_date ? invoice.inv_date.split("T")[0] : "";
      const label = dateLabel
        ? `${invoice.inv_id} - ${dateLabel}`
        : String(invoice.inv_id);

      return {
        value: String(invoice.inv_id),
        label,
      };
    });
  }, [customerInvoices]);

  return { customerInvoiceOptions, isCustomerInvoicesLoading };
};

interface Props {
  accounts: Account[];
  customers: Customer[];
  selectedCustomer: string | null;
  selectedCustomerName: string;
  setSelectedCustomer: Dispatch<SetStateAction<string | null>>;
  setSelectedCustomerName: (val: string) => void;
  paymentMethod: PaymentTypes;
  setPaymentMethod: (value: PaymentTypes) => void;
  payType: InvoicePayType;
  setPayType: (val: InvoicePayType) => void;
  referenceNumber: string;
  setReferenceNumber: (val: string) => void;

  setVatNumber: (val: string) => void;
  crNo: string;
  setCrNo: (val: string) => void;
  gov: string;
  setGov: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  area: string;
  setArea: (val: string) => void;
  street: string;
  setStreet: (val: string) => void;
  buildNo: string;
  setBuildNo: (val: string) => void;
  postNo: string;
  setPostNo: (val: string) => void;
  postCode: string;
  setPostCode: (val: string) => void;
  handlingMethod: string;
  setHandlingMethod: (val: string) => void;
  mobileMethod: string;
  setMobileMethod: (val: string) => void;
  employee: string;
  setEmployee: (val: string) => void;
  goldPrice: number | null;
  note: string;
  setNote: (val: string) => void;
  onInvoiceSelect?: (invoiceId: number) => void;
  // البحث بالباركود
  searchValue: string;
  setSearchValue: (val: string) => void;
  onBarcodeSearch: () => void;
  isEditing: boolean;
  invoiceType?: TransTypes;
  // التاريخ والوقت
  invoiceDate?: string;
  setInvoiceDate?: (val: string) => void;
  onFocusNextSection?: () => boolean;
  additionalExpansesRef?: RefObject<AdditionalExpansesTableHandle | null>;
}

export default function InvoiceSelectors({
  accounts,
  customers,
  selectedCustomer,
  selectedCustomerName,
  setSelectedCustomer,
  setSelectedCustomerName,
  paymentMethod,
  setPaymentMethod,
  payType,
  setPayType,
  referenceNumber,
  setReferenceNumber,
  setVatNumber,
  crNo,
  setCrNo,
  gov,
  setGov,
  city,
  setCity,
  area,
  setArea,
  street,
  setStreet,
  buildNo,
  setBuildNo,
  postNo,
  setPostNo,
  postCode,
  setPostCode,
  handlingMethod,
  setHandlingMethod,
  mobileMethod,
  setMobileMethod,
  employee,
  setEmployee,
  goldPrice,
  note,
  setNote,
  // البحث بالباركود
  searchValue,
  setSearchValue,
  onBarcodeSearch,
  isEditing,
  invoiceType = TransTypes.SALES,
  onFocusNextSection,
  additionalExpansesRef,
}: Props) {
  const selectorsRef = useRef<HTMLDivElement | null>(null);
  const customerSelectRef = useRef<SelectInstance<CustomerOption> | null>(null);
  const t = useTranslations("forms.invoices.selectors");

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const partyKey: "customer" | "supplier" =
    invoiceType === TransTypes.PURCHASE ||
    invoiceType === TransTypes.PURCHASE_RETURN
      ? "supplier"
      : "customer";
  const partyLabel = t(`customerLabel.${partyKey}`);
  const partyPlaceholder = t(`customerPlaceholder.${partyKey}`);
  const customerInvoicesLabel = t(`customerInvoicesLabel.${partyKey}`);
  const getFallbackName = useCallback(
    (code: string) => t(`fallbackName.${partyKey}`, { code }),
    [partyKey, t],
  );

  const { handleKeyDown } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
    shouldIgnoreEvent: (event) => {
      const target = event.target as HTMLElement | null;

      if (!target) return false;

      if (target.closest("[data-skip-key-as-tab='true']")) return true;

      const comboRoot = target.closest('[role="combobox"]');

      if (comboRoot && comboRoot.getAttribute("aria-expanded") === "true")
        return true;

      const tagName = target.tagName.toLowerCase();

      if (["textarea", "button"].includes(tagName)) return true;

      if (tagName === "input") {
        const input = target as HTMLInputElement;

        return ["checkbox", "button", "submit"].includes(input.type);
      }

      return false;
    },
    onBoundaryFocus: (direction) => {
      if (direction !== 1) return false;

      return onFocusNextSection?.() ?? false;
    },
  });

  const payTypeOptions = [
    { value: INVOICE_PAY_TYPES.VALUE, label: t("payTypeOptions.value") },
    { value: INVOICE_PAY_TYPES.WAGES, label: t("payTypeOptions.wages") },
    {
      value: INVOICE_PAY_TYPES.VALUE_AND_WAGES,
      label: t("payTypeOptions.valueAndWages"),
    },
  ] as const;

  const handlePayTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = Number(event.target.value);
    const validValues = payTypeOptions.map((option) => option.value);

    if (validValues.includes(nextValue as InvoicePayType)) {
      setPayType(nextValue as InvoicePayType);
    }
  };

  const resolveCustomerValue = (cust: Customer) =>
    String(cust.cust_code ?? cust.id ?? "");

  const findCustomerByValue = useCallback(
    (value: string | null): Customer | null => {
      if (!value) return null;
      const normalized = String(value);

      const matchByCode = customers.find(
        (cust) =>
          cust.cust_code !== undefined &&
          cust.cust_code !== null &&
          String(cust.cust_code) === normalized,
      );

      if (matchByCode) return matchByCode;

      const matchById = customers.find(
        (cust) => String(cust.id ?? "") === normalized,
      );

      if (matchById) return matchById;

      return null;
    },
    [customers],
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((cust) =>
        paymentMethod === PaymentTypes.CASH
          ? cust.cust_type === 99
          : cust.cust_type !== 99,
      ),
    [customers, paymentMethod],
  );

  const mapCustomerToOption = useCallback(
    (cust: Customer): CustomerOption => {
      const value = resolveCustomerValue(cust);
      const codeToShow =
        cust.cust_code !== undefined && cust.cust_code !== null
          ? String(cust.cust_code)
          : String(cust.id ?? "");
      const displayName =
        cust.cust_name && cust.cust_name.trim().length > 0
          ? cust.cust_name
          : getFallbackName(codeToShow);

      return {
        value,
        label: `${displayName} - ${codeToShow}`,
      };
    },
    [getFallbackName],
  );

  const filteredCustomersOptions = useMemo(
    () => filteredCustomers.map(mapCustomerToOption),
    [filteredCustomers, mapCustomerToOption],
  );

  const currentCustomer = useMemo(
    () => findCustomerByValue(selectedCustomer),
    [findCustomerByValue, selectedCustomer],
  );

  const selectedOption = useMemo(() => {
    if (selectedCustomer === null || selectedCustomer === undefined) {
      return null;
    }

    if (currentCustomer) {
      return mapCustomerToOption(currentCustomer);
    }

    const fallbackLabel =
      selectedCustomerName && selectedCustomerName.trim().length > 0
        ? `${selectedCustomerName} - ${selectedCustomer}`
        : String(selectedCustomer);

    return {
      value: String(selectedCustomer),
      label: fallbackLabel,
    };
  }, [
    currentCustomer,
    mapCustomerToOption,
    selectedCustomer,
    selectedCustomerName,
  ]);

  const isReturnInvoice =
    invoiceType === TransTypes.PURCHASE_RETURN ||
    invoiceType === TransTypes.SALES_RETURN;

  const rawCustomerId =
    currentCustomer?.id ??
    (selectedCustomer !== null ? selectedCustomer : null);
  const numericCustomerId =
    rawCustomerId !== null &&
    rawCustomerId !== undefined &&
    rawCustomerId !== ""
      ? Number(rawCustomerId)
      : NaN;
  const hasCustomerId = Number.isFinite(numericCustomerId);

  const { customerInvoiceOptions, isCustomerInvoicesLoading } =
    useCustomerInvoices({
      isReturnInvoice,
      hasCustomerId,
      invoiceType,
      numericCustomerId,
    });

  useEffect(() => {
    if (isEditing) {
      customerSelectRef.current?.focus();
    }
  }, [isEditing]);

  const selectedReferenceOption = useMemo(() => {
    if (!referenceNumber || referenceNumber.trim().length === 0) {
      return null;
    }

    return (
      customerInvoiceOptions.find(
        (option) => String(option.value) === String(referenceNumber),
      ) ?? {
        value: referenceNumber,
        label: referenceNumber,
      }
    );
  }, [customerInvoiceOptions, referenceNumber]);

  const applyCustomerFields = (selectedCust: Customer | null) => {
    setSelectedCustomerName(selectedCust?.cust_name ?? "");
    setMobileMethod(selectedCust?.mobile ?? "");
    setHandlingMethod(selectedCust?.handling?.toString() ?? "");
    setVatNumber(selectedCust?.vat_no ?? "");
    setCrNo(selectedCust?.cr_no ?? "");
    setGov(selectedCust?.gov ?? "");
    setCity(selectedCust?.city ?? "");
    setArea(selectedCust?.area ?? "");
    setStreet(selectedCust?.street ?? "");
    setBuildNo(selectedCust?.build_no ?? "");
    setPostNo(selectedCust?.post_no ?? "");
    setPostCode(selectedCust?.post_code ?? "");
  };

  const handleCustomerChange = (option: CustomerOption | null) => {
    const nextValue = option?.value ?? null;

    setSelectedCustomer(nextValue);
    setReferenceNumber("");
    applyCustomerFields(findCustomerByValue(nextValue));
  };

  return (
    <div ref={selectorsRef} onKeyDownCapture={handleKeyDown}>
      <BaseModal
        className="font-cairo"
        isOpen={isNoteModalOpen}
        title={t("noteLabel")}
        onClose={() => setIsNoteModalOpen(false)}
      >
        <div className="w-full">
          <textarea
            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none min-h-[120px]"
            dir="auto"
            placeholder={t("noteLabel")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </BaseModal>

      <div className="grid grid-cols-1 gap-2">
        {/* معلومات الفاتورة الأساسية */}
        <div className="bg-white border border-gray-200 rounded-lg p-2 md:p-3">
          <div className="grid grid-cols-1 gap-2 text-xs">
            {/* <div>
              <label
                className="block mb-1 font-medium text-gray-700 text-xs"
                htmlFor="invoice-date"
              >
                {`${t("invoiceDateLabel")}:`}
              </label>
              {isEditing && isDateEditMode ? (
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="invoice-date"
                  type="datetime-local"
                  value={toLocalDateTimeInputValue(invoiceDate)}
                  onBlur={() => setIsDateEditMode(false)}
                  onChange={(e) => handleInvoiceDateChange(e.target.value)}
                />
              ) : (
                <button
                  className="w-full h-[32px] border px-2 rounded text-xs text-right bg-white hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={!isEditing}
                  id="invoice-date"
                  type="button"
                  onClick={() => setIsDateEditMode(true)}
                >
                  {formattedInvoiceDate || "—"}
                </button>
              )}
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="md:col-span-2">
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="customer-select"
                >
                  {partyLabel + ":"}
                </label>
                <ReactSelect
                  ref={customerSelectRef}
                  isSearchable
                  className="w-full text-xs"
                  classNamePrefix="react-select"
                  components={{ IndicatorSeparator: () => null }}
                  instanceId="customer-select"
                  isDisabled={!isEditing}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  menuPosition="fixed"
                  options={filteredCustomersOptions}
                  placeholder={partyPlaceholder}
                  styles={{
                    control: (base) => ({
                      ...base,
                      height: 32,
                      minHeight: 32,
                      fontSize: "12px",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base) => ({ ...base, fontSize: "12px" }),
                    placeholder: (base) => ({ ...base, fontSize: "12px" }),
                    singleValue: (base) => ({ ...base, fontSize: "12px" }),
                  }}
                  value={selectedOption}
                  onChange={handleCustomerChange}
                />
              </div>

              <div>
                <span className="block mb-1 font-medium text-gray-700 text-xs">
                  {`${t("paymentMethodLabel")}:`}
                </span>
                <div className="w-full h-[32px] border rounded flex items-center justify-around px-2 bg-gray-50 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      checked={paymentMethod === PaymentTypes.CASH}
                      disabled={!isEditing}
                      name="payment"
                      type="radio"
                      value={PaymentTypes.CASH}
                      onChange={(e) => {
                        setPaymentMethod(
                          Number(e.target.value) as PaymentTypes,
                        );
                        setSelectedCustomer(null);
                        setSelectedCustomerName("");
                      }}
                    />
                    {t("paymentMethods.cash")}
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      checked={paymentMethod === PaymentTypes.CREDIT}
                      disabled={!isEditing}
                      name="payment"
                      type="radio"
                      value={PaymentTypes.CREDIT}
                      onChange={(e) => {
                        setPaymentMethod(
                          Number(e.target.value) as PaymentTypes,
                        );
                        setSelectedCustomer(null);
                        setSelectedCustomerName("");
                      }}
                    />
                    {t("paymentMethods.credit")}
                  </label>
                </div>
              </div>

              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="pay-type"
                >
                  {`${t("payTypeLabel")}:`}
                </label>
                <select
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  disabled={!isEditing}
                  id="pay-type"
                  value={payType}
                  onChange={handlePayTypeChange}
                >
                  {payTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {isReturnInvoice ? (
                <div>
                  <label
                    className="block mb-1 font-medium text-gray-700 text-xs"
                    htmlFor="reference-number"
                  >
                    {customerInvoicesLabel + ":"}
                  </label>
                  <ReactSelect
                    isSearchable
                    className="w-full text-xs"
                    classNamePrefix="react-select"
                    components={{ IndicatorSeparator: () => null }}
                    id="reference-number"
                    instanceId="invoice-select"
                    isDisabled={!isEditing || !hasCustomerId}
                    isLoading={isCustomerInvoicesLoading}
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    options={customerInvoiceOptions}
                    placeholder={t("customerInvoicesPlaceholder")}
                    styles={{
                      control: (base) => ({
                        ...base,
                        height: 32,
                        minHeight: 32,
                        fontSize: "12px",
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      option: (base) => ({ ...base, fontSize: "12px" }),
                      placeholder: (base) => ({ ...base, fontSize: "12px" }),
                      singleValue: (base) => ({ ...base, fontSize: "12px" }),
                    }}
                    value={selectedReferenceOption}
                    onChange={(opt) => {
                      const val = opt?.value ? String(opt.value) : "";

                      setReferenceNumber(val);
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label
                    className="block mb-1 font-medium text-gray-700 text-xs"
                    htmlFor="reference-number"
                  >
                    {`${t("referenceLabel")}:`}
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-xs"
                    disabled={!isEditing}
                    id="reference-number"
                    placeholder={t("referencePlaceholder")}
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="handling-method"
                >
                  {`${t("handlingLabel")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  disabled={!isEditing}
                  type="text"
                  value={handlingMethod}
                  onChange={(e) => setHandlingMethod(e.target.value)}
                />
              </div>

              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="employee"
                >
                  {`${t("employeeLabel")}:`}
                </label>
                <select
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  disabled={!isEditing}
                  id="employee"
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                >
                  <option value="">{t("employeePlaceholder")}</option>
                  <option value="hashem">هاشم</option>
                  <option value="othman">عثمان</option>
                </select>
              </div>

              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="gold-price"
                >
                  {`${t("goldPriceLabel")}:`}
                </label>
                <input
                  readOnly
                  className="w-full h-[32px] border px-2 rounded bg-gray-100 text-xs"
                  disabled={!isEditing}
                  type="text"
                  value={goldPrice ? `${goldPrice} ﷼` : t("goldPriceLoading")}
                />
              </div>
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="note"
                >
                  {`${t("noteLabel")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  disabled={!isEditing}
                  id="note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onDoubleClick={() => {
                    if (isEditing) {
                      setIsNoteModalOpen(true);
                    }
                  }}
                />
              </div>

              {/* Barcode Search Section */}
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="search-barcode"
                >
                  {`${t("barcodeLabel")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  disabled={!isEditing}
                  id="search-barcode"
                  placeholder={t("barcodePlaceholder")}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onBarcodeSearch();
                    }
                  }}
                />
                {/* <button
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={!isEditing || !searchValue.trim()}
                  onClick={onBarcodeSearch}
                >
                  بحث
                </button> */}
              </div>
            </div>
          </div>
        </div>

        <InvoiceAddressSection
          isEditing={isEditing}
          selectedCustomer={selectedCustomer}
          partyKey={partyKey}
          setVatNumber={setVatNumber}
          crNo={crNo}
          setCrNo={setCrNo}
          gov={gov}
          setGov={setGov}
          city={city}
          setCity={setCity}
          area={area}
          setArea={setArea}
          street={street}
          setStreet={setStreet}
          buildNo={buildNo}
          setBuildNo={setBuildNo}
          postNo={postNo}
          setPostNo={setPostNo}
          postCode={postCode}
          setPostCode={setPostCode}
          mobileMethod={mobileMethod}
          setMobileMethod={setMobileMethod}
        />

        {invoiceType === 1 && (
          <InvoiceAdditionalExpansesSection
            isEditing={isEditing}
            accounts={accounts}
            additionalExpansesRef={additionalExpansesRef}
          />
        )}
      </div>
    </div>
  );
}
