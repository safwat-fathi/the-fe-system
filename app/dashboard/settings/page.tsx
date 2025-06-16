"use client";

import React, { useEffect, useState } from "react";
import { Input, Button, Checkbox } from "@heroui/react";

import { API_ENDPOINTS, apiFetch } from "@/utilities/api";

interface HomeSettings {
  [key: string]: any;
}

const TABS = [
  { id: "general", label: "اعدادات عامه" },
  { id: "accounts", label: "اعدادات الحسابات" },
  { id: "zatca", label: "اعدادات الربط ZATCA" },
];

const GENERAL_FIELDS = [
  { key: "comp_a_name", label: "اسم المؤسسة بالعربي" },
  { key: "comp_l_name", label: "اسم المؤسسة انجليزي" },
  { key: "ADDRESS", label: "العنوان عربي" },
  { key: "ADDRESS_E", label: "العنوان بالانجليزي" },
  { key: "footer", label: "Footer" },
  { key: "purity", label: "المعايرة الافتراضية" },
  { key: "VAT_NO", label: "الرقم الضريبي" },
  { key: "comp_cr_no", label: "رقم السجل" },
  { key: "comp_gov", label: "العنوان الوطني" },
  { key: "comp_city", label: "المدينة" },
  { key: "comp_area", label: "المنطقة" },
  { key: "comp_street", label: "اسم الشارع" },
  { key: "comp_build_no", label: "رقم المبنى" },
  { key: "comp_Post_code", label: "الرمز البريدي" },
  { key: "ver", label: "رقم النسخه" },
];

const ACCOUNT_FIELDS = [
  { key: "fin_year", label: "السنه الماليه" },
  { key: "close_month", label: "الشهر الاخير المغلق" },
  { key: "close_year", label: "السنه الماضيه المغلقه" },
  { key: "init_date", label: "تاريخ بدايه السنه الماليه", type: "date" },
  { key: "finaly_date", label: "تاريخ نهايه السنه الماليه", type: "date" },
  { key: "cl", label: "فتره مقفله" },
  { key: "store", label: "store" },
  { key: "local_cur", label: "local_cur" },
  { key: "disc_acc", label: "disc_acc" },
  { key: "disc_acc2", label: "disc_acc2" },
  { key: "buy_acc", label: "buy_acc" },
  { key: "sell_acc", label: "sell_acc" },
  { key: "p_l_acc", label: "p_l_acc" },
  { key: "cur_diff", label: "cur_diff" },
  { key: "inv_acc1", label: "inv_acc1" },
  { key: "inv_acc2", label: "inv_acc2" },
  { key: "gold_box_new", label: "gold_box_new" },
  { key: "gold_box_old", label: "gold_box_old" },
  { key: "gold_box_old_item", label: "gold_box_old_item" },
  { key: "fund_new", label: "fund_new" },
  { key: "fund_old", label: "fund_old" },
  { key: "GAUGE_DIFF", label: "GAUGE_DIFF" },
  { key: "GOLD_INV_ACC", label: "GOLD_INV_ACC" },
  { key: "commission_acc", label: "commission_acc" },
  { key: "buy_acc2", label: "buy_acc2" },
  { key: "sell_acc2", label: "sell_acc2" },
  { key: "first_store_new_acc", label: "first_store_new_acc" },
  { key: "first_store_old_acc", label: "first_store_old_acc" },
  { key: "g_voucher_in_acc", label: "g_voucher_in_acc" },
  { key: "g_voucher_out_acc", label: "g_voucher_out_acc" },
  { key: "last_store_new_acc", label: "last_store_new_acc" },
  { key: "last_store_old_acc", label: "last_store_old_acc" },
  { key: "first_work_store_acc", label: "first_work_store_acc" },
  { key: "last_work_store_acc", label: "last_work_store_acc" },
  { key: "work_lost_acc", label: "work_lost_acc" },
  { key: "inv_trans_acc1", label: "inv_trans_acc1" },
  { key: "inv_trans_acc2", label: "inv_trans_acc2" },
  { key: "gold_trans_new_acc", label: "gold_trans_new_acc" },
  { key: "gold_trans_old_acc", label: "gold_trans_old_acc" },
  { key: "dist_acc", label: "dist_acc" },
  { key: "dist_acc2", label: "dist_acc2" },
  { key: "box_acc", label: "box_acc" },
  { key: "work_acc", label: "work_acc" },
  { key: "gold_acc", label: "gold_acc" },
  { key: "work_acc2", label: "work_acc2" },
  { key: "first_work_acc", label: "first_work_acc" },
  { key: "first_store_pure_acc", label: "first_store_pure_acc" },
  { key: "Trading_acc", label: "Trading_acc" },
  { key: "time_in", label: "time_in" },
  { key: "TIME_OUT", label: "TIME_OUT" },
  { key: "last_user", label: "اخر يوزر سجل دخول" },
  { key: "ounce_price", label: "ounce_price" },
  { key: "ounce_price2", label: "ounce_price2" },
  { key: "gold_price1", label: "gold_price1" },
  { key: "gold_price", label: "gold_price" },
  { key: "gold_price2", label: "gold_price2" },
  { key: "Dollar_price", label: "Dollar_price" },
  { key: "frac", label: "frac" },
  { key: "frac2", label: "frac2" },
  { key: "k", label: "k" },
  { key: "Vat_perc", label: "نسبة الضريبة" },
  { key: "Com_id", label: "الفرع" },
  { key: "Inventory_type", label: "نوع المخزون" },
  { key: "pdf_path", label: "مسار تصدير ال pdf" },
];

const ZATCA_FIELDS = [
  { key: "comp_public_key", label: "public key" },
  { key: "comp_private_key", label: "private key" },
  { key: "comp_secret_code", label: "secret code" },
  { key: "comp_csr", label: "certificate" },
  {
    key: "Enable_EInvoice",
    label: "تفعيل الفاتورة الالكترونية",
    type: "checkbox",
  },
  { key: "LT", label: "نوع الربط" },
  { key: "LTD", label: "تاريخ بدايه الربط", type: "date" },
  { key: "Xml_Path", label: "مسار ملفات xml" },
  { key: "Last_PIH", label: "Last PIH" },
  { key: "Last_ICV", label: "Last ICV" },
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
        console.error("failed to load settings", e);
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
      alert("تم الحفظ بنجاح");
    } catch (e) {
      alert("فشل الحفظ");
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
