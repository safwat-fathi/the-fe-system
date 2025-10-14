"use client";

import { Dispatch, SetStateAction } from "react";
import ReactSelect from "react-select";

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
  setSelectedCustomer: Dispatch<SetStateAction<string | null>>;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  payType: number;
  setPayType: (val: number) => void;
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
  setSelectedCustomer,
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
  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* معلومات الفاتورة الأساسية */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            📋 معلومات الفاتورة
          </h3>
          <div className="grid grid-cols-1 gap-1 text-xs">
            {/* تاريخ ووقت الفاتورة */}
            {invoiceDate !== undefined && setInvoiceDate && (
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="invoice-date"
                >
                  تاريخ ووقت الفاتورة:
                </label>
                <input
                  id="invoice-date"
                  type="datetime-local"
                  className="w-full h-[32px] border px-2 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={invoiceDate ? new Date(invoiceDate).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label
                className="block mb-1 font-medium text-gray-700 text-xs"
                htmlFor="customer-select"
              >
                {invoiceType === "purchase" || invoiceType === "purchase_return"
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
                options={customers
                  .filter((cust) =>
                    paymentMethod === "cash"
                      ? cust.cust_type === 99
                      : cust.cust_type !== 99,
                  )
                  .map((cust) => ({
                    value: cust.id,
                    label: `${cust.cust_code ?? cust.id} - ${cust.cust_name}`,
                  }))}
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
                value={
                  selectedCustomer
                    ? {
                        value: selectedCustomer,
                        label: `${
                          customers.find((c) => c.id === selectedCustomer)
                            ?.cust_code ?? selectedCustomer
                        } - ${
                          customers.find((c) => c.id === selectedCustomer)
                            ?.cust_name ||
                          `${invoiceType === "purchase" || invoiceType === "purchase_return" ? "مورد" : "عميل"} رقم ${selectedCustomer}`
                        }`,
                      }
                    : null
                }
                onChange={(selectedOption) => {
                  setSelectedCustomer(selectedOption?.value ?? null);
                  setReferenceNumber("");

                  const selectedCust = customers.find(
                    (c) => c.id === selectedOption?.value,
                  );

                  if (selectedCust) {
                    setMobileMethod(selectedCust.mobile ?? "");
                    setHandlingMethod(selectedCust.handling?.toString() ?? "");
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
              />
            </div>

            <div className="grid grid-cols-2 gap-1">
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
                      }}
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
                      }}
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
                  onChange={(e) => setPayType(parseInt(e.target.value))}
                >
                  <option value={1}>القيمة</option>
                  <option value={2}>الأجور</option>
                  <option value={3}>قيمة وأجور</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
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
                    menuPosition="fixed"
                    options={(saleInvoices || [])
                      .filter((inv) =>
                        selectedCustomer ? inv.cust === selectedCustomer : true,
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
                  />
                </div>
              )}

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
                  placeholder="الرقم الضريبي"
                  type="text"
                  value={vatNumber}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="handling-method"
                >
                  مناولة:
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  placeholder="مناولة"
                  type="text"
                  value={handlingMethod}
                  onChange={(e) => setHandlingMethod(e.target.value)}
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
                  placeholder=" الجوال"
                  type="text"
                  value={mobileMethod}
                  onChange={(e) => setMobileMethod(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
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
                placeholder="البيان"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* مربع معلومات العنوان والباركود */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
            📍 معلومات العنوان
          </h3>
          {selectedCustomer ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    السجل التجاري:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                    placeholder="رقم السجل"
                    type="text"
                    value={crNo}
                    onChange={(e) => setCrNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    المحافظة:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                    placeholder="اسم المحافظة"
                    type="text"
                    value={gov}
                    onChange={(e) => setGov(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    المدينة:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                    placeholder="اسم المدينة"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    المنطقة:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                    placeholder="اسم المنطقة"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    الشارع:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                    placeholder="اسم الشارع"
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    رقم المبنى:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                    placeholder="رقم المبنى"
                    type="text"
                    value={buildNo}
                    onChange={(e) => setBuildNo(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    صندوق البريد:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                    placeholder="رقم صندوق البريد"
                    type="text"
                    value={postNo}
                    onChange={(e) => setPostNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-600">
                    الرمز البريدي:
                  </label>
                  <input
                    className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                    placeholder="الرمز البريدي"
                    type="text"
                    value={postCode}
                    onChange={(e) => setPostCode(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">📍</div>
              <p className="text-sm">
                اختر{" "}
                {invoiceType === "purchase" || invoiceType === "purchase_return"
                  ? "مورداً"
                  : "عميلاً"}{" "}
                لعرض معلومات العنوان
              </p>
            </div>
          )}

          {/* حقل البحث بالباركود - تحت العنوان */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg
                height="24"
                id="mdi-barcode-scan"
                version="1.1"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
              >
                <path d="M4,6H6V18H4V6M7,6H8V18H7V6M9,6H12V18H9V6M13,6H14V18H13V6M16,6H18V18H16V6M19,6H20V18H19V6M2,4V8H0V4A2,2 0 0,1 2,2H6V4H2M22,2A2,2 0 0,1 24,4V8H22V4H18V2H22M2,16V20H6V22H2A2,2 0 0,1 0,20V16H2M22,20V16H24V20A2,2 0 0,1 22,22H18V20H22Z" />
              </svg>
              البحث بالباركود
            </h4>
            <div className="flex items-center gap-3">
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
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
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
  );
}
