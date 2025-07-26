"use client";

import React, { useEffect, useState } from "react";
import { Input, Button, Checkbox } from "@heroui/react";
import toast from "react-hot-toast";

import { API_ENDPOINTS, apiFetch } from "@/utilities/api";

interface HomeSettings {
  [key: string]: any;
}

const TABS = [
  { id: "general", label: "عام" },
  { id: "accounts", label: "الحسابات" },
  { id: "zatca", label: "الربط بهيئة" },
];

const GENERAL_FIELDS = [
  { key: "comp_a_name", label: "اسم المؤسسة بالعربي" },
  { key: "comp_l_name", label: "اسم المؤسسة بالإنجليزي" },
  { key: "ADDRESS", label: "العنوان عربي" },
  { key: "ADDRESS_E", label: "العنوان إنجليزي" },
  { key: "footer", label: "الترويسة" },
  { key: "purity", label: "المعايرة الافتراضية" },
  { key: "VAT_NO", label: "الرقم الضريبي" },
  { key: "comp_cr_no", label: "رقم السجل التجاري" },
  { key: "comp_gov", label: "المنطقة" },
  { key: "comp_city", label: "المدينة" },
  { key: "comp_area", label: "الحي" },
  { key: "comp_street", label: "اسم الشارع" },
  { key: "comp_build_no", label: "رقم المبنى" },
  { key: "comp_Post_code", label: "الرمز البريدي" },
  { key: "ver", label: "رقم النسخة" },
];

const ACCOUNT_FIELDS = [
  { key: "fin_year", label: "السنة المالية" },
  { key: "close_month", label: "آخر شهر مقفل" },
  { key: "close_year", label: "آخر سنة مقفلة" },
  { key: "init_date", label: "بداية السنة المالية", type: "date" },
  { key: "finaly_date", label: "نهاية السنة المالية", type: "date" },
  { key: "frac", label: "عدد خانات الكسور للمبالغ" },
  { key: "frac2", label: "عدد خانات الكسور للوزن/الجرام" },
  { key: "disc_acc", label: "حساب الخصم المسموح به" },
  { key: "disc_acc2", label: "حساب الخصم المكتسب" },
  { key: "buy_acc", label: "حساب المشتريات" },
  { key: "sell_acc", label: "حساب المبيعات" },
  { key: "p_l_acc", label: "حساب الأرباح والخسائر" },
  { key: "store", label: "حساب المخزون" },
  { key: "Vat_perc", label: " % نسبة ضريبة القيمة المضافة" },
];

const ZATCA_FIELDS = [
  {
    key: "Enable_EInvoice",
    label: "تفعيل الفاتورة الإلكترونية",
    type: "checkbox",
  },
  { key: "LT", label: "نوع الربط  " },
  { key: "LTD", label: "تاريخ تفعيل الربط", type: "date" },
  { key: "Xml_Path", label: "مسار ملفات XML" },
  { key: "USERNAME", label: "اسم المستخدم" },
  { key: "PASSWORD", label: "كلمة المرور" },
  { key: "comp_csr", label: "الشهادة" },
  { key: "comp_private_key", label: "المفتاح الخاص" },
  { key: "Last_PIH", label: "آخر PIH" },
  { key: "Last_ICV", label: "آخر ICV" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<HomeSettings>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.HOME_LIST);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) setSettings(data[0]);
      } catch (e) {
        console.error("فشل تحميل الإعدادات", e);
      }
    };

    load();
  }, []);

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
      toast.success("تم الحفظ بنجاح");
    } catch (e) {
      toast.error("فشل الحفظ");
      console.error(e);
    }
  };

  const renderFields = (
    fields: { key: string; label: string; type?: string }[],
  ) => (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((f) =>
        f.type === "checkbox" ? (
          <Checkbox
            key={f.key}
            isSelected={!!settings[f.key]}
            onValueChange={(val) => handleChange(f.key, val)}
          >
            {f.label}
          </Checkbox>
        ) : (
          <Input
            key={f.key}
            label={f.label}
            type={f.type || "text"}
            value={settings[f.key] ?? ""}
            onChange={(e) => handleChange(f.key, e.target.value)}
          />
        ),
      )}
    </div>
  );

  return (
    <div className="p-4 font-cairo">
      <h1 className="text-2xl font-bold mb-6">إعدادات النظام</h1>
      <div className="flex gap-4 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`px-4 py-2 rounded ${activeTab === t.id ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && renderFields(GENERAL_FIELDS)}
      {activeTab === "accounts" && renderFields(ACCOUNT_FIELDS)}
      {activeTab === "zatca" && renderFields(ZATCA_FIELDS)}

      <div className="mt-6">
        <Button color="success" onPress={handleSave}>
          حفظ
        </Button>
      </div>
    </div>
  );
}
