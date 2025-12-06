"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Button,
  Checkbox,
  Card,
  CardBody,
  Divider,
} from "@heroui/react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import Breadcrumb from "@/components/Breadcrumb";
import { API_ENDPOINTS, apiFetch } from "@/utilities/api";
import homeService from "@/services/api/home.service";

interface HomeSettings {
  [key: string]: any;
}

// const ZATCA_FIELDS = [
//   {
//     key: "Enable_EInvoice",
//     label: "تفعيل الفاتورة الإلكترونية",
//     type: "checkbox",
//   },
//   { key: "LT", label: "نوع الربط  " },
//   { key: "LTD", label: "تاريخ تفعيل الربط", type: "date" },
//   { key: "Xml_Path", label: "مسار ملفات XML" },
//   { key: "USERNAME", label: "اسم المستخدم" },
//   { key: "PASSWORD", label: "كلمة المرور" },
//   { key: "comp_csr", label: "الشهادة" },
//   { key: "comp_private_key", label: "المفتاح الخاص" },
//   { key: "Last_PIH", label: "آخر PIH" },
//   { key: "Last_ICV", label: "آخر ICV" },
// ];

export default function SettingsPage() {
  const t = useTranslations("settings.systemSettings");
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState<HomeSettings>({});
  const [originalSettings, setOriginalSettings] = useState<HomeSettings>({});

  const SECTIONS = useMemo(
    () => [
      {
        id: "general",
        label: t("sections.general.label"),
        icon: "🏢",
        description: t("sections.general.description"),
      },
      {
        id: "accounts",
        label: t("sections.accounts.label"),
        icon: "💰",
        description: t("sections.accounts.description"),
      },
    ],
    [t],
  );

  const GENERAL_FIELDS = useMemo(
    () => [
      { key: "comp_a_name", label: t("fields.compAName") },
      { key: "comp_l_name", label: t("fields.compLName") },
      { key: "ADDRESS", label: t("fields.address") },
      { key: "ADDRESS_E", label: t("fields.addressE") },
      { key: "footer", label: t("fields.footer") },
      { key: "purity", label: t("fields.purity") },
      { key: "VAT_NO", label: t("fields.vatNo") },
      { key: "comp_cr_no", label: t("fields.compCrNo") },
      { key: "comp_gov", label: t("fields.compGov") },
      { key: "comp_city", label: t("fields.compCity") },
      { key: "comp_area", label: t("fields.compArea") },
      { key: "comp_street", label: t("fields.compStreet") },
      { key: "comp_build_no", label: t("fields.compBuildNo") },
      { key: "comp_Post_code", label: t("fields.compPostCode") },
      { key: "ver", label: t("fields.ver") },
    ],
    [t],
  );

  const ACCOUNT_FIELDS = useMemo(
    () => [
      { key: "fin_year", label: t("fields.finYear") },
      { key: "close_month", label: t("fields.closeMonth") },
      { key: "close_year", label: t("fields.closeYear") },
      { key: "init_date", label: t("fields.initDate"), type: "date" },
      { key: "finaly_date", label: t("fields.finalyDate"), type: "date" },
      { key: "frac", label: t("fields.frac") },
      { key: "frac2", label: t("fields.frac2") },
      { key: "disc_acc", label: t("fields.discAcc") },
      { key: "disc_acc2", label: t("fields.discAcc2") },
      { key: "buy_acc", label: t("fields.buyAcc") },
      { key: "sell_acc", label: t("fields.sellAcc") },
      { key: "p_l_acc", label: t("fields.plAcc") },
      { key: "store", label: t("fields.store") },
      { key: "Vat_perc", label: t("fields.vatPerc") },
    ],
    [t],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const homeSettings = await homeService.getHomeSettings();

        if (homeSettings) {
          setSettings(homeSettings);
          setOriginalSettings(homeSettings);
        }
      } catch (e) {
        console.error(t("messages.loadError"), e);
      }
    };

    load();
  }, [t]);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!settings.id) return;
    try {
      await apiFetch(API_ENDPOINTS.UPDATE_HOME(settings.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      // تحديث كاش الكسور بعد الحفظ
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const api = require("@/utilities/api");

        if (api && api.fractionsCache !== undefined) {
          api.fractionsCache = null;
        }
      }
      setOriginalSettings(settings);
      toast.success(t("messages.saveSuccess"));
    } catch (e) {
      toast.error(t("messages.saveError"));
      console.error(e);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    toast.success(t("messages.resetSuccess"));
  };

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const renderFields = (
    fields: { key: string; label: string; type?: string }[],
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((f) => {
        if (f.type === "checkbox") {
          return (
            <Checkbox
              key={f.key}
              isSelected={!!settings[f.key]}
              onValueChange={(val) => handleChange(f.key, val)}
            >
              {f.label}
            </Checkbox>
          );
        } else {
          return (
            <Input
              key={f.key}
              label={f.label}
              type={f.type || "text"}
              value={settings[f.key] ?? ""}
              onChange={(e) => handleChange(f.key, e.target.value)}
            />
          );
        }
      })}
    </div>
  );

  const getCurrentFields = () => {
    switch (activeSection) {
      case "general":
        return GENERAL_FIELDS;
      case "accounts":
        return ACCOUNT_FIELDS;
      default:
        return GENERAL_FIELDS;
    }
  };

  return (
    <div className="p-4 font-cairo">
      <Breadcrumb />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        {hasChanges && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            ⚠️ تم تعديل الإعدادات
          </div>
        )}
      </div>

      {/* أزرار الأقسام */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        {SECTIONS.map((section) => (
          <Card
            key={section.id}
            isPressable
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg min-h-[140px] ${
              activeSection === section.id
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "bg-white hover:bg-gray-50"
            }`}
            onPress={() => setActiveSection(section.id)}
          >
            <CardBody className="text-center px-4 py-5 flex flex-col items-center justify-center gap-2">
              <div className="text-3xl">{section.icon}</div>
              <h3 className="text-base font-semibold">{section.label}</h3>
              <p className="text-xs text-gray-600 leading-5">
                {section.description}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* محتوى القسم المحدد */}
      <Card className="mb-6">
        <CardBody>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">
              {SECTIONS.find((s) => s.id === activeSection)?.label}
            </h2>
            <p className="text-gray-600">
              {SECTIONS.find((s) => s.id === activeSection)?.description}
            </p>
          </div>
          {renderFields(getCurrentFields())}
        </CardBody>
      </Card>

      <Divider className="my-6" />

      {/* أزرار الحفظ */}
      <div className="flex gap-4 justify-end">
        <Button
          disabled={!hasChanges}
          size="lg"
          variant="bordered"
          onPress={handleReset}
        >
          إعادة تعيين
        </Button>
        <Button
          color="success"
          disabled={!hasChanges}
          size="lg"
          onPress={handleSave}
        >
          {hasChanges ? "💾 حفظ الإعدادات" : "✅ محفوظ"}
        </Button>
      </div>
    </div>
  );
}
