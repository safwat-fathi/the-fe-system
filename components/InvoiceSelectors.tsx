"use client";

import ReactSelect from "react-select";

interface Customer {
  id: number;
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
  selectedCustomer: number | null;
  setSelectedCustomer: (id: number | null) => void;
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
}: Props) {
  return (
    <div className="grid grid-cols-12 gap-2 text-sm mb-4">
      <div className="col-span-4">
        <label className="block mb-1" htmlFor="customer-select">
          العميل:
        </label>
        <ReactSelect
          isSearchable
          className="w-full text-sm"
          classNamePrefix="react-select"
          components={{ IndicatorSeparator: () => null }}
          inputId="customer-select"
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
          placeholder="اختر العميل..."
          styles={{
            control: (base) => ({ ...base, height: 38, minHeight: 38 }),
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
                      ?.cust_name || `عميل رقم ${selectedCustomer}`
                  }`,
                }
              : null
          }
          onChange={(selectedOption) => {
            setSelectedCustomer(selectedOption?.value ?? null);

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

      <div className="col-span-4">
        <span className="block mb-1">طريقة الدفع:</span>
        <div className="w-full h-[38px] border rounded flex items-center justify-around px-2">
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

      <div className="col-span-4">
        <label className="block mb-1" htmlFor="pay-type">
          على:
        </label>
        <select
          className="w-full h-[38px] border px-2 rounded"
          id="pay-type"
          value={payType}
          onChange={(e) => setPayType(parseInt(e.target.value))}
        >
          <option value={1}>القيمة</option>
          <option value={2}>الأجور</option>
          <option value={3}>قيمة وأجور</option>
        </select>
      </div>

      <div className="col-span-4">
        <label className="block mb-1" htmlFor="reference-number">
          رقم المرجع:
        </label>
        <input
          className="w-full h-[38px] border px-2 rounded"
          id="reference-number"
          placeholder=" المرجع "
          type="text"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1" htmlFor="vat-number">
          الرقم الضريبي:
        </label>
        <input
          readOnly
          className="w-full h-[38px] border px-2 rounded"
          id="vat-number"
          placeholder="الرقم الضريبي"
          type="text"
          value={vatNumber}
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1" htmlFor="handling-method">
          مناولة:
        </label>
        <input
          className="w-full h-[38px] border px-2 rounded"
          id="handling-method"
          placeholder="مناولة"
          type="text"
          value={handlingMethod}
          onChange={(e) => setHandlingMethod(e.target.value)}
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1" htmlFor="mobile-method">
          جوال:
        </label>
        <input
          className="w-full h-[38px] border px-2 rounded"
          id="mobile-method"
          placeholder=" الجوال"
          type="text"
          value={mobileMethod}
          onChange={(e) => setMobileMethod(e.target.value)}
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1" htmlFor="employee">
          البائع:
        </label>
        <select
          className="w-full h-[38px] border px-2 rounded"
          id="employee"
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
        >
          <option value="">-- اختر --</option>
          <option value="hashem">هاشم</option>
          <option value="othman">عثمان</option>
        </select>
      </div>

      <div className="col-span-4">
        <label className="block mb-1" htmlFor="gold-price">
          سعر الذهب بالريال:
        </label>
        <input
          readOnly
          className="w-full h-[38px] border px-2 rounded bg-gray-100"
          id="gold-price"
          type="text"
          value={goldPrice ? `${goldPrice} ﷼` : "جاري التحميل..."}
        />
      </div>

      <div className="col-span-12">
        <label className="block mb-1" htmlFor="note">
          البيان:
        </label>
        <input
          className="w-full h-[38px] border px-2 rounded"
          id="note"
          placeholder="البيان"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="col-span-12 text-sm text-gray-700">
        {selectedCustomer && (
          <div className="mt-2 grid grid-cols-4 gap-2">
            <input
              className="w-full h-[38px] border px-2 rounded"
              placeholder="السجل"
              type="text"
              value={crNo}
              onChange={(e) => setCrNo(e.target.value)}
            />
            <input
              className="w-full h-[38px] border px-2 rounded"
              placeholder="العنوان"
              type="text"
              value={gov}
              onChange={(e) => setGov(e.target.value)}
            />
            <input
              className="w-full h-[38px] border px-2 rounded"
              placeholder="المدينة"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <input
              className="w-full h-[38px] border px-2 rounded"
              placeholder="المنطقة"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <input
              className="w-full h-[38px] border px-2 rounded"
              placeholder="الشارع"
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
            <input
              className="w-full h-[38px] border px-2 rounded"
              placeholder="مبنى"
              type="text"
              value={buildNo}
              onChange={(e) => setBuildNo(e.target.value)}
            />
            <input
              className="w-full h-[38px] border px-2 rounded"
              placeholder="ص.ب"
              type="text"
              value={postNo}
              onChange={(e) => setPostNo(e.target.value)}
            />
            <input
              className="w-full h-[38px] border px-2 rounded"
              placeholder="الرمز"
              type="text"
              value={postCode}
              onChange={(e) => setPostCode(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
