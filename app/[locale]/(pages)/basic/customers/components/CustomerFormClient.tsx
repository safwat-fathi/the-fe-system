"use client";
import type { Customer as CustomerModel } from "@/types/models/customer";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Switch } from "@heroui/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import ReactSelect from "react-select";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import {
  createAccountAutoForCustomerAction,
  syncAccountNamesFromCustomerAction,
} from "@/app/actions/accounts.action";
import { createCustomerAction } from "@/app/actions/customer";
import { FORM_ACTIONS } from "@/constants/ui";
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
  const [accountsList, setAccountsList] = useState(accounts);
  const [isInsertingAccount, setIsInsertingAccount] = useState(false);

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

  const handleSwitchChange = (key: "expt" | "hide") => (value: boolean) => {
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
      const parseNullableNumber = (
        value: unknown,
      ): number | null | undefined => {
        if (value === undefined) return undefined;
        if (value === null || value === "") return null;
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : null;
      };

      const parseNullableString = (
        value: unknown,
      ): string | null | undefined => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        const normalized = String(value).trim();

        return normalized === "" ? null : normalized;
      };

      const updatedCustomer = { ...customer };
      const custCodeTrimmed = String(updatedCustomer.cust_code ?? "").trim();

      if (!custCodeTrimmed) {
        toast.error(t("messages.custCodeRequired"));
        setIsSaving(false);

        return;
      }

      updatedCustomer.cust_code = custCodeTrimmed;

      const cleanedCustomer: Partial<CustomerModel> = {
        ...updatedCustomer,
        mobile: parseNullableString(updatedCustomer.mobile),
        acc: parseNullableNumber(updatedCustomer.acc),
        vat_no: parseNullableNumber(updatedCustomer.vat_no),
        cr_no: parseNullableString(updatedCustomer.cr_no),
        perc: parseNullableNumber(updatedCustomer.perc),
        cust_type: parseNullableNumber(updatedCustomer.cust_type),
        cust_status: parseNullableNumber(updatedCustomer.cust_status),
        expt: !!updatedCustomer.expt,
        hide: !!updatedCustomer.hide,
        post_code: parseNullableString(updatedCustomer.post_code),
      };

      let result: CustomerModel | null = null;

      if (isAddMode) {
        result = await createCustomerAction(
          cleanedCustomer as Omit<CustomerModel, "id">,
        );
      } else if (customer.id) {
        result = await customerService.updateCustomer(
          customer.id,
          cleanedCustomer,
        );
      }

      if (result) {
        const accountId = parseNullableNumber(updatedCustomer.acc);

        if (
          !isAddMode &&
          accountId != null &&
          Number.isFinite(accountId) &&
          (updatedCustomer.cust_name != null || updatedCustomer.cust_name_e != null)
        ) {
          const syncResult = await syncAccountNamesFromCustomerAction(
            accountId,
            (updatedCustomer.cust_name ?? "").trim() || result.cust_name || "",
            (updatedCustomer.cust_name_e ?? "").trim() ||
              result.cust_name_e ||
              undefined,
          );

          if (!syncResult.success) {
            toast.error(
              syncResult.error || t("messages.operationFailed"),
              { duration: 5000 },
            );
          }
        }

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

  const handleInsertAccountAuto = async () => {
    if (!customer.cust_type) {
      toast.error(t("messages.insertAccountAutoNoType"));

      return;
    }

    const selectedType = customerTypes.find(
      (ct: { id: number; acc?: number | null }) => ct.id === customer.cust_type,
    );
    const mainAccountId =
      selectedType && typeof (selectedType as { acc?: number | null }).acc === "number"
        ? (selectedType as { acc: number }).acc
        : null;

    if (mainAccountId == null) {
      toast.error(t("messages.insertAccountAutoNoMainAccount"));

      return;
    }

    setIsInsertingAccount(true);

    try {
      const result = await createAccountAutoForCustomerAction(
        mainAccountId,
        (customer.cust_name || "").trim() || "حساب عميل",
        companyId,
        (customer.cust_name_e ?? "").trim(),
      );

      if (result.success) {
        const newAccount = result.data;

        setAccountsList((prev) => [...prev, newAccount]);
        setCustomer({
          ...customer,
          acc: newAccount.id,
          acc_name: newAccount.acc_name,
        });
        toast.success(t("messages.insertAccountAutoSuccess"));
      } else {
        toast.error(result.error || t("messages.insertAccountAutoError"));
      }
    } catch {
      toast.error(t("messages.insertAccountAutoError"));
    } finally {
      setIsInsertingAccount(false);
    }
  };

  const cardClass =
    "rounded-lg border border-default-200 bg-default-50/50 p-3 flex flex-col min-h-0";
  const sectionTitleClass =
    "text-sm font-bold border-b border-default-200 pb-1.5 mb-2";
  const selectLabelClass = "block text-xs font-medium mb-1";

  return (
    <div className="flex flex-col gap-3 min-h-0 max-h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{getTitle()}</h2>
        <div className={FORM_ACTIONS.wrapper}>
          <Button
            size={FORM_ACTIONS.size}
            startContent={<ArrowLeftIcon className={FORM_ACTIONS.back.iconSize} />}
            variant={FORM_ACTIONS.back.variant}
            onPress={handleCancel}
          >
            {t("actions.back")}
          </Button>
          {isViewMode && (
            <Button
              size={FORM_ACTIONS.size}
              color={FORM_ACTIONS.edit.color}
              variant={FORM_ACTIONS.edit.variant}
              onPress={() =>
                router.push(`/basic/customers/${customer.id}?mode=edit`)
              }
            >
              {t("actions.edit")}
            </Button>
          )}
          {!isViewMode && (
            <Button
              size={FORM_ACTIONS.size}
              color={FORM_ACTIONS.save.color}
              className={FORM_ACTIONS.save.className}
              startContent={<CheckCircleIcon className={FORM_ACTIONS.save.iconSize} />}
              isLoading={isSaving}
              onPress={handleSave}
            >
              {isAddMode ? t("actions.save") : t("actions.update")}
            </Button>
          )}
        </div>
      </div>

      {/* Form: 2x2 grid of section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 flex-1 overflow-auto">
        {/* البيانات الأساسية */}
        <div className={cardClass}>
          <div className={sectionTitleClass}>
            {t("sections.basicInfo")}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-h-0">
            <div className="col-span-1 flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-code">
                {t("fields.custCode")}
              </label>
              <Input
                id="customer-code"
                size="sm"
                isDisabled={isViewMode}
                value={customer.cust_code || ""}
                onChange={handleInputChange("cust_code")}
              />
            </div>
            <div className="col-span-2 sm:col-span-2 flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-name">
                {t("fields.custName")}
              </label>
              <Input
                id="customer-name"
                size="sm"
                isRequired
                isDisabled={isViewMode}
                value={customer.cust_name || ""}
                onChange={handleInputChange("cust_name")}
              />
            </div>
            <div className="col-span-2 sm:col-span-2 flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-name-en">
                {t("fields.custNameEn")}
              </label>
              <Input
                id="customer-name-en"
                size="sm"
                isDisabled={isViewMode}
                value={customer.cust_name_e || ""}
                onChange={handleInputChange("cust_name_e")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-mobile">
                {t("fields.mobile")}
              </label>
              <Input
                id="customer-mobile"
                size="sm"
                isDisabled={isViewMode}
                value={customer.mobile?.toString() || ""}
                onChange={handleInputChange("mobile")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-email">
                {t("fields.email")}
              </label>
              <Input
                id="customer-email"
                size="sm"
                isDisabled={isViewMode}
                value={customer.email || ""}
                onChange={handleInputChange("email")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-vat">
                {t("fields.vatNo")}
              </label>
              <Input
                id="customer-vat"
                size="sm"
                isDisabled={isViewMode}
                value={customer.vat_no?.toString() || ""}
                onChange={handleNumberInputChange("vat_no")}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1 flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-cr">
                {t("fields.crNo")}
              </label>
              <Input
                id="customer-cr"
                size="sm"
                isDisabled={isViewMode}
                value={customer.cr_no?.toString() || ""}
                onChange={handleNumberInputChange("cr_no")}
              />
            </div>
          </div>
        </div>

        {/* العناوين والتواصل */}
        <div className={cardClass}>
          <div className={sectionTitleClass}>
            {t("sections.addressContact")}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 min-h-0">
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-address">
                {t("fields.address")}
              </label>
              <Input
                id="customer-address"
                size="sm"
                isDisabled={isViewMode}
                value={customer.address || ""}
                onChange={handleInputChange("address")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-gov">
                {t("fields.gov")}
              </label>
              <Input
                id="customer-gov"
                size="sm"
                isDisabled={isViewMode}
                value={customer.gov || ""}
                onChange={handleInputChange("gov")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-city">
                {t("fields.city")}
              </label>
              <Input
                id="customer-city"
                size="sm"
                isDisabled={isViewMode}
                value={customer.city || ""}
                onChange={handleInputChange("city")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-area">
                {t("fields.area")}
              </label>
              <Input
                id="customer-area"
                size="sm"
                isDisabled={isViewMode}
                value={customer.area || ""}
                onChange={handleInputChange("area")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-street">
                {t("fields.street")}
              </label>
              <Input
                id="customer-street"
                size="sm"
                isDisabled={isViewMode}
                value={customer.street || ""}
                onChange={handleInputChange("street")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-build-no">
                {t("fields.buildNo")}
              </label>
              <Input
                id="customer-build-no"
                size="sm"
                isDisabled={isViewMode}
                value={customer.build_no || ""}
                onChange={handleInputChange("build_no")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-post-code">
                {t("fields.postCode")}
              </label>
              <Input
                id="customer-post-code"
                size="sm"
                isDisabled={isViewMode}
                value={customer.post_code || ""}
                onChange={handleInputChange("post_code")}
              />
            </div>
          </div>
        </div>

        {/* الحسابات والتصنيفات */}
        <div className={cardClass}>
          <div className={sectionTitleClass}>
            {t("sections.accountsCategories")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-0">
            <div className="sm:col-span-2">
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <label
                    className={selectLabelClass}
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
                    options={accountsList.map((acc: { id: number; acc_id?: string; acc_name?: string }) => ({
                      value: acc.id,
                      label: `${acc.acc_id ?? acc.id} - ${acc.acc_name}`,
                    }))}
                    placeholder={t("placeholders.selectAccount")}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      control: (base) => ({ ...base, minHeight: 32 }),
                    }}
                    value={
                      customer.acc
                        ? (() => {
                            const selectedAcc = accountsList.find(
                              (acc: { id: number }) => acc.id === customer.acc,
                            );

                            return selectedAcc
                              ? {
                                  value: selectedAcc.id,
                                  label: `${(selectedAcc as { acc_id?: string; acc_name?: string }).acc_id ?? selectedAcc.id} - ${(selectedAcc as { acc_name?: string }).acc_name}`,
                                }
                              : {
                                  value: customer.acc,
                                  label: `${customer.acc} - ${customer.acc_name || ""}`,
                                };
                          })()
                        : null
                    }
                    onChange={(selectedOption) => {
                      const accObj = accountsList.find(
                        (acc: { id: number }) => acc.id === selectedOption?.value,
                      );

                      if (accObj) {
                        setCustomer({
                          ...customer,
                          acc: accObj.id,
                          acc_name: (accObj as { acc_name?: string }).acc_name,
                        });
                      }
                    }}
                  />
                </div>
                {!isViewMode && (
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    className="shrink-0 min-w-unit-8 w-8 text-default-500 hover:text-default-700"
                    aria-label={t("actions.insertAccountAuto")}
                    isLoading={isInsertingAccount}
                    onPress={handleInsertAccountAuto}
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label
                className={selectLabelClass}
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
                  control: (base) => ({ ...base, minHeight: 32 }),
                }}
                value={(() => {
                  const raw = customer.box_type;

                  if (raw === undefined || raw === null || raw === "")
                    return null;

                  const selected = boxTypes.find(
                    (b) => String(b.code_id) === String(raw),
                  );

                  return selected
                    ? {
                        value: selected.code_id,
                        label: selected.code_desc,
                      }
                    : null;
                })()}
                onChange={(selectedOption) => {
                  setCustomer({
                    ...customer,
                    box_type: selectedOption?.value || "",
                  });
                }}
              />
            </div>
            <div>
              <label
                className={selectLabelClass}
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
                  control: (base) => ({ ...base, minHeight: 32 }),
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
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-perc">
                {t("fields.perc")}
              </label>
              <Input
                id="customer-perc"
                size="sm"
                isDisabled={isViewMode}
                type="number"
                value={customer.perc?.toString() || ""}
                onChange={handleNumberInputChange("perc")}
              />
            </div>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className={cardClass}>
          <div className={sectionTitleClass}>
            {t("sections.additionalInfo")}
          </div>
          <div className="grid grid-cols-2 gap-2 min-h-0">
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-handling">
                {t("fields.handling")}
              </label>
              <Input
                id="customer-handling"
                size="sm"
                isDisabled={isViewMode}
                value={customer.handling || ""}
                onChange={handleInputChange("handling")}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className={selectLabelClass} htmlFor="customer-handling-en">
                {t("fields.handlingEn")}
              </label>
              <Input
                id="customer-handling-en"
                size="sm"
                isDisabled={isViewMode}
                value={customer.handling_e || ""}
                onChange={handleInputChange("handling_e")}
              />
            </div>
            <div className="col-span-2">
              <label
                className={selectLabelClass}
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
                  control: (base) => ({ ...base, minHeight: 32 }),
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
            <div className="flex flex-wrap gap-4 items-center col-span-2">
              <Switch
                size="sm"
                isDisabled={isViewMode}
                isSelected={Boolean(customer.expt)}
                onValueChange={handleSwitchChange("expt")}
              >
                <span className="text-sm">{t("fields.expt")}</span>
              </Switch>
              <Switch
                size="sm"
                isDisabled={isViewMode}
                isSelected={Boolean(customer.hide)}
                onValueChange={handleSwitchChange("hide")}
              >
                <span className="text-sm">{t("fields.hide")}</span>
              </Switch>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormClient;
