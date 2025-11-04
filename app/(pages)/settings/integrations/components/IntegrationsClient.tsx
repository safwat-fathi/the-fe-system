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

  // حالة فاتورة
  const [fatooraConfig, setFatooraConfig] = useState<FatooraConfig>({
    name: "فاتورة - الزكاة والدخل",
    description:
      "خدمة ربط فاتورة الإلكترونية لإدارة الزكاة والدخل بشكل متكامل",
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
  
  const [isSavingFatoora, setIsSavingFatoora] = useState(false);
  const [isTestingFatoora, setIsTestingFatoora] = useState(false);
  const [showFatooraSetup, setShowFatooraSetup] = useState(false);

  // بدء إدخال المعلومات لجيديا
  const handleStartGeideaSetup = () => {
    setShowGeideaSetup(true);
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
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSaving(false);
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
    } catch (error) {
      toast.error("فشل الاتصال مع جيديا. يرجى التحقق من بيانات الاتصال");
      setGeideaConfig((prev) => ({ ...prev, status: "disconnected" }));
    } finally {
      setIsTesting(false);
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

  // حفظ إعدادات فاتورة
  const handleSaveFatoora = async () => {
    setIsSavingFatoora(true);
    try {
      // TODO: حفظ الإعدادات في قاعدة البيانات
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setFatooraConfig((prev) => ({ ...prev, status: "connected" }));
      toast.success("تم حفظ إعدادات فاتورة بنجاح");
    } catch (error) {
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
    } catch (error) {
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
        return (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        );
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

  return (
    <div className="space-y-6">
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
                    جيديا توفر لك المرونة لقبول المدفوعات بشكل آمن وسريع من
                    خلال جهاز نقاط البيع الذكي.
                  </p>
                </div>
              </div>

              {/* الجانب الأيمن: زر "ابدأ الربط" */}
              <div className="flex-shrink-0">
                <Button
                  color="primary"
                  onPress={handleStartGeideaSetup}
                  className="btn-primary border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3"
                  size="lg"
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
                  isSelected={geideaConfig.enabled}
                  onValueChange={handleToggleGeidea}
                  color="success"
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
                  label="مفتاح API (API Key)"
                  placeholder="أدخل مفتاح API من جيديا"
                  value={geideaConfig.apiKey || ""}
                  onChange={(e) =>
                    setGeideaConfig((prev) => ({
                      ...prev,
                      apiKey: e.target.value,
                    }))
                  }
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  type="password"
                  variant="bordered"
                  description="يمكنك الحصول عليه من لوحة تحكم جيديا"
                />

                {/* السر (Secret) */}
                <Input
                  label="السر (API Secret)"
                  placeholder="أدخل السر من جيديا"
                  value={geideaConfig.apiSecret || ""}
                  onChange={(e) =>
                    setGeideaConfig((prev) => ({
                      ...prev,
                      apiSecret: e.target.value,
                    }))
                  }
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  type="password"
                  variant="bordered"
                  description="المفتاح السري للاتصال بـ API"
                />

                {/* معرف التاجر */}
                <Input
                  label="معرف التاجر (Merchant ID)"
                  placeholder="أدخل معرف التاجر"
                  value={geideaConfig.merchantId || ""}
                  onChange={(e) =>
                    setGeideaConfig((prev) => ({
                      ...prev,
                      merchantId: e.target.value,
                    }))
                  }
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  variant="bordered"
                  description="معرف التاجر الخاص بك في جيديا"
                />

                {/* البيئة */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    البيئة (Environment)
                  </label>
                  <select
                    className="w-full h-10 text-sm border border-slate-300 rounded-lg px-3 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    value={geideaConfig.environment}
                    onChange={(e) =>
                      setGeideaConfig((prev) => ({
                        ...prev,
                        environment: e.target.value as "sandbox" | "production",
                      }))
                    }
                    disabled={!showGeideaSetup && !geideaConfig.enabled}
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
                  <li>
                    يمكنك الحصول على مفتاح API والسر من لوحة تحكم جيديا
                  </li>
                  <li>
                    استخدم بيئة Sandbox للاختبار قبل التبديل إلى Production
                  </li>
                  <li>
                    تأكد من حفظ بيانات الاتصال بشكل آمن
                  </li>
                </ul>
              </div>

              {/* الأزرار */}
              <div className="flex gap-3 mt-6">
                <Button
                  color="primary"
                  onPress={handleSaveGeidea}
                  isLoading={isSaving}
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  className="btn-primary"
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
                <Button
                  color="default"
                  variant="bordered"
                  onPress={handleTestGeidea}
                  isLoading={isTesting}
                  isDisabled={(!showGeideaSetup && !geideaConfig.enabled) || !geideaConfig.apiKey}
                  className="btn-secondary"
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
                  color="primary"
                  onPress={() => setShowFatooraSetup(true)}
                  className="btn-primary border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3"
                  size="lg"
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
                  isSelected={fatooraConfig.enabled}
                  onValueChange={handleToggleFatoora}
                  color="success"
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
                    isSelected={fatooraConfig.enableEInvoice}
                    onValueChange={(val) =>
                      setFatooraConfig((prev) => ({
                        ...prev,
                        enableEInvoice: val,
                      }))
                    }
                    color="success"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      تفعيل الفاتورة الإلكترونية
                    </span>
                  </Switch>
                </div>

                {/* نوع الربط */}
                <Input
                  label="نوع الربط"
                  placeholder="أدخل نوع الربط"
                  value={fatooraConfig.connectionType || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      connectionType: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
                  description="نوع الربط مع نظام فاتورة"
                />

                {/* تاريخ تفعيل الربط */}
                <Input
                  label="تاريخ تفعيل الربط"
                  placeholder="تاريخ تفعيل الربط"
                  type="date"
                  value={fatooraConfig.activationDate || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      activationDate: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
                />

                {/* مسار ملفات XML */}
                <Input
                  label="مسار ملفات XML"
                  placeholder="أدخل مسار ملفات XML"
                  value={fatooraConfig.xmlPath || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      xmlPath: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
                  description="مسار مجلد ملفات XML"
                />

                {/* اسم المستخدم */}
                <Input
                  label="اسم المستخدم"
                  placeholder="أدخل اسم المستخدم"
                  value={fatooraConfig.username || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
                />

                {/* كلمة المرور */}
                <Input
                  label="كلمة المرور"
                  placeholder="أدخل كلمة المرور"
                  type="password"
                  value={fatooraConfig.password || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
                />

                {/* الشهادة */}
                <Input
                  label="الشهادة"
                  placeholder="أدخل الشهادة"
                  value={fatooraConfig.certificate || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      certificate: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
                  description="شهادة SSL"
                />

                {/* المفتاح الخاص */}
                <Input
                  label="المفتاح الخاص"
                  placeholder="أدخل المفتاح الخاص"
                  type="password"
                  value={fatooraConfig.privateKey || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      privateKey: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
                  description="المفتاح الخاص للشهادة"
                />

                {/* آخر PIH */}
                <Input
                  label="آخر PIH"
                  placeholder="أدخل آخر PIH"
                  value={fatooraConfig.lastPIH || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      lastPIH: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
                />

                {/* آخر ICV */}
                <Input
                  label="آخر ICV"
                  placeholder="أدخل آخر ICV"
                  value={fatooraConfig.lastICV || ""}
                  onChange={(e) =>
                    setFatooraConfig((prev) => ({
                      ...prev,
                      lastICV: e.target.value,
                    }))
                  }
                  isDisabled={!fatooraConfig.enabled}
                  variant="bordered"
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
                  <li>
                    احفظ بيانات الاتصال والشهادة بشكل آمن
                  </li>
                  <li>
                    تأكد من صحة مسار ملفات XML
                  </li>
                </ul>
              </div>

              {/* الأزرار */}
              <div className="flex gap-3 mt-6">
                <Button
                  color="primary"
                  onPress={handleSaveFatoora}
                  isLoading={isSavingFatoora}
                  isDisabled={!fatooraConfig.enabled}
                  className="btn-primary"
                >
                  {isSavingFatoora ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </Button>
                <Button
                  color="default"
                  variant="bordered"
                  onPress={handleTestFatoora}
                  isLoading={isTestingFatoora}
                  isDisabled={!fatooraConfig.enabled}
                  className="btn-secondary"
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

