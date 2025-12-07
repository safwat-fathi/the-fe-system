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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("settings.integrations");

  const ENJAZATEK_DOC_URL = "https://enjazatik.com/";

  // حالة جيديا
  const [geideaConfig, setGeideaConfig] = useState<IntegrationConfig>({
    name: t("services.geidea.name"),
    description: t("services.geidea.description"),
    status: "disconnected",
    apiKey: "",
    apiSecret: "",
    merchantId: "",
    environment: "sandbox",
    enabled: false,
  });

  // حالة إنجازتك (واتساب)
  const [enjazatekConfig, setEnjazatekConfig] = useState<IntegrationConfig>({
    name: t("services.enjazatek.name"),
    description: t("services.enjazatek.description"),
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
    name: t("services.fatoora.name"),
    description: t("services.fatoora.description"),
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
      toast.error(t("services.geidea.messages.saveErrorMissing"));

      return;
    }

    setIsSaving(true);
    try {
      // TODO: حفظ الإعدادات في قاعدة البيانات أو localStorage
      // await saveIntegrationConfig("geidea", geideaConfig);

      // محاكاة الحفظ
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setGeideaConfig((prev) => ({ ...prev, status: "connected" }));
      toast.success(t("services.geidea.messages.saveSuccess"));
    } catch {
      toast.error(t("services.geidea.messages.saveError"));
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
      toast.error(t("services.enjazatek.messages.saveErrorMissing"));

      return;
    }

    setIsSavingEnjazatek(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setEnjazatekConfig((prev) => ({ ...prev, status: "connected" }));
      toast.success(t("services.enjazatek.messages.saveSuccess"));
    } catch {
      toast.error(t("services.enjazatek.messages.saveError"));
    } finally {
      setIsSavingEnjazatek(false);
    }
  };

  // اختبار الاتصال مع جيديا
  const handleTestGeidea = async () => {
    if (!geideaConfig.apiKey || !geideaConfig.apiSecret) {
      toast.error(t("services.geidea.messages.testErrorMissing"));

      return;
    }

    setIsTesting(true);
    try {
      // TODO: اختبار الاتصال مع API جيديا
      // await testGeideaConnection(geideaConfig);

      // محاكاة الاختبار
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(t("services.geidea.messages.testSuccess"));
      setGeideaConfig((prev) => ({ ...prev, status: "connected" }));
    } catch {
      toast.error(t("services.geidea.messages.testError"));
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
      toast.error(t("services.enjazatek.messages.testErrorMissing"));

      return;
    }

    setIsTestingEnjazatek(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(t("services.enjazatek.messages.testSuccess"));
      setEnjazatekConfig((prev) => ({ ...prev, status: "connected" }));
    } catch {
      toast.error(t("services.enjazatek.messages.testError"));
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
      toast.error(t("services.geidea.messages.enableError"));
      setGeideaConfig((prev) => ({ ...prev, enabled: false }));
    } else if (enabled) {
      toast.success(t("services.geidea.messages.enableSuccess"));
    } else {
      toast.success(t("services.geidea.messages.disableSuccess"));
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
      toast.error(t("services.enjazatek.messages.enableError"));

      return;
    }

    setEnjazatekConfig((prev) => ({
      ...prev,
      enabled,
      status: enabled ? prev.status : "disconnected",
    }));

    toast.success(
      enabled
        ? t("services.enjazatek.messages.enableSuccess")
        : t("services.enjazatek.messages.disableSuccess"),
    );
  };

  // حفظ إعدادات فاتورة
  const handleSaveFatoora = async () => {
    setIsSavingFatoora(true);
    try {
      // TODO: حفظ الإعدادات في قاعدة البيانات
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFatooraConfig((prev) => ({ ...prev, status: "connected" }));
      toast.success(t("services.fatoora.messages.saveSuccess"));
    } catch {
      toast.error(t("services.fatoora.messages.saveError"));
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

      toast.success(t("services.fatoora.messages.testSuccess"));
      setFatooraConfig((prev) => ({ ...prev, status: "connected" }));
    } catch {
      toast.error(t("services.fatoora.messages.testError"));
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
      toast.success(t("services.fatoora.messages.enableSuccess"));
    } else {
      toast.success(t("services.fatoora.messages.disableSuccess"));
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
        return t("status.connected");
      case "testing":
        return t("status.testing");
      default:
        return t("status.disconnected");
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
                    {t("services.enjazatek.name")}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t("services.enjazatek.descriptionShort")}{" "}
                    <a
                      className="text-emerald-600 font-semibold underline underline-offset-4"
                      href={ENJAZATEK_DOC_URL}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t("actions.learnMore")}
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
                  {t("actions.startSetup")}
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
                      {t("actions.documentation", { service: "Enjazatek" })}
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
                    {enjazatekConfig.enabled ? t("enabled") : t("disabled")}
                  </span>
                </Switch>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  description={t("services.enjazatek.fields.apiKeyDescription")}
                  label={t("services.enjazatek.fields.apiKey")}
                  placeholder={t("services.enjazatek.fields.apiKeyPlaceholder")}
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
                  description={t(
                    "services.enjazatek.fields.instanceIdDescription",
                  )}
                  label={t("services.enjazatek.fields.instanceId")}
                  placeholder={t(
                    "services.enjazatek.fields.instanceIdPlaceholder",
                  )}
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
                  label={t("services.enjazatek.fields.senderName")}
                  placeholder={t(
                    "services.enjazatek.fields.senderNamePlaceholder",
                  )}
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
                  label={t("services.enjazatek.fields.baseUrl")}
                  placeholder={t(
                    "services.enjazatek.fields.baseUrlPlaceholder",
                  )}
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
                  label={t("services.enjazatek.fields.webhookUrl")}
                  placeholder={t(
                    "services.enjazatek.fields.webhookUrlPlaceholder",
                  )}
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
                  {isSavingEnjazatek
                    ? t("actions.saving")
                    : t("actions.saveSettings")}
                </Button>
                <Button
                  className="min-w-[140px]"
                  color="success"
                  isLoading={isTestingEnjazatek}
                  variant="bordered"
                  onPress={handleTestEnjazatek}
                >
                  {isTestingEnjazatek
                    ? t("actions.testing")
                    : t("actions.testConnection")}
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
                  {t("actions.userGuide")}
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
                    {t("services.geidea.name")}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t("services.geidea.descriptionShort")}
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
                  {t("actions.startSetup")}
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
                    {geideaConfig.enabled ? t("enabled") : t("disabled")}
                  </span>
                </Switch>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* مفتاح API */}
                <Input
                  description={t("services.geidea.fields.apiKeyDescription")}
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  label={t("services.geidea.fields.apiKey")}
                  placeholder={t("services.geidea.fields.apiKeyPlaceholder")}
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
                  description={t("services.geidea.fields.apiSecretDescription")}
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  label={t("services.geidea.fields.apiSecret")}
                  placeholder={t("services.geidea.fields.apiSecretPlaceholder")}
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
                  description={t(
                    "services.geidea.fields.merchantIdDescription",
                  )}
                  isDisabled={!showGeideaSetup && !geideaConfig.enabled}
                  label={t("services.geidea.fields.merchantId")}
                  placeholder={t(
                    "services.geidea.fields.merchantIdPlaceholder",
                  )}
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
                    {t("services.geidea.fields.environment")}
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
                    <option value="sandbox">
                      {t("services.geidea.fields.environmentSandbox")}
                    </option>
                    <option value="production">
                      {t("services.geidea.fields.environmentProduction")}
                    </option>
                  </select>
                  <p className="text-xs text-slate-500">
                    {t("services.geidea.fields.environmentDescription")}
                  </p>
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  {t("services.geidea.info.title")}
                </h3>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  {t
                    .raw("services.geidea.info.items")
                    .map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
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
                  {isSaving ? t("actions.saving") : t("actions.saveSettings")}
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
                  {isTesting
                    ? t("actions.testing")
                    : t("actions.testConnection")}
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
                    {t("services.fatoora.name")}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t("services.fatoora.description")}
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
                  {t("actions.startSetup")}
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
                    {t("services.fatoora.name")}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {t("services.fatoora.description")}
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
                    {fatooraConfig.enabled ? t("enabled") : t("disabled")}
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
                      {t("services.fatoora.fields.enableEInvoice")}
                    </span>
                  </Switch>
                </div>

                {/* نوع الربط */}
                <Input
                  description={t(
                    "services.fatoora.fields.connectionTypeDescription",
                  )}
                  isDisabled={!fatooraConfig.enabled}
                  label={t("services.fatoora.fields.connectionType")}
                  placeholder={t(
                    "services.fatoora.fields.connectionTypePlaceholder",
                  )}
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
                  label={t("services.fatoora.fields.activationDate")}
                  placeholder={t(
                    "services.fatoora.fields.activationDatePlaceholder",
                  )}
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
                  description={t("services.fatoora.fields.xmlPathDescription")}
                  isDisabled={!fatooraConfig.enabled}
                  label={t("services.fatoora.fields.xmlPath")}
                  placeholder={t("services.fatoora.fields.xmlPathPlaceholder")}
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
                  label={t("services.fatoora.fields.username")}
                  placeholder={t("services.fatoora.fields.usernamePlaceholder")}
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
                  label={t("services.fatoora.fields.password")}
                  placeholder={t("services.fatoora.fields.passwordPlaceholder")}
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
                  description={t(
                    "services.fatoora.fields.certificateDescription",
                  )}
                  isDisabled={!fatooraConfig.enabled}
                  label={t("services.fatoora.fields.certificate")}
                  placeholder={t(
                    "services.fatoora.fields.certificatePlaceholder",
                  )}
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
                  description={t(
                    "services.fatoora.fields.privateKeyDescription",
                  )}
                  isDisabled={!fatooraConfig.enabled}
                  label={t("services.fatoora.fields.privateKey")}
                  placeholder={t(
                    "services.fatoora.fields.privateKeyPlaceholder",
                  )}
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
                  label={t("services.fatoora.fields.lastPIH")}
                  placeholder={t("services.fatoora.fields.lastPIHPlaceholder")}
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
                  label={t("services.fatoora.fields.lastICV")}
                  placeholder={t("services.fatoora.fields.lastICVPlaceholder")}
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
                  {t("services.fatoora.info.title")}
                </h3>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  {t
                    .raw("services.fatoora.info.items")
                    .map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
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
                  {isSavingFatoora
                    ? t("actions.saving")
                    : t("actions.saveSettings")}
                </Button>
                <Button
                  className="btn-secondary"
                  color="default"
                  isDisabled={!fatooraConfig.enabled}
                  isLoading={isTestingFatoora}
                  variant="bordered"
                  onPress={handleTestFatoora}
                >
                  {isTestingFatoora
                    ? t("actions.testing")
                    : t("actions.testConnection")}
                </Button>
              </div>
            </CardBody>
          </>
        )}
      </Card>
    </div>
  );
}
