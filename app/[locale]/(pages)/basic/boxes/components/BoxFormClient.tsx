"use client";
import type { Box as BoxModel } from "@/types/models/box";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox } from "@heroui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ReactSelect from "react-select";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";

import { getLocaleDir } from "@/i18n/config";
import boxService from "@/services/api/box.service";

type BoxFormMode = "view" | "edit" | "add";

// Use shared Box model to avoid type drift
type Box = BoxModel;

interface BoxType {
  id: number;
  code_id: number;
  code_desc: string;
  code_desc_l: string | null;
  type_id: number;
}

interface BoxFormClientProps {
  mode: BoxFormMode;
  initialBox: Partial<Box>;
  boxTypes: BoxType[];
  accounts: any[];
  companyId: number;
}

const normalizeNumberField = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : undefined;
};

const BoxFormClient = ({
  mode,
  initialBox,
  boxTypes,
  accounts,
  companyId,
}: BoxFormClientProps) => {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("basic.boxes");

  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [box, setBox] = useState<Partial<Box>>(initialBox);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange =
    (key: keyof Box) => (event: ChangeEvent<HTMLInputElement>) => {
      setBox({
        ...box,
        [key]: event.target.value,
      });
    };

  const handleCheckboxChange = (key: "expt" | "hide") => (value: boolean) => {
    setBox({
      ...box,
      [key]: value,
    });
  };

  const handleSaveError = (error: unknown) => {
    let errorMessage = t("messages.saveError");

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    const messages = errorMessage.split("\n");

    if (messages.length > 1) {
      toast.error(messages[0], { duration: 5000 });
      messages.slice(1).forEach((msg) => {
        if (msg.trim()) {
          toast.error(msg.trim(), { duration: 4000 });
        }
      });
    } else {
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const prepareBoxPayload = (currentBox: Partial<Box>) => {
    const updatedBox = { ...currentBox };

    if (!updatedBox.cust_code) {
      updatedBox.cust_code = updatedBox.id ? String(updatedBox.id) : "";
    }

    // Extract acc_name if it exists (it's not part of Box type but might be in initialBox)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { acc_name, ...boxWithoutAccName } =
      updatedBox as typeof updatedBox & { acc_name?: string };

    return {
      ...boxWithoutAccName,
      com: companyId,
      acc: normalizeNumberField(updatedBox.acc),
      vat_no: normalizeNumberField(updatedBox.vat_no),
      cr_no: normalizeNumberField(updatedBox.cr_no),
      perc: normalizeNumberField(updatedBox.perc),
      cust_type: 99, // Boxes are always cust_type = 99
      expt: !!updatedBox.expt,
      hide: !!updatedBox.hide,
      post_code: updatedBox.post_code || "",
    };
  };

  const handleSave = async () => {
    if (!box.cust_name) {
      toast.error(t("messages.nameRequired"));

      return;
    }

    setIsSaving(true);

    try {
      const cleanedBox = prepareBoxPayload(box);

      let result: Box | null = null;

      if (isAddMode) {
        result = await boxService.createBox(cleanedBox as Omit<Box, "id">);
      } else if (box.id) {
        result = await boxService.updateBox(box.id, cleanedBox);
      }

      if (result) {
        toast.success(
          isAddMode ? t("messages.addSuccess") : t("messages.updateSuccess"),
        );
        router.push("/basic/boxes");
        router.refresh();
      } else {
        toast.error(t("messages.operationFailed"));
      }
    } catch (error) {
      handleSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    router.push(`/basic/boxes/${box.id}?mode=edit`);
  };

  const getTitle = () => {
    if (isAddMode) return t("titles.add");
    if (isViewMode)
      return t("titles.view", {
        name: box.cust_name || box.cust_code || t("titles.defaultName"),
      });

    return t("titles.edit", {
      name: box.cust_name || box.cust_code || t("titles.defaultName"),
    });
  };

  const getDescription = () => {
    if (isViewMode) return t("descriptions.view");
    if (isAddMode) return t("descriptions.add");

    return t("descriptions.edit");
  };

  const boxTypeOptions = boxTypes.map((type) => ({
    value: String(type.code_id),
    label: type.code_desc,
  }));

  const accountOptions = accounts.map((acc) => ({
    value: String(acc.id),
    label: acc.acc_name || acc.acc_name_e || `حساب ${acc.id}`,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={textAlign}>
          <h2 className={`text-xl font-bold text-gray-900 ${textAlign}`}>
            {getTitle()}
          </h2>
          <p className={`text-sm text-gray-600 mt-1 ${textAlign}`}>
            {getDescription()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="light" onPress={() => router.push("/basic/boxes")}>
            <ArrowLeftIcon className="h-4 w-4" />
            {t("actions.back")}
          </Button>
          {isViewMode && (
            <Button color="primary" onPress={handleEdit}>
              {t("actions.edit")}
            </Button>
          )}
          {!isViewMode && (
            <>
              <Button
                variant="light"
                onPress={() => router.push("/basic/boxes")}
              >
                {t("actions.cancel")}
              </Button>
              <Button color="success" isLoading={isSaving} onPress={handleSave}>
                {isAddMode ? t("actions.save") : t("actions.update")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          isDisabled={isViewMode}
          label={t("fields.code")}
          value={(box.cust_code as string) || ""}
          onChange={handleInputChange("cust_code")}
        />
        <Input
          isRequired
          isDisabled={isViewMode}
          label={t("fields.name")}
          value={box.cust_name || ""}
          onChange={handleInputChange("cust_name")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.nameEn")}
          value={box.cust_name_e || ""}
          onChange={handleInputChange("cust_name_e")}
        />
        <div>
          <label
            className={`block text-sm font-medium text-gray-700 mb-1 ${textAlign}`}
            htmlFor="box-type"
          >
            {t("fields.type")}
          </label>
          <ReactSelect
            className="react-select-container"
            classNamePrefix="react-select"
            id="box-type"
            inputId="box-type"
            isDisabled={isViewMode}
            options={boxTypeOptions}
            placeholder={t("placeholders.selectType")}
            value={boxTypeOptions.find(
              (opt) => opt.value === String(box.box_type),
            )}
            onChange={(selected) =>
              setBox({ ...box, box_type: selected?.value || "" })
            }
          />
        </div>
        <Input
          isDisabled={isViewMode}
          label={t("fields.mobile")}
          value={box.mobile?.toString() || ""}
          onChange={handleInputChange("mobile")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.email")}
          type="email"
          value={box.email || ""}
          onChange={handleInputChange("email")}
        />
        <Input
          className="md:col-span-2"
          isDisabled={isViewMode}
          label={t("fields.address")}
          value={box.address || ""}
          onChange={handleInputChange("address")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.gov")}
          value={box.gov || ""}
          onChange={handleInputChange("gov")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.city")}
          value={box.city || ""}
          onChange={handleInputChange("city")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.area")}
          value={box.area || ""}
          onChange={handleInputChange("area")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.street")}
          value={box.street || ""}
          onChange={handleInputChange("street")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.building")}
          value={box.build_no || ""}
          onChange={handleInputChange("build_no")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.postCode")}
          value={box.post_code || ""}
          onChange={handleInputChange("post_code")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.phone")}
          value={box.phone || ""}
          onChange={handleInputChange("phone")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.fax")}
          value={box.fax || ""}
          onChange={handleInputChange("fax")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.handling")}
          value={box.handling || ""}
          onChange={handleInputChange("handling")}
        />
        <Input
          isDisabled={isViewMode}
          label={t("fields.handlingEn")}
          value={box.handling_e || ""}
          onChange={handleInputChange("handling_e")}
        />
        <div>
          <label
            className={`block text-sm font-medium text-gray-700 mb-1 ${textAlign}`}
            htmlFor="box-account"
          >
            {t("fields.account")}
          </label>
          <ReactSelect
            isClearable
            className="react-select-container"
            classNamePrefix="react-select"
            id="box-account"
            inputId="box-account"
            isDisabled={isViewMode}
            options={accountOptions}
            placeholder={t("placeholders.selectAccount")}
            value={accountOptions.find((opt) => opt.value === String(box.acc))}
            onChange={(selected) =>
              setBox({ ...box, acc: selected ? Number(selected.value) : null })
            }
          />
        </div>
        <div className="md:col-span-2 flex gap-6 items-center">
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(box.cust_status)}
            onValueChange={(val) =>
              setBox({ ...box, cust_status: val ? 1 : 0 })
            }
          >
            {t("labels.statusEnabled")}
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(box.expt)}
            onValueChange={handleCheckboxChange("expt")}
          >
            {t("labels.excludedFromBalance")}
          </Checkbox>
          <Checkbox
            isDisabled={isViewMode}
            isSelected={Boolean(box.hide)}
            onValueChange={handleCheckboxChange("hide")}
          >
            {t("labels.hidden")}
          </Checkbox>
        </div>
      </div>
    </div>
  );
};

export default BoxFormClient;
