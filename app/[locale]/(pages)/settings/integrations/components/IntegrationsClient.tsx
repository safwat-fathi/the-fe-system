"use client";

import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Switch,
  Divider,
} from "@heroui/react";
import {
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// نوع لبيانات خدمة الربط
type IntegrationStatus = "connected" | "disconnected" | "testing";

interface IntegrationConfig {
  name: string;
  description: string;
  status: IntegrationStatus;
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  environment?: "sandbox" | "production";
  senderName?: string;
  instanceId?: string;
  baseUrl?: string;
  webhookUrl?: string;
  enabled: boolean;
}

interface FatooraConfig {
  name: string;
  description: string;
  status: IntegrationStatus;
  enableEInvoice: boolean;
  connectionType: string;
  activationDate: string;
  xmlPath: string;
  username: string;
  password: string;
  certificate: string;
  privateKey: string;
  lastPIH: string;
  lastICV: string;
  enabled: boolean;
}

export default function IntegrationsClient() {
  const ENJAZATEK_DOC_URL = "https://enjazatik.com/";

  // حالة جيديا
  const [geideaConfig, setGeideaConfig] = useState<IntegrationConfig>({
    name: "جيديا",
    description:
      "خدمة الدفع الإلكتروني الرائدة في السعودية. تتيح قبول المدفوعات عبر البطاقات والمحافظ الرقمية.",
    status: "disconnected",
    apiKey: "",
    apiSecret: "",
    merchantId: "",
    environment: "sandbox",
    enabled: false,
  });

  // حالة إنجازتك (واتساب)
  const [enjazatekConfig, setEnjazatekConfig] = useState<IntegrationConfig>({
    name: "Enjazatek WhatsApp",
    description:
      "انجـازاتك توفر منصة رسائل واتساب احترافية لإرسال التنبيهات والحملات التسويقية مع دعم كامل للوسائط.",
    status: "disconnected",
    apiKey: "",
    senderName: "",
    instanceId: "",
    baseUrl: "",
    webhookUrl: "",
    enabled: false,
  });

  // حالة فاتورة
  const [fatooraConfig, setFatooraConfig] = useState<FatooraConfig>({
    name: "فاتورة - الزكاة والدخل",
    description: "خدمة ربط فاتورة الإلكترونية لإدارة الزكاة والدخل بشكل متكامل",
    status: "disconnected",
    enableEInvoice: false,
    connectionType: "",
    activationDate: "",
    xmlPath: "",
    username: "",
    password: "",
    certificate: "",
    privateKey: "",
    lastPIH: "",
    lastICV: "",
    enabled: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showGeideaSetup, setShowGeideaSetup] = useState(false);
  const [showEnjazatekSetup, setShowEnjazatekSetup] = useState(false);

  const [isSavingFatoora, setIsSavingFatoora] = useState(false);
  const [isTestingFatoora, setIsTestingFatoora] = useState(false);
  const [showFatooraSetup, setShowFatooraSetup] = useState(false);

  const [isSavingEnjazatek, setIsSavingEnjazatek] = useState(false);
  const [isTestingEnjazatek, setIsTestingEnjazatek] = useState(false);

  // بدء إدخال المعلومات لجيديا
  const handleStartGeideaSetup = () => {
    setShowGeideaSetup(true);
  };

  const handleStartEnjazatekSetup = () => {
    setShowEnjazatekSetup(true);
  };

  // حفظ إعدادات جيديا
  const handleSaveGeidea = async () => {
    if (!geideaConfig.apiKey || !geideaConfig.apiSecret) {
      toast.error("يرجى إدخال مفتاح API والسر");

      return;
    }

    setIsSaving(true);
    try {
      // TODO: حفظ الإعدادات في قاعدة البيانات أو localStorage
      // await saveIntegrationConfig("geidea", geideaConfig);

      // محاكاة الحفظ
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setGeideaConfig((prev) => ({ ...prev, status: "connected" }));
      toast.success("تم حفظ إعدادات جيديا بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  // حفظ إعدادات إنجازتك
  const handleSaveEnjazatek = async () => {
    if (
      !enjazatekConfig.apiKey ||
      !enjazatekConfig.senderName ||
      !enjazatekConfig.instanceId
    ) {
      toast.error("يرجى إدخال مفتاح API، ومعرف الإرسال، ورقم المثيل أولاً");

      return;
    }

    setIsSavingEnjazatek(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setEnjazatekConfig((prev) => ({ ...prev, status: "connected" }));
      toast.success("تم حفظ إعدادات Enjazatek بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ إعدادات Enjazatek");
    } finally {
      setIsSavingEnjazatek(false);
    }
  };

  // اختبار الاتصال مع جيديا
  const handleTestGeidea = async () => {
    if (!geideaConfig.apiKey || !geideaConfig.apiSecret) {
      toast.error("يرجى إدخال مفتاح API والسر أولاً");

      return;
    }

    setIsTesting(true);
    try {
      // TODO: اختبار الاتصال مع API جيديا
      // await testGeideaConnection(geideaConfig);

      // محاكاة الاختبار
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("تم الاتصال بنجاح مع جيديا");
      setGeideaConfig((prev) => ({ ...prev, status: "connected" }));
    } catch {
      toast.error("فشل الاتصال مع جيديا. يرجى التحقق من بيانات الاتصال");
      setGeideaConfig((prev) => ({ ...prev, status: "disconnected" }));
    } finally {
      setIsTesting(false);
    }
  };

  // اختبار الاتصال مع إنجازتك
  const handleTestEnjazatek = async () => {
    if (
      !enjazatekConfig.apiKey ||
      !enjazatekConfig.senderName ||
      !enjazatekConfig.instanceId
    ) {
      toast.error("يرجى إكمال بيانات الربط قبل الاختبار");

      return;
    }

    setIsTestingEnjazatek(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("تم الاتصال مع Enjazatek بنجاح (اختبار تجريبي)");
      setEnjazatekConfig((prev) => ({ ...prev, status: "connected" }));
    } catch {
      toast.error("فشل الاتصال مع Enjazatek، يرجى التحقق من البيانات");
      setEnjazatekConfig((prev) => ({ ...prev, status: "disconnected" }));
    } finally {
      setIsTestingEnjazatek(false);
    }
  };

  // تبديل تفعيل/إلغاء تفعيل الخدمة
  const handleToggleGeidea = (enabled: boolean) => {
    setGeideaConfig((prev) => ({
      ...prev,
      enabled,
      status: enabled ? prev.status : "disconnected",
    }));

    if (enabled && (!geideaConfig.apiKey || !geideaConfig.apiSecret)) {
      toast.error("يرجى إدخال بيانات الاتصال أولاً");
      setGeideaConfig((prev) => ({ ...prev, enabled: false }));
    } else if (enabled) {
      toast.success("تم تفعيل خدمة جيديا");
    } else {
      toast.success("تم إلغاء تفعيل خدمة جيديا");
    }
  };

  // تبديل تفعيل/إلغاء تفعيل إنجازتك
  const handleToggleEnjazatek = (enabled: boolean) => {
    if (
      enabled &&
      (!enjazatekConfig.apiKey ||
        !enjazatekConfig.senderName ||
        !enjazatekConfig.instanceId)
    ) {
      toast.error("يرجى إكمال بيانات Enjazatek أولاً");

      return;
    }

    setEnjazatekConfig((prev) => ({
      ...prev,
      enabled,
      status: enabled ? prev.status : "disconnected",
    }));

    toast.success(
      enabled ? "تم تفعيل خدمة Enjazatek" : "تم إلغاء تفعيل خدمة Enjazatek",
    );
  };

  // حفظ إعدادات فاتورة
  const handleSaveFatoora = async () => {
    setIsSavingFatoora(true);
    try {
      // TODO: حفظ الإعدادات في قاعدة البيانات
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFatooraConfig((prev) => ({ ...prev, status: "connected" }));
      toast.success("تم حفظ إعدادات فاتورة بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSavingFatoora(false);
    }
  };

  // اختبار الاتصال مع فاتورة
  const handleTestFatoora = async () => {
    setIsTestingFatoora(true);
    try {
      // TODO: اختبار الاتصال مع API فاتورة
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("تم الاتصال بنجاح مع فاتورة");
      setFatooraConfig((prev) => ({ ...prev, status: "connected" }));
    } catch {
      toast.error("فشل الاتصال مع فاتورة. يرجى التحقق من بيانات الاتصال");
      setFatooraConfig((prev) => ({ ...prev, status: "disconnected" }));
    } finally {
      setIsTestingFatoora(false);
    }
  };

  // تبديل تفعيل/إلغاء تفعيل خدمة فاتورة
  const handleToggleFatoora = (enabled: boolean) => {
    setFatooraConfig((prev) => ({
      ...prev,
      enabled,
      status: enabled ? prev.status : "disconnected",
    }));

    if (enabled) {
      toast.success("تم تفعيل خدمة فاتورة");
    } else {
      toast.success("تم إلغاء تفعيل خدمة فاتورة");
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "testing":
        return (
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return "متصل";
      case "testing":
        return "جاري الاختبار...";
      default:
        return "غير متصل";
    }
  };

  // التحقق من وجود بيانات للإعداد
  const hasGeideaData =
    geideaConfig.apiKey || geideaConfig.apiSecret || geideaConfig.merchantId;

  const hasEnjazatekData =
    enjazatekConfig.apiKey ||
    enjazatekConfig.senderName ||
    enjazatekConfig.instanceId ||
    enjazatekConfig.baseUrl ||
    enjazatekConfig.webhookUrl;

  return (
    <div className="space-y-6">
      {/* Enjazatek WhatsApp */}
      <Card className="shadow-md">
        {!hasEnjazatekData && !showEnjazatekSetup ? (
          <CardBody className="p-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="rounded-lg p-3 flex items-center justify-center bg-emerald-50 border border-emerald-200">
                    <span className="text-xl font-black text-emerald-600 tracking-tight">
                      Enjazatek
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Enjazatek WhatsApp
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    منصة رسائل واتساب احترافية مع دعم الوسائط والردود التفاعلية.
                    مثالية للتنبيهات الفورية والحملات التسويقية{" "}
                    <a
                      className="text-emerald-600 font-semibold underline underline-offset-4"
                      href={ENJAZATEK_DOC_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      تعرّف على الخدمة
                    </a>
                    .
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  className="btn-primary border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3"
                  color="primary"
                  size="lg"
                  onPress={handleStartEnjazatekSetup}
                >
                  ابدأ الربط
                </Button>
              </div>
            </div>
          </CardBody>
        ) : (
          <>
            <CardHeader className="flex justify-between items-center pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 flex items-center justify-center">
                  <span className="text-lg font-black text-blue-600 tracking-tight">
                    Enjazatek
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {enjazatekConfig.name}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {enjazatekConfig.description}
                  </p>
                  <div className="mt-2">
                    <a
                      className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold underline underline-offset-4"
                      href={ENJAZATEK_DOC_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <LinkIcon className="h-4 w-4" />
                      وثائق Enjazatek
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(enjazatekConfig.status)}
                  <span className="text-sm text-slate-600">
                    {getStatusText(enjazatekConfig.status)}
                  </span>
                </div>
                <Switch
                  color="success"
                  isSelected={enjazatekConfig.enabled}
                  onValueChange={handleToggleEnjazatek}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {enjazatekConfig.enabled ? "مفعل" : "معطل"}
                  </span>
                </Switch>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  description="متوفر في لوحة تحكم Enjazatek"
                  label="مفتاح API"
                  placeholder="أدخل مفتاح Enjazatek"
                  type="password"
                  value={enjazatekConfig.apiKey || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setEnjazatekConfig((prev) => ({
                      ...prev,
                      apiKey: e.target.value,
                    }))
                  }
                />
                <Input
                  description="يربط التطبيق بقناة الواتساب الخاصة بك"
                  label="معرف المثيل (Instance ID)"
                  placeholder="أدخل معرف المثيل"
                  value={enjazatekConfig.instanceId || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setEnjazatekConfig((prev) => ({
                      ...prev,
                      instanceId: e.target.value,
                    }))
                  }
                />
                <Input
                  label="اسم المرسل (Sender Name)"
                  placeholder="الاسم الذي سيظهر للمستلمين"
                  value={enjazatekConfig.senderName || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setEnjazatekConfig((prev) => ({
                      ...prev,
                      senderName: e.target.value,
                    }))
                  }
                />
                <Input
                  label="عنوان واجهة API"
                  placeholder="مثال: https://enjazatik.com/api"
                  value={enjazatekConfig.baseUrl || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setEnjazatekConfig((prev) => ({
                      ...prev,
                      baseUrl: e.target.value,
                    }))
                  }
                />
                <Input
                  label="رابط Webhook (اختياري)"
                  placeholder="استخدمه لتلقي تقارير التسليم"
                  value={enjazatekConfig.webhookUrl || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setEnjazatekConfig((prev) => ({
                      ...prev,
                      webhookUrl: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <Button
                  className="min-w-[140px]"
                  color="primary"
                  isLoading={isSavingEnjazatek}
                  onPress={handleSaveEnjazatek}
                >
                  حفظ الإعدادات
                </Button>
                <Button
                  className="min-w-[140px]"
                  color="success"
                  isLoading={isTestingEnjazatek}
                  variant="bordered"
                  onPress={handleTestEnjazatek}
                >
                  اختبار الاتصال
                </Button>
                <Button
                  as="a"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  endContent={<LinkIcon className="h-4 w-4" />}
                  href={ENJAZATEK_DOC_URL}
                  rel="noreferrer"
                  target="_blank"
                  variant="light"
                >
                  دليل الاستخدام
                </Button>
              </div>
            </CardBody>
          </>
        )}
      </Card>

      {/* جيديا */}
      <Card className="shadow-md">
        {/* إذا لم تكن هناك بيانات ولم يتم الضغط على "ابدأ الربط" */}
        {!hasGeideaData && !showGeideaSetup ? (
          <CardBody className="p-6">
            {/* بانر جيديا */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* الجانب الأيسر: المعلومات */}
              <div className="flex-1 flex items-center gap-4">
                {/* شعار جيديا */}
                <div className="flex-shrink-0">
                  <div className="rounded-lg p-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-500 tracking-tight">
                      geidea
                    </span>
                  </div>
                </div>

                {/* النص */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    جيديا
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    جيديا توفر لك المرونة لقبول المدفوعات بشكل آمن وسريع من خلال
                    جهاز نقاط البيع الذكي.
                  </p>
                </div>
              </div>

              {/* الجانب الأيمن: زر "ابدأ الربط" */}
              <div className="flex-shrink-0">
                <Button
                  className="btn-primary border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3"
                  color="primary"
                  size="lg"
                  onPress={handleStartGeideaSetup}
                >
                  ابدأ الربط
                </Button>
              </div>
            </div>
          </CardBody>
        ) : (
          <>
            <CardHeader className="flex justify-between items-center pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 flex items-center justify-center">
                  <span className="text-lg font-bold text-orange-500 tracking-tight">
                    geidea
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {geideaConfig.name}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {geideaConfig.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(geideaConfig.status)}
                  <span className="text-sm text-slate-600">
                    {getStatusText(geideaConfig.status)}
                  </span>
                </div>
                <Switch
                  color="success"
                  isSelected={geideaConfig.enabled}
                  onValueChange={handleToggleGeidea}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {geideaConfig.enabled ? "مفعل" : "معطل"}
                  </span>
                </Switch>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* مفتاح API */}
                <Input
                  description="يمكنك الحصول عليه من لوحة تحكم جيديا"
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  label="مفتاح API (API Key)"
                  placeholder="أدخل مفتاح API من جيديا"
                  type="password"
                  value={geideaConfig.apiKey || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setGeideaConfig((prev) => ({
                      ...prev,
                      apiKey: e.target.value,
                    }))
                  }
                />

                {/* السر (Secret) */}
                <Input
                  description="المفتاح السري للاتصال بـ API"
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  label="السر (API Secret)"
                  placeholder="أدخل السر من جيديا"
                  type="password"
                  value={geideaConfig.apiSecret || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setGeideaConfig((prev) => ({
                      ...prev,
                      apiSecret: e.target.value,
                    }))
                  }
                />

                {/* معرف التاجر */}
                <Input
                  description="معرف التاجر الخاص بك في جيديا"
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  label="معرف التاجر (Merchant ID)"
                  placeholder="أدخل معرف التاجر"
                  value={geideaConfig.merchantId || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setGeideaConfig((prev) => ({
                      ...prev,
                      merchantId: e.target.value,
                    }))
                  }
                />

                {/* البيئة */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-sm font-medium text-slate-700"
                    htmlFor="geidea-environment"
                  >
                    البيئة (Environment)
                  </label>
                  <select
                    className="w-full h-10 text-sm border border-slate-300 rounded-lg px-3 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    disabled={!showGeideaSetup && !geideaConfig.enabled}
                    id="geidea-environment"
                    value={geideaConfig.environment}
                    onChange={(e) =>
                      setGeideaConfig((prev) => ({
                        ...prev,
                        environment: e.target.value as "sandbox" | "production",
                      }))
                    }
                  >
                    <option value="sandbox">Sandbox (اختبار)</option>
                    <option value="production">Production (إنتاج)</option>
                  </select>
                  <p className="text-xs text-slate-500">
                    اختر Sandbox للاختبار أو Production للاستخدام الفعلي
                  </p>
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  معلومات مهمة:
                </h3>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>يمكنك الحصول على مفتاح API والسر من لوحة تحكم جيديا</li>
                  <li>
                    استخدم بيئة Sandbox للاختبار قبل التبديل إلى Production
                  </li>
                  <li>تأكد من حفظ بيانات الاتصال بشكل آمن</li>
                </ul>
              </div>

              {/* الأزرار */}
              <div className="flex gap-3 mt-6">
                <Button
                  className="btn-primary"
                  color="primary"
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  isLoading={isSaving}
                  onPress={handleSaveGeidea}
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
                <Button
                  className="btn-secondary"
                  color="default"
                  isDisabled={
                    (!showGeideaSetup && !geideaConfig.enabled) ||
                    !geideaConfig.apiKey
                  }
                  isLoading={isTesting}
                  variant="bordered"
                  onPress={handleTestGeidea}
                >
                  {isTesting ? "جاري الاختبار..." : "اختبار الاتصال"}
                </Button>
              </div>
            </CardBody>
          </>
        )}
      </Card>

      {/* فاتورة - الزكاة والدخل */}
      <Card className="shadow-md">
        {/* إذا لم تكن هناك بيانات ولم يتم الضغط على "ابدأ الربط" */}
        {!showFatooraSetup ? (
          <CardBody className="p-6">
            {/* بانر فاتورة */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* الجانب الأيسر: المعلومات */}
              <div className="flex-1 flex items-center gap-4">
                {/* شعار فاتورة */}
                <div className="flex-shrink-0">
                  <div className="rounded-lg p-3 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-800 mb-1">
                        فاتورة
                      </div>
                      <div className="text-xs font-semibold text-slate-600">
                        Fatoora
                      </div>
                    </div>
                  </div>
                </div>

                {/* النص */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    فاتورة - الزكاة والدخل
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    خدمة ربط فاتورة الإلكترونية لإدارة الزكاة والدخل بشكل متكامل
                  </p>
                </div>
              </div>

              {/* الجانب الأيمن: زر "ابدأ الربط" */}
              <div className="flex-shrink-0">
                <Button
                  className="btn-primary border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3"
                  color="primary"
                  size="lg"
                  onPress={() => setShowFatooraSetup(true)}
                >
                  ابدأ الربط
                </Button>
              </div>
            </div>
          </CardBody>
        ) : (
          <>
            <CardHeader className="flex justify-between items-center pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-800">
                      فاتورة
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      Fatoora
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    فاتورة - الزكاة والدخل
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    خدمة ربط فاتورة الإلكترونية لإدارة الزكاة والدخل بشكل متكامل
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(fatooraConfig.status)}
                  <span className="text-sm text-slate-600">
                    {getStatusText(fatooraConfig.status)}
                  </span>
                </div>
                <Switch
                  color="success"
                  isSelected={fatooraConfig.enabled}
                  onValueChange={handleToggleFatoora}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {fatooraConfig.enabled ? "مفعل" : "معطل"}
                  </span>
                </Switch>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* تفعيل الفاتورة الإلكترونية */}
                <div className="flex items-center gap-3">
                  <Switch
                    color="success"
                    isSelected={fatooraConfig.enableEInvoice}
                    onValueChange={(val) =>
                      setFatooraConfig((prev) => ({
                        ...prev,
                        enableEInvoice: val,
                      }))
                    }
                  >
                    <span className="text-sm font-medium text-slate-700">
                      تفعيل الفاتورة الإلكترونية
                    </span>
                  </Switch>
                </div>

                {/* نوع الربط */}
                <Input
                  description="نوع الربط مع نظام فاتورة"
                  isDisabled={!fatooraConfig.enabled}
                  label="نوع الربط"
                  placeholder="أدخل نوع الربط"
                  value={fatooraConfig.connectionType || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      connectionType: e.target.value,
                    }))
                  }
                />

                {/* تاريخ تفعيل الربط */}
                <Input
                  isDisabled={!fatooraConfig.enabled}
                  label="تاريخ تفعيل الربط"
                  placeholder="تاريخ تفعيل الربط"
                  type="date"
                  value={fatooraConfig.activationDate || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      activationDate: e.target.value,
                    }))
                  }
                />

                {/* مسار ملفات XML */}
                <Input
                  description="مسار مجلد ملفات XML"
                  isDisabled={!fatooraConfig.enabled}
                  label="مسار ملفات XML"
                  placeholder="أدخل مسار ملفات XML"
                  value={fatooraConfig.xmlPath || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      xmlPath: e.target.value,
                    }))
                  }
                />

                {/* اسم المستخدم */}
                <Input
                  isDisabled={!fatooraConfig.enabled}
                  label="اسم المستخدم"
                  placeholder="أدخل اسم المستخدم"
                  value={fatooraConfig.username || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />

                {/* كلمة المرور */}
                <Input
                  isDisabled={!fatooraConfig.enabled}
                  label="كلمة المرور"
                  placeholder="أدخل كلمة المرور"
                  type="password"
                  value={fatooraConfig.password || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />

                {/* الشهادة */}
                <Input
                  description="شهادة SSL"
                  isDisabled={!fatooraConfig.enabled}
                  label="الشهادة"
                  placeholder="أدخل الشهادة"
                  value={fatooraConfig.certificate || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      certificate: e.target.value,
                    }))
                  }
                />

                {/* المفتاح الخاص */}
                <Input
                  description="المفتاح الخاص للشهادة"
                  isDisabled={!fatooraConfig.enabled}
                  label="المفتاح الخاص"
                  placeholder="أدخل المفتاح الخاص"
                  type="password"
                  value={fatooraConfig.privateKey || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      privateKey: e.target.value,
                    }))
                  }
                />

                {/* آخر PIH */}
                <Input
                  isDisabled={!fatooraConfig.enabled}
                  label="آخر PIH"
                  placeholder="أدخل آخر PIH"
                  value={fatooraConfig.lastPIH || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      lastPIH: e.target.value,
                    }))
                  }
                />

                {/* آخر ICV */}
                <Input
                  isDisabled={!fatooraConfig.enabled}
                  label="آخر ICV"
                  placeholder="أدخل آخر ICV"
                  value={fatooraConfig.lastICV || ""}
                  variant="bordered"
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      lastICV: e.target.value,
                    }))
                  }
                />
              </div>

              {/* معلومات إضافية */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  معلومات مهمة:
                </h3>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    تأكد من تفعيل الفاتورة الإلكترونية قبل إعداد باقي الخدمات
                  </li>
                  <li>احفظ بيانات الاتصال والشهادة بشكل آمن</li>
                  <li>تأكد من صحة مسار ملفات XML</li>
                </ul>
              </div>

              {/* الأزرار */}
              <div className="flex gap-3 mt-6">
                <Button
                  className="btn-primary"
                  color="primary"
                  isDisabled={!fatooraConfig.enabled}
                  isLoading={isSavingFatoora}
                  onPress={handleSaveFatoora}
                >
                  {isSavingFatoora ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
                <Button
                  className="btn-secondary"
                  color="default"
                  isDisabled={!fatooraConfig.enabled}
                  isLoading={isTestingFatoora}
                  variant="bordered"
                  onPress={handleTestFatoora}
                >
                  {isTestingFatoora ? "جاري الاختبار..." : "اختبار الاتصال"}
                </Button>
              </div>
            </CardBody>
          </>
        )}
      </Card>
    </div>
  );
}
