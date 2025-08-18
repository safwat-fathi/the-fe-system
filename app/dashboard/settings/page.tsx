"use client";

import React, { useEffect, useState, useRef } from "react";
import { Input, Button, Checkbox, Card, CardBody, Image, Divider } from "@heroui/react";
import toast from "react-hot-toast";

import { API_ENDPOINTS, apiFetch } from "@/utilities/api";

interface HomeSettings {
  [key: string]: any;
}

const SECTIONS = [
  { id: "general", label: "الإعدادات العامة", icon: "🏢", description: "معلومات الشركة والشعار والعلامة التجارية" },
  { id: "accounts", label: "إعدادات الحسابات", icon: "💰", description: "السنة المالية والحسابات والضرائب" },
  { id: "zatca", label: "ربط هيئة الزكاة", icon: "🔗", description: "إعدادات الربط الإلكتروني" },
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
  // إضافة حقول الشعار والعلامة التجارية
  { key: "company_logo", label: "شعار الشركة", type: "image" },
  { key: "company_favicon", label: "أيقونة الموقع", type: "image" },
  { key: "primary_color", label: "اللون الأساسي", type: "color" },
  { key: "secondary_color", label: "اللون الثانوي", type: "color" },
  { key: "company_slogan", label: "شعار الشركة (نص)" },
  { key: "company_description", label: "وصف الشركة", type: "textarea" },
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
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState<HomeSettings>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [originalSettings, setOriginalSettings] = useState<HomeSettings>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.HOME_LIST);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setSettings(data[0]);
          setOriginalSettings(data[0]);
        }
      } catch (e) {
        console.error("فشل تحميل الإعدادات", e);
      }
    };

    load();
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (key: string, file: File) => {
    if (!file) return;

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("يرجى اختيار ملف صورة صالح (JPG, PNG, GIF, WebP)");
      return;
    }

    // التحقق من حجم الملف (5MB كحد أقصى)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("حجم الملف يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setUploading(key);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', key);

      const response = await apiFetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        handleChange(key, result.url);
        toast.success("تم رفع الصورة بنجاح");
      } else {
        throw new Error('فشل رفع الملف');
      }
    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      toast.error("فشل رفع الملف");
    } finally {
      setUploading(null);
    }
  };

  const handleImageClick = (key: string) => {
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]?.click();
    }
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
      toast.success("تم الحفظ بنجاح");
    } catch (e) {
      toast.error("فشل الحفظ");
      console.error(e);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    toast.success("تم إعادة تعيين الإعدادات");
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const renderImageField = (field: { key: string; label: string }) => (
    <div key={field.key} className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      <div className="flex items-start space-x-4 space-x-reverse">
        <div className="relative">
          {settings[field.key] ? (
            <div className="relative group">
              <Image
                src={settings[field.key]}
                alt={field.label}
                className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                onClick={() => handleImageClick(field.key)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                  تغيير الصورة
                </span>
              </div>
            </div>
          ) : (
            <div
              className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
              onClick={() => handleImageClick(field.key)}
            >
              <div className="text-center">
                <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">إضافة صورة</p>
              </div>
            </div>
          )}
          {uploading === field.key && (
            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={(el) => {
              fileInputRefs.current[field.key] = el;
            }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(field.key, file);
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="bordered"
              onPress={() => handleImageClick(field.key)}
              disabled={uploading === field.key}
            >
              {uploading === field.key ? "جاري الرفع..." : "اختيار ملف"}
            </Button>
            {settings[field.key] && (
              <Button
                size="sm"
                color="danger"
                variant="light"
                onPress={() => handleChange(field.key, "")}
              >
                حذف
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            الحد الأقصى: 5MB. الأنواع المدعومة: JPG, PNG, GIF, WebP
          </p>
        </div>
      </div>
    </div>
  );

  const renderColorField = (field: { key: string; label: string }) => (
    <div key={field.key} className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      <div className="flex items-center space-x-3 space-x-reverse">
        <div className="relative">
          <input
            type="color"
            value={settings[field.key] || "#000000"}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className="w-14 h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
          <div 
            className="absolute inset-0 rounded-lg border-2 border-gray-200 pointer-events-none"
            style={{ backgroundColor: settings[field.key] || "#000000" }}
          />
        </div>
        <Input
          value={settings[field.key] || ""}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
        <div 
          className="w-8 h-8 rounded border border-gray-300"
          style={{ backgroundColor: settings[field.key] || "#000000" }}
        />
      </div>
    </div>
  );

  const renderTextareaField = (field: { key: string; label: string }) => (
    <div key={field.key} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      <textarea
        value={settings[field.key] || ""}
        onChange={(e) => handleChange(field.key, e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder={`أدخل ${field.label.toLowerCase()}`}
      />
    </div>
  );

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
        } else if (f.type === "image") {
          return renderImageField(f);
        } else if (f.type === "color") {
          return renderColorField(f);
        } else if (f.type === "textarea") {
          return renderTextareaField(f);
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

  const renderBrandingPreview = () => {
    if (activeSection !== "general") return null;

    return (
      <Card className="mt-6">
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">معاينة العلامة التجارية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* معاينة الشعار */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">معاينة الشعار</h4>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                {settings.company_logo ? (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Image
                      src={settings.company_logo}
                      alt="شعار الشركة"
                      className="w-16 h-16 object-contain"
                    />
                    <div>
                      <h5 className="font-semibold" style={{ color: settings.primary_color || "#000" }}>
                        {settings.comp_a_name || "اسم الشركة"}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {settings.company_slogan || "شعار الشركة"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>لم يتم اختيار شعار بعد</p>
                  </div>
                )}
              </div>
            </div>

            {/* معاينة الألوان */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">معاينة الألوان</h4>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div 
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: settings.primary_color || "#000000" }}
                    />
                    <span className="text-sm">اللون الأساسي: {settings.primary_color || "#000000"}</span>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div 
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: settings.secondary_color || "#666666" }}
                    />
                    <span className="text-sm">اللون الثانوي: {settings.secondary_color || "#666666"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  const getCurrentFields = () => {
    switch (activeSection) {
      case "general":
        return GENERAL_FIELDS;
      case "accounts":
        return ACCOUNT_FIELDS;
      case "zatca":
        return ZATCA_FIELDS;
      default:
        return GENERAL_FIELDS;
    }
  };

  return (
    <div className="p-4 font-cairo">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">إعدادات النظام</h1>
        {hasChanges && (
          <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            ⚠️ تم تعديل الإعدادات
          </div>
        )}
      </div>

      {/* أزرار الأقسام */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {SECTIONS.map((section) => (
          <Card
            key={section.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeSection === section.id 
                ? "ring-2 ring-blue-500 bg-blue-50" 
                : "hover:bg-gray-50"
            }`}
            isPressable
            onPress={() => setActiveSection(section.id)}
          >
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-3">{section.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{section.label}</h3>
              <p className="text-sm text-gray-600">{section.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* محتوى القسم المحدد */}
      <Card className="mb-6">
        <CardBody>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">
              {SECTIONS.find(s => s.id === activeSection)?.label}
            </h2>
            <p className="text-gray-600">
              {SECTIONS.find(s => s.id === activeSection)?.description}
            </p>
          </div>
          {renderFields(getCurrentFields())}
        </CardBody>
      </Card>

      {/* معاينة العلامة التجارية */}
      {renderBrandingPreview()}

      <Divider className="my-6" />

      {/* أزرار الحفظ */}
      <div className="flex gap-4 justify-end">
        <Button 
          variant="bordered" 
          size="lg"
          onPress={handleReset}
          disabled={!hasChanges}
        >
          إعادة تعيين
        </Button>
        <Button 
          color="success" 
          size="lg"
          onPress={handleSave}
          disabled={!hasChanges}
        >
          {hasChanges ? "💾 حفظ الإعدادات" : "✅ محفوظ"}
        </Button>
      </div>
    </div>
  );
}
