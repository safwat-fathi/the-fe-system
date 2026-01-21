"use client";
import type { Customer as CustomerModel } from "@/types/models/customer";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ReactSelect from "react-select";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import customerService from "@/services/api/customer.service";

type CustomerFormMode = "view" | "edit" | "add";

export interface CustomerFormValues {
  id: number;
  cust_code?: string;
  cust_name: string;
  cust_name_e: string;
  mobile: number | string;
  email: string;
  address: string;
  vat_no: number | null;
  cr_no: number | null;
  phone: string;
  fax: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  build_no: string;
  post_code: string;
  cust_status: number;
  acc?: number;
  acc_name?: string;
  cust_type?: number;
  box_type: string;
  handling: string;
  handling_e?: string;
  perc?: number;
  expt?: boolean;
  hide?: boolean;
}

interface CustomerFormClientProps {
  mode: CustomerFormMode;
  initialCustomer: Partial<CustomerFormValues>;
  customerTypes: any[];
  customerStatus: any[];
  accounts: any[];
  boxTypes: any[];
  companyId: number;
}

const CustomerFormClient = ({
  mode,
  initialCustomer,
  customerTypes,
  customerStatus,
  accounts,
  boxTypes,
  companyId,
}: CustomerFormClientProps) => {
  const router = useRouter();
  const t = useTranslations("basic.customers" as any) as any;
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [customer, setCustomer] =
    useState<Partial<CustomerFormValues>>(initialCustomer);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange =
    (key: keyof CustomerFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setCustomer({
        ...customer,
        [key]: event.target.value,
      });
    };

  const handleNumberInputChange =
    (key: keyof CustomerFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setCustomer({
        ...customer,
        [key]: value ? Number(value) : null,
      });
    };

  const handleCheckboxChange = (key: "expt" | "hide") => (value: boolean) => {
    setCustomer({
      ...customer,
      [key]: value,
    });
  };

  const getTitle = () => {
    if (isAddMode) return t("titles.add");
    if (isViewMode)
      return t("titles.view", {
        name:
          customer.cust_name || customer.cust_code || t("titles.defaultName"),
      });

    return t("titles.edit", {
      name: customer.cust_name || customer.cust_code || t("titles.defaultName"),
    });
  };

  const handleSave = async () => {
    if (!customer.cust_name) {
      toast.error(t("messages.nameRequired"));

      return;
    }

    if (!customer.cust_type) {
      toast.error(t("messages.typeRequired"));

      return;
    }

    setIsSaving(true);

    try {
      const updatedCustomer = { ...customer };

      if (!updatedCustomer.cust_code) {
        updatedCustomer.cust_code = updatedCustomer.id
          ? String(updatedCustomer.id)
          : "";
      }

      const cleanedCustomer: Partial<CustomerModel> = {
        ...updatedCustomer,
        mobile: String(updatedCustomer.mobile) || null,
        acc: Number(updatedCustomer.acc) || null,
        vat_no: Number(updatedCustomer.vat_no) || null,
        cr_no: String(updatedCustomer.cr_no) || null,
        perc: Number(updatedCustomer.perc) || null,
        cust_type: Number(updatedCustomer.cust_type) || null,
        expt: !!updatedCustomer.expt,
        hide: !!updatedCustomer.hide,
        post_code: updatedCustomer.post_code || "",
      };

      let result: CustomerModel | null = null;

      if (isAddMode) {
        result = await customerService.createCustomer(
          cleanedCustomer as Omit<CustomerModel, "id">,
        );
      } else if (customer.id) {
        result = await customerService.updateCustomer(
          customer.id,
          cleanedCustomer,
        );
      }

      if (result) {
        toast.success(
          isAddMode ? t("messages.addSuccess") : t("messages.updateSuccess"),
        );

        router.push("/basic/customers");
        router.refresh();
      } else {
        toast.error(t("messages.operationFailed"));
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error(t("messages.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/basic/customers");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{getTitle()}</h2>
        <div className="flex gap-2">
          <Button
            startContent={<ArrowLeftIcon className="h-4 w-4" />}
            variant="flat"
            onPress={handleCancel}
          >
            {t("actions.back")}
          </Button>
          {isViewMode && (
            <Button
              color="warning"
              variant="flat"
              onPress={() =>
                router.push(`/basic/customers/${customer.id}?mode=edit`)
              }
            >
              {t("actions.edit")}
            </Button>
          )}
          {!isViewMode && (
            <Button color="primary" isLoading={isSaving} onPress={handleSave}>
              {isAddMode ? t("actions.save") : t("actions.update")}
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-3 gap-4">
        {/* البيانات الأساسية */}
        <div className="col-span-3 text-lg font-bold border-b pb-2">
          {t("sections.basicInfo")}
        </div>

        <Input
          isDisabled={isViewMode}
          label={t("fields.custCode")}
          value={customer.cust_code || ""}
          onChange={handleInputChange("cust_code")}
        />
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.custName")}
          value={customer.cust_name || ""}
          onChange={handleInputChange("cust_name")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.custNameEn")}
          value={customer.cust_name_e || ""}
          onChange={handleInputChange("cust_name_e")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.mobile")}
          value={customer.mobile?.toString() || ""}
          onChange={handleInputChange("mobile")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.email")}
          value={customer.email || ""}
          onChange={handleInputChange("email")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.vatNo")}
          value={customer.vat_no?.toString() || ""}
          onChange={handleNumberInputChange("vat_no")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.crNo")}
          value={customer.cr_no?.toString() || ""}
          onChange={handleNumberInputChange("cr_no")}
        />

        {/* العناوين والتواصل */}
        <div className="col-span-3 text-lg font-bold border-b pb-2 mt-4">
          {t("sections.addressContact")}
        </div>

        <Input
          isDisabled={isViewMode}
          label={t("fields.phone")}
          value={customer.phone || ""}
          onChange={handleInputChange("phone")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.fax")}
          value={customer.fax || ""}
          onChange={handleInputChange("fax")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.address")}
          value={customer.address || ""}
          onChange={handleInputChange("address")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.gov")}
          value={customer.gov || ""}
          onChange={handleInputChange("gov")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.city")}
          value={customer.city || ""}
          onChange={handleInputChange("city")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.area")}
          value={customer.area || ""}
          onChange={handleInputChange("area")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.street")}
          value={customer.street || ""}
          onChange={handleInputChange("street")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.buildNo")}
          value={customer.build_no || ""}
          onChange={handleInputChange("build_no")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.postCode")}
          value={customer.post_code || ""}
          onChange={handleInputChange("post_code")}
        />

        {/* الحسابات والتصنيفات */}
        <div className="col-span-3 text-lg font-bold border-b pb-2 mt-4">
          {t("sections.accountsCategories")}
        </div>

        <div className="col-span-2">
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="customer-account"
          >
            {t("fields.account")}
          </label>
          <ReactSelect
            isSearchable
            className="w-full text-sm"
            classNamePrefix="heroui"
            components={{
              IndicatorSeparator: () => null,
            }}
            inputId="customer-account"
            isDisabled={isViewMode}
            menuPlacement="auto"
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
            menuPosition="fixed"
            options={accounts.map((acc) => ({
              value: acc.id,
              label: `${acc.id} - ${acc.acc_name}`,
            }))}
            placeholder={t("placeholders.selectAccount")}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            value={
              customer.acc
                ? (() => {
                    const selectedAcc = accounts.find(
                      (acc) => acc.id === customer.acc,
                    );

                    return selectedAcc
                      ? {
                          value: selectedAcc.id,
                          label: `${selectedAcc.id} - ${selectedAcc.acc_name}`,
                        }
                      : {
                          value: customer.acc,
                          label: `${customer.acc} - ${customer.acc_name || ""}`,
                        };
                  })()
                : null
            }
            onChange={(selectedOption) => {
              const accObj = accounts.find(
                (acc) => acc.id === selectedOption?.value,
              );

              if (accObj) {
                setCustomer({
                  ...customer,
                  acc: accObj.id,
                  acc_name: accObj.acc_name,
                });
              }
            }}
          />
        </div>

        <div className="col-span-1">
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="customer-box-type"
          >
            {t("fields.boxType")}
          </label>
          <ReactSelect
            isSearchable
            className="w-full text-sm"
            classNamePrefix="heroui"
            components={{
              IndicatorSeparator: () => null,
            }}
            inputId="customer-box-type"
            isDisabled={isViewMode}
            menuPlacement="auto"
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
            menuPosition="fixed"
            options={boxTypes.map((box) => ({
              value: box.code_id,
              label: box.code_desc,
            }))}
            placeholder={t("placeholders.selectBoxType")}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            value={
              customer.box_type
                ? {
                    value: customer.box_type,
                    label:
                      boxTypes.find((b) => b.code_id === customer.box_type)
                        ?.code_desc || "",
                  }
                : null
            }
            onChange={(selectedOption) => {
              setCustomer({
                ...customer,
                box_type: selectedOption?.value || "",
              });
            }}
          />
        </div>

        <div className="col-span-1">
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="customer-type"
          >
            {t("fields.customerType")}
          </label>
          <ReactSelect
            isSearchable
            className="w-full text-sm"
            classNamePrefix="heroui"
            components={{
              IndicatorSeparator: () => null,
            }}
            inputId="customer-type"
            isDisabled={isViewMode}
            menuPlacement="auto"
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
            menuPosition="fixed"
            options={customerTypes.map((type) => ({
              value: type.id,
              label: type.type_name,
            }))}
            placeholder={t("placeholders.selectCustomerType")}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            value={
              customer.cust_type
                ? {
                    value: customer.cust_type,
                    label:
                      customerTypes.find((t) => t.id === customer.cust_type)
                        ?.type_name || "",
                  }
                : null
            }
            onChange={(selectedOption) => {
              setCustomer({
                ...customer,
                cust_type: (selectedOption?.value as number) || undefined,
              });
            }}
          />
        </div>

        <Input
          isDisabled={isViewMode}
          label={t("fields.handling")}
          value={customer.handling || ""}
          onChange={handleInputChange("handling")}
        />

        {/* معلومات إضافية */}
        <div className="col-span-3 text-lg font-bold border-b pb-2 mt-4">
          {t("sections.additionalInfo")}
        </div>

        <Input
          isDisabled={isViewMode}
          label={t("fields.handlingEn")}
          value={customer.handling_e || ""}
          onChange={handleInputChange("handling_e")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.perc")}
          type="number"
          value={customer.perc?.toString() || ""}
          onChange={handleNumberInputChange("perc")}
        />

        <div className="col-span-1">
          <label
            className="block text-sm font-medium mb-2"
            htmlFor="customer-status"
          >
            {t("fields.custStatus")}
          </label>
          <ReactSelect
            isSearchable
            className="w-full text-sm"
            classNamePrefix="heroui"
            components={{
              IndicatorSeparator: () => null,
            }}
            inputId="customer-status"
            isDisabled={isViewMode}
            menuPlacement="auto"
            menuPortalTarget={
              typeof window !== "undefined" ? document.body : null
            }
            menuPosition="fixed"
            options={customerStatus.map((cust1) => ({
              value: cust1.code_id,
              label: cust1.code_desc,
            }))}
            placeholder={t("placeholders.selectStatus")}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
            value={
              customer.cust_status
                ? {
                    value: customer.cust_status,
                    label:
                      customerStatus.find(
                        (b) => b.code_id === customer.cust_status,
                      )?.code_desc || "",
                  }
                : null
            }
            onChange={(selectedOption) => {
              setCustomer({
                ...customer,
                cust_status: (selectedOption?.value as number) || 0,
              });
            }}
          />
        </div>

        <div className="flex gap-6 items-center col-span-3">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(customer.expt)}
            onValueChange={handleCheckboxChange("expt")}
          >
            {t("fields.expt")}
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(customer.hide)}
            onValueChange={handleCheckboxChange("hide")}
          >
            {t("fields.hide")}
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormClient;
