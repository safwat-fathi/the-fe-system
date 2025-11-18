"use client";

import { ChangeEvent, Dispatch, SetStateAction, useRef, useState } from "react";
import ReactSelect from "react-select";

import useKeyAsTab from "@/hooks/useKeyAsTab";
import { INVOICE_PAY_TYPES, type InvoicePayType } from "@/types/models/invoice";

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

interface Props {
  customers: Customer[];
  selectedCustomer: string | null;
  selectedCustomerName: string;
  setSelectedCustomer: Dispatch<SetStateAction<string | null>>;
  setSelectedCustomerName: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  payType: InvoicePayType;
  setPayType: (val: InvoicePayType) => void;
  referenceNumber: string;
  setReferenceNumber: (val: string) => void;
  vatNumber: string;
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
  // saleInvoices?: { inv_id: number }[];
  saleInvoices?: { inv_id: string; cust?: string }[];
  onInvoiceSelect?: (invoiceId: number) => void;
  // البحث بالباركود
  searchValue: string;
  setSearchValue: (val: string) => void;
  onBarcodeSearch: () => void;
  isEditing: boolean;
  invoiceType?: "purchase" | "sale" | "purchase_return" | "sale_return";
  // التاريخ والوقت
  invoiceDate?: string;
  setInvoiceDate?: (val: string) => void;
}

export default function InvoiceSelectors({
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
  vatNumber,
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
  saleInvoices,
  onInvoiceSelect,
  // البحث بالباركود
  searchValue,
  setSearchValue,
  onBarcodeSearch,
  isEditing,
  invoiceType = "sale",
  // التاريخ والوقت
  invoiceDate,
  setInvoiceDate,
}: Props) {
  const selectorsRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  const { handleKeyDown } = useKeyAsTab({
    keys: ["Enter"],
    containerRef: selectorsRef,
    disabled: !isEditing,
    shouldIgnoreEvent: (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return false;
      if (target.closest("[data-skip-key-as-tab='true']")) {
        return true;
      }
      const comboRoot = target.closest('[role="combobox"]');
      if (comboRoot && comboRoot.getAttribute("aria-expanded") === "true") {
        return true;
      }
      const tagName = target.tagName.toLowerCase();
      if (tagName === "textarea" || tagName === "button") {
        return true;
      }
      if (tagName === "input") {
        const input = target as HTMLInputElement;
        if (
          input.type === "checkbox" ||
          input.type === "button" ||
          input.type === "submit"
        ) {
          return true;
        }
      }
      return false;
    },
  });

  const payTypeOptions = [
    { value: INVOICE_PAY_TYPES.VALUE, label: "القيمة" },
    { value: INVOICE_PAY_TYPES.WAGES, label: "الأجور" },
    { value: INVOICE_PAY_TYPES.VALUE_AND_WAGES, label: "قيمة وأجور" },
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

  const findCustomerByValue = (value: string | null): Customer | null => {
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
  };

  const filteredCustomers = customers.filter((cust) =>
    paymentMethod === "cash" ? cust.cust_type === 99 : cust.cust_type !== 99,
  );

  const mapCustomerToOption = (cust: Customer) => {
    const value = resolveCustomerValue(cust);
    const codeToShow =
      cust.cust_code !== undefined && cust.cust_code !== null
        ? String(cust.cust_code)
        : String(cust.id ?? "");
    const displayName =
      cust.cust_name && cust.cust_name.trim().length > 0
        ? cust.cust_name
        : `عميل ${codeToShow}`;

    return {
      value,
      label: `${displayName} - ${codeToShow}`,
    };
  };

  const selectOptions = filteredCustomers.map(mapCustomerToOption);

  const currentCustomer = findCustomerByValue(selectedCustomer);
  const selectedOption =
    selectedCustomer !== null && selectedCustomer !== undefined
      ? currentCustomer
        ? mapCustomerToOption(currentCustomer)
        : {
            value: String(selectedCustomer),
            label:
              selectedCustomerName && selectedCustomerName.trim().length > 0
                ? `${selectedCustomerName} - ${selectedCustomer}`
                : String(selectedCustomer),
          }
      : null;

  return (
    <div ref={selectorsRef} onKeyDownCapture={handleKeyDown}>
      <div className="grid grid-cols-1 gap-2">
        {/* معلومات الفاتورة الأساسية */}
        <div className="bg-white border border-gray-200 rounded-lg p-2 md:p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            📋 معلومات الفاتورة
          </h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {/* تاريخ ووقت الفاتورة */}
            {invoiceDate && (
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="invoice-date"
                >
                  تاريخ ووقت الفاتورة:
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="invoice-date"
                  type="datetime-local"
                  value={
                    invoiceDate
                      ? new Date(invoiceDate).toISOString().slice(0, 16)
                      : ""
                  }
                  disabled={!isEditing}
                  onChange={(e) => setInvoiceDate?.(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="md:col-span-2">
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="customer-select"
                >
                  {invoiceType === "purchase" ||
                  invoiceType === "purchase_return"
                    ? "المورد:"
                    : "العميل:"}
                </label>
                <ReactSelect
                  isSearchable
                  className="w-full text-xs"
                  classNamePrefix="react-select"
                  components={{ IndicatorSeparator: () => null }}
                  instanceId="customer-select"
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  menuPosition="fixed"
                  options={selectOptions}
                  placeholder={
                    invoiceType === "purchase" ||
                    invoiceType === "purchase_return"
                      ? "اختر المورد..."
                      : "اختر العميل..."
                  }
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
                  onChange={(selectedOption) => {
                    const nextValue = selectedOption?.value ?? null;

                    setSelectedCustomer(nextValue);
                    setReferenceNumber("");

                    const selectedCust = findCustomerByValue(nextValue);

                    if (selectedCust) {
                      setSelectedCustomerName(selectedCust.cust_name ?? "");
                      setMobileMethod(selectedCust.mobile ?? "");
                      setHandlingMethod(
                        selectedCust.handling?.toString() ?? "",
                      );
                      setVatNumber(selectedCust.vat_no ?? "");
                      setCrNo(selectedCust.cr_no ?? "");
                      setGov(selectedCust.gov ?? "");
                      setCity(selectedCust.city ?? "");
                      setArea(selectedCust.area ?? "");
                      setStreet(selectedCust.street ?? "");
                      setBuildNo(selectedCust.build_no ?? "");
                      setPostNo(selectedCust.post_no ?? "");
                      setPostCode(selectedCust.post_code ?? "");
                    } else {
                      setSelectedCustomerName("");
                      setMobileMethod("");
                      setHandlingMethod("");
                      setVatNumber("");
                      setCrNo("");
                      setGov("");
                      setCity("");
                      setArea("");
                      setStreet("");
                      setBuildNo("");
                      setPostNo("");
                      setPostCode("");
                    }
                  }}
                  isDisabled={!isEditing}
                />
              </div>

              <div>
                <span className="block mb-1 font-medium text-gray-700 text-xs">
                  طريقة الدفع:
                </span>
                <div className="w-full h-[32px] border rounded flex items-center justify-around px-2 bg-gray-50 text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      checked={paymentMethod === "cash"}
                      name="payment"
                      type="radio"
                      value="cash"
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setSelectedCustomer(null);
                        setSelectedCustomerName("");
                      }}
                      disabled={!isEditing}
                    />
                    نقداً
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      checked={paymentMethod === "credit"}
                      name="payment"
                      type="radio"
                      value="credit"
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setSelectedCustomer(null);
                        setSelectedCustomerName("");
                      }}
                      disabled={!isEditing}
                    />
                    أجل
                  </label>
                </div>
              </div>

              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="pay-type"
                >
                  على:
                </label>
                <select
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  id="pay-type"
                  value={payType}
                  onChange={handlePayTypeChange}
                  disabled={!isEditing}
                >
                  {payTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {saleInvoices ? (
                <div>
                  <label
                    className="block mb-1 font-medium text-gray-700 text-xs"
                    htmlFor="reference-number"
                  >
                    فواتير{" "}
                    {invoiceType === "purchase" ||
                    invoiceType === "purchase_return"
                      ? "المورد"
                      : "العميل"}
                    :
                  </label>
                  <ReactSelect
                    isSearchable
                    className="w-full text-xs"
                    classNamePrefix="react-select"
                    components={{ IndicatorSeparator: () => null }}
                    instanceId="invoice-select"
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : null
                    }
                    isDisabled={!isEditing}
                    menuPosition="fixed"
                    options={(saleInvoices || [])
                      .filter((inv) =>
                        selectedCustomer
                          ? String(inv.cust ?? "") ===
                            String(selectedCustomer ?? "")
                          : true,
                      )
                      .map((inv) => ({
                        value: inv.inv_id,
                        label: String(inv.inv_id),
                      }))}
                    placeholder="اختر الفاتورة..."
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
                    value={
                      referenceNumber
                        ? {
                            value: Number(referenceNumber),
                            label: referenceNumber,
                          }
                        : null
                    }
                    onChange={(opt) => {
                      const val = opt?.value ? String(opt.value) : "";

                      setReferenceNumber(val);
                      if (opt?.value && onInvoiceSelect) {
                        const confirmLoad = window.confirm(
                          "هل تريد تنزيل أصناف الفاتورة المختارة؟",
                        );

                        if (confirmLoad) onInvoiceSelect(opt.value);
                      }
                    }}
                  />
                </div>
              ) : (
                <div>
                  <label
                    className="block mb-1 font-medium text-gray-700 text-xs"
                    htmlFor="reference-number"
                  >
                    رقم المرجع:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-xs"
                    placeholder=" المرجع "
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="vat-number"
                >
                  الرقم الضريبي:
                </label>
                <input
                  readOnly
                  className="w-full h-[32px] border px-2 rounded bg-gray-50 text-xs"
                  type="text"
                  value={vatNumber}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="handling-method"
                >
                  مناولة:
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  type="text"
                  value={handlingMethod}
                  onChange={(e) => setHandlingMethod(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="mobile-method"
                >
                  جوال:
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  type="text"
                  value={mobileMethod}
                  onChange={(e) => setMobileMethod(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="employee"
                >
                  البائع:
                </label>
                <select
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  id="employee"
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="">-- اختر --</option>
                  <option value="hashem">هاشم</option>
                  <option value="othman">عثمان</option>
                </select>
              </div>

              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="gold-price"
                >
                  سعر الذهب بالريال:
                </label>
                <input
                  readOnly
                  className="w-full h-[32px] border px-2 rounded bg-gray-100 text-xs"
                  type="text"
                  value={goldPrice ? `${goldPrice} ﷼` : "جاري التحميل..."}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <label
                className="block mb-1 font-medium text-gray-700 text-xs"
                htmlFor="note"
              >
                البيان:
              </label>
              <input
                className="w-full h-[32px] border px-2 rounded text-xs"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* مربع معلومات العنوان والباركود */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {/* Header with Toggle Button */}
          <div
            className="flex items-center justify-between p-2 md:p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <span>📍</span>
              <span>معلومات العنوان</span>
            </h3>
            <button
              className="text-gray-600 hover:text-gray-800 transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          {/* Collapsible Content */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: isOpen ? "1000px" : "0",
              opacity: isOpen ? 1 : 0,
            }}
          >
            <div className="px-3 pb-3 md:px-4 md:pb-4 border-t border-gray-200">
              {selectedCustomer ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      السجل التجاري:
                    </label>
                    <input
                      className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                      type="text"
                      value={crNo}
                      onChange={(e) => setCrNo(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      المحافظة:
                    </label>
                    <input
                      className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                      type="text"
                      value={gov}
                      onChange={(e) => setGov(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      المدينة:
                    </label>
                    <input
                      className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      المنطقة:
                    </label>
                    <input
                      className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      الشارع:
                    </label>
                    <input
                      className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      رقم المبنى:
                    </label>
                    <input
                      className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                      type="text"
                      value={buildNo}
                      onChange={(e) => setBuildNo(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      صندوق البريد:
                    </label>
                    <input
                      className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                      type="text"
                      value={postNo}
                      onChange={(e) => setPostNo(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">
                      الرمز البريدي:
                    </label>
                    <input
                      className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                      type="text"
                      value={postCode}
                      onChange={(e) => setPostCode(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6 md:py-8">
                  <div className="text-2xl mb-2">📍</div>
                  <p className="text-xs sm:text-sm">
                    اختر{" "}
                    {invoiceType === "purchase" ||
                    invoiceType === "purchase_return"
                      ? "مورداً"
                      : "عميلاً"}{" "}
                    لعرض معلومات العنوان
                  </p>
                </div>
              )}

              {/* Barcode Search Section */}
              <div className="mt-3 pt-3 md:mt-4 md:pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg
                    height="24"
                    width="24"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4,6H6V18H4V6M7,6H8V18H7V6M9,6H12V18H9V6M13,6H14V18H13V6M16,6H18V18H16V6M19,6H20V18H19V6M2,4V8H0V4A2,2 0 0,1 2,2H6V4H2M22,2A2,2 0 0,1 24,4V8H22V4H18V2H22M2,16V20H6V22H2A2,2 0 0,1 0,20V16H2M22,20V16H24V20A2,2 0 0,1 22,22H18V20H22Z" />
                  </svg>
                  البحث بالباركود
                </h4>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <input
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    disabled={!isEditing}
                    placeholder="أدخل كود الصنف"
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
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!isEditing || !searchValue.trim()}
                    onClick={onBarcodeSearch}
                  >
                    بحث
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
