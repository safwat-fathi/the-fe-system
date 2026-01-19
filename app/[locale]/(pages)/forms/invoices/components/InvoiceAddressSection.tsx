import { useState } from "react";
import { useTranslations } from "next-intl";

interface InvoiceAddressSectionProps {
  isEditing: boolean;
  selectedCustomer: string | null;
  partyKey: "customer" | "supplier";
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
  mobileMethod: string;
  setMobileMethod: (val: string) => void;
}

export default function InvoiceAddressSection({
  isEditing,
  selectedCustomer,
  partyKey,
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
  mobileMethod,
  setMobileMethod,
}: InvoiceAddressSectionProps) {
  const t = useTranslations("forms.invoices.selectors");
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const addressEmptyText = t(`address.empty.${partyKey}`);

  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header with Toggle Button */}
      <div
        role="button"
        className="flex items-center justify-between p-2 md:p-3 hover:bg-gray-50 transition-colors"
        onClick={() => setIsAddressOpen(!isAddressOpen)}
      >
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span>📍</span>
          <span>{t("address.title")}</span>
        </h3>
        <button
          className="pointer-events-none text-gray-600 hover:text-gray-800 transition-transform duration-200"
          style={{
            transform: isAddressOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
          tabIndex={-1}
        >
          <svg
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Collapsible Content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isAddressOpen ? "1000px" : "0",
          opacity: isAddressOpen ? 1 : 0,
        }}
      >
        <div className="px-3 pb-3 md:px-4 md:pb-4 border-t border-gray-200">
          {selectedCustomer ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-3">
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="vat-number"
                >
                  {`${t("fields.vatNumber")}:`}
                </label>
                <input
                  readOnly
                  className="w-full h-[32px] border px-2 rounded bg-gray-50 text-xs"
                  disabled={!isEditing}
                  type="text"
                  onChange={(e) => setVatNumber(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block mb-1 text-xs font-medium text-gray-600"
                  htmlFor="cr-no"
                >
                  {`${t("fields.crNumber")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                  disabled={!isEditing}
                  id="cr-no"
                  type="text"
                  value={crNo}
                  onChange={(e) => setCrNo(e.target.value)}
                />
              </div>

              <div>
                <label
                  className="block mb-1 text-xs font-medium text-gray-600"
                  htmlFor="gov"
                >
                  {`${t("fields.gov")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                  disabled={!isEditing}
                  id="gov"
                  type="text"
                  value={gov}
                  onChange={(e) => setGov(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block mb-1 text-xs font-medium text-gray-600"
                  htmlFor="city"
                >
                  {`${t("fields.city")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                  disabled={!isEditing}
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block mb-1 text-xs font-medium text-gray-600"
                  htmlFor="area"
                >
                  {`${t("fields.area")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                  disabled={!isEditing}
                  id="area"
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block mb-1 text-xs font-medium text-gray-600"
                  htmlFor="street"
                >
                  {`${t("fields.street")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                  disabled={!isEditing}
                  id="street"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block mb-1 text-xs font-medium text-gray-600"
                  htmlFor="build-no"
                >
                  {`${t("fields.building")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                  disabled={!isEditing}
                  id="build-no"
                  type="text"
                  value={buildNo}
                  onChange={(e) => setBuildNo(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block mb-1 text-xs font-medium text-gray-600"
                  htmlFor="post-no"
                >
                  {`${t("fields.postBox")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                  disabled={!isEditing}
                  id="post-no"
                  type="text"
                  value={postNo}
                  onChange={(e) => setPostNo(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block mb-1 text-xs font-medium text-gray-600"
                  htmlFor="post-code"
                >
                  {`${t("fields.postCode")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                  disabled={!isEditing}
                  id="post-code"
                  type="text"
                  value={postCode}
                  onChange={(e) => setPostCode(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="block mb-1 font-medium text-gray-700 text-xs"
                  htmlFor="mobile-method"
                >
                  {`${t("fields.mobile")}:`}
                </label>
                <input
                  className="w-full h-[32px] border px-2 rounded text-xs"
                  disabled={!isEditing}
                  type="text"
                  value={mobileMethod}
                  onChange={(e) => setMobileMethod(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-6 md:py-8">
              <div className="text-2xl mb-2">📍</div>
              <p className="text-xs sm:text-sm">{addressEmptyText}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
