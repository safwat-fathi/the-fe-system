"use client";

import ReactSelect from "react-select";
import CreatableSelect from "react-select/creatable";

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_price: number;
  karat: string;
}

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
        <label className="block mb-1">العميل:</label>
        <ReactSelect
          instanceId="customer-select"
          className="w-full text-sm"
          classNamePrefix="react-select"
          isSearchable
          options={customers
            .filter((cust) =>
              paymentMethod === "cash" ? cust.cust_type === 99 : cust.cust_type !== 99
            )
            .map((cust) => ({
              value: cust.id,
              label: `${cust.cust_code ?? cust.id} - ${cust.cust_name}`,
            }))}
          value={
            selectedCustomer
              ? {
                  value: selectedCustomer,
                  label: `${
                    customers.find((c) => c.id === selectedCustomer)?.cust_code ?? selectedCustomer
                  } - ${
                    customers.find((c) => c.id === selectedCustomer)?.cust_name || `عميل رقم ${selectedCustomer}`
                  }`,
                }
              : null
          }
          onChange={(selectedOption) => {
            setSelectedCustomer(selectedOption?.value ?? null);

            const selectedCust = customers.find((c) => c.id === selectedOption?.value);

            if (selectedCust) {
              if (selectedCust.mobile) setMobileMethod(selectedCust.mobile);
              if (selectedCust.acc) setHandlingMethod(selectedCust.handling?.toString() || "");
              if (selectedCust.vat_no) setVatNumber(selectedCust.vat_no);
            }
          }}
          placeholder="اختر العميل..."
          styles={{
            control: (base) => ({ ...base, height: 38, minHeight: 38 }),
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          }}
          menuPortalTarget={typeof window !== "undefined" ? document.body : null}
          menuPosition="fixed"
          components={{ IndicatorSeparator: () => null }}
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1">طريقة الدفع:</label>
        <div className="w-full h-[38px] border rounded flex items-center justify-around px-2">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="payment"
              value="cash"
              checked={paymentMethod === "cash"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            نقداً
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="payment"
              value="credit"
              checked={paymentMethod === "credit"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            أجل
          </label>
        </div>
      </div>

      <div className="col-span-4">
        <label className="block mb-1">على:</label>
        <select
          className="w-full h-[38px] border px-2 rounded"
          value={payType}
          onChange={(e) => setPayType(parseInt(e.target.value))}
        >
          <option value={1}>القيمة</option>
          <option value={2}>الأجور</option>
          <option value={3}>قيمة وأجور</option>
        </select>
      </div>

      <div className="col-span-4">
        <label className="block mb-1">رقم المرجع:</label>
        <input
          type="text"
          className="w-full h-[38px] border px-2 rounded"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder=" المرجع "
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1">الرقم الضريبي:</label>
        <input
          type="text"
          className="w-full h-[38px] border px-2 rounded"
          value={vatNumber}
          readOnly
          placeholder="الرقم الضريبي"
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1">مناولة:</label>
        <input
          type="text"
          className="w-full h-[38px] border px-2 rounded"
          value={handlingMethod}
          onChange={(e) => setHandlingMethod(e.target.value)}
          placeholder="مناولة"
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1">جوال:</label>
        <input
          type="text"
          className="w-full h-[38px] border px-2 rounded"
          value={mobileMethod}
          onChange={(e) => setMobileMethod(e.target.value)}
          placeholder=" الجوال"
        />
      </div>

      <div className="col-span-4">
        <label className="block mb-1">البائع:</label>
        <select
          className="w-full h-[38px] border px-2 rounded"
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
        >
          <option value="">-- اختر --</option>
          <option value="hashem">هاشم</option>
          <option value="othman">عثمان</option>
        </select>
      </div>

      <div className="col-span-4">
        <label className="block mb-1">سعر الذهب بالريال:</label>
        <input
          type="text"
          className="w-full h-[38px] border px-2 rounded bg-gray-100"
          value={goldPrice ? `${goldPrice} ﷼` : "جاري التحميل..."}
          readOnly
        />
      </div>

      <div className="col-span-12">
        <label className="block mb-1">البيان:</label>
        <input
          type="text"
          className="w-full h-[38px] border px-2 rounded"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="البيان"
        />
      </div>

      <div className="col-span-12 text-sm text-gray-700">
        {(() => {
          const cust = customers.find((c) => c.id === selectedCustomer);
          if (!cust) return null;
          return (
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
              {cust.cr_no && <span>السجل: {cust.cr_no}</span>}
              {cust.gov && <span>العنوان: {cust.gov}</span>}
              {cust.city && <span>المدينة: {cust.city}</span>}
              {cust.area && <span>المنطقة: {cust.area}</span>}
              {cust.street && <span>الشارع: {cust.street}</span>}
              {cust.build_no && <span>مبنى: {cust.build_no}</span>}
              {cust.post_no && <span>ص.ب: {cust.post_no}</span>}
              {cust.post_code && <span>الرمز: {cust.post_code}</span>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

