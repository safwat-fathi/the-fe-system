"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem, Checkbox } from "@heroui/react";
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";
import { getLocaleDir } from "@/i18n/config";

import currencyService from "@/services/api/currency.service";
import { getCurrencyOptions, findCurrencyByCode } from "@/utilities/currencies";
import currencyExchangeService from "@/services/external/currency-exchange.service";

type CurrencyFormMode = "view" | "edit" | "add";

interface Currency {
  id: number;
  cur_name: string;
  cur_name_e: string;
  cur_part: string;
  cur_part_e: string;
  cur_sign: string;
  cur_price: string;
  cur_tag: string;
  cr_date: string;
  cur_status: boolean;
}

interface CurrencyFormClientProps {
  mode: CurrencyFormMode;
  initialCurrency: Partial<Currency>;
}

const CurrencyFormClient = ({
  mode,
  initialCurrency,
}: CurrencyFormClientProps) => {
  const router = useRouter();
  const locale = useLocale();
  const dir = getLocaleDir(locale as "ar" | "en");
  const t = useTranslations("basic.currencies");
  
  // Dynamic text alignment classes based on locale
  const textAlign = dir === "rtl" ? "text-right" : "text-left";
  
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [currency, setCurrency] = useState<Partial<Currency>>(initialCurrency);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>("");

  const handleSave = async () => {
    if (!currency.cur_name || currency.cur_name.trim() === "") {
      toast.error(t("messages.nameRequired"));

      return;
    }

    if (!currency.cur_price || currency.cur_price.trim() === "") {
      toast.error(t("messages.priceRequired"));

      return;
    }

    setIsSaving(true);

    try {
      let result: Currency | null = null;

      if (isAddMode) {
        result = await currencyService.createCurrency(
          currency as Omit<Currency, "id">,
        );
      } else if (currency.id) {
        result = await currencyService.updateCurrency(currency.id, currency);
      }

      if (result) {
        toast.success(
          isAddMode
            ? t("messages.addSuccess")
            : t("messages.updateSuccess"),
        );
        router.push("/basic/currencies");
        router.refresh();
      } else {
        toast.error(t("messages.operationFailed"));
      }
    } catch {
      toast.error(t("messages.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    router.push(`/basic/currencies/${currency.id}?mode=edit`);
  };

  const handleCurrencySelect = async (selectedCode: string) => {
    const currencyInfo = findCurrencyByCode(selectedCode);

    if (currencyInfo) {
      setSelectedCurrencyCode(currencyInfo.code);

      const tagChar = currencyInfo.code.charAt(0).toUpperCase();

      setCurrency({
        ...currency,
        cur_tag: tagChar,
        cur_name: currencyInfo.nameAr,
        cur_name_e: currencyInfo.nameEn,
        cur_part: currencyInfo.fractionalUnit,
        cur_part_e: currencyInfo.fractionalUnitEn,
        cur_sign: currencyInfo.symbol,
      });

      if (selectedCode.toUpperCase() !== "SAR") {
        setIsLoadingPrice(true);
        try {
          const exchangeRate =
            await currencyExchangeService.getExchangeRateToSAR(selectedCode);

          if (exchangeRate && exchangeRate > 0) {
            setCurrency((prev) => ({
              ...prev,
              cur_price: exchangeRate.toFixed(2),
            }));
            toast.success(
              t("messages.currencyInfoWithPriceLoaded", {
                name: currencyInfo.nameAr,
              }),
              { duration: 3000 },
            );
          } else {
            toast.success(
              t("messages.currencyInfoLoaded", { name: currencyInfo.nameAr }),
            );
            toast(t("messages.exchangeRateNotFetched"), {
              icon: "ℹ️",
              duration: 4000,
            });
          }
        } catch {
          toast.success(
            t("messages.currencyInfoLoaded", { name: currencyInfo.nameAr }),
          );
          toast(t("messages.exchangeRateNotFetched"), {
            icon: "ℹ️",
            duration: 4000,
          });
        } finally {
          setIsLoadingPrice(false);
        }
      } else {
        setCurrency((prev) => ({
          ...prev,
          cur_price: "1",
        }));
        toast.success(
          t("messages.currencyInfoLoaded", { name: currencyInfo.nameAr }),
        );
      }
    }
  };

  const handleRefreshPrice = async () => {
    const currencyCode =
      selectedCurrencyCode ||
      getCurrencyOptions().find(
        (opt) =>
          opt.value.charAt(0).toUpperCase() === currency.cur_tag?.toUpperCase(),
      )?.value;

    if (!currencyCode) {
      toast.error(t("messages.cannotRefreshPrice"));

      return;
    }

    setIsLoadingPrice(true);
    try {
      const exchangeRate =
        await currencyExchangeService.getExchangeRateToSAR(currencyCode);

      if (exchangeRate && exchangeRate > 0) {
        setCurrency((prev) => ({
          ...prev,
          cur_price: exchangeRate.toFixed(2),
        }));
        toast.success(t("messages.priceRefreshSuccess"), { duration: 3000 });
      } else {
        toast.error(t("messages.priceRefreshError"));
      }
    } catch {
      toast.error(t("messages.priceRefreshFailed"));
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const getTitle = () => {
    if (isViewMode)
      return t("titles.view", {
        name: currency.cur_name || t("titles.defaultName"),
      });
    if (isAddMode) return t("titles.add");

    return t("titles.edit", {
      name: currency.cur_name || t("titles.defaultName"),
    });
  };

  const getDescription = () => {
    if (isViewMode) return t("descriptions.view");
    if (isAddMode) return t("descriptions.add");

    return t("descriptions.edit");
  };

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
          <Button
            variant="light"
            onPress={() => router.push("/basic/currencies")}
          >
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
                onPress={() => router.push("/basic/currencies")}
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
      <div className="space-y-6">
        {/* اختيار العملة من القائمة العالمية - فقط في وضع الإضافة */}
        {isAddMode && (
          <div>
            <Select
              isDisabled={isViewMode}
              label={t("labels.selectCurrency")}
              placeholder={t("labels.selectCurrencyPlaceholder")}
              selectedKeys={currency.cur_tag ? [currency.cur_tag] : []}
              variant="bordered"
              onSelectionChange={async (keys) => {
                const selectedCode = Array.from(keys)[0] as string;

                if (selectedCode) {
                  await handleCurrencySelect(selectedCode);
                }
              }}
            >
              {getCurrencyOptions().map((option) => (
                <SelectItem key={option.value} textValue={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <p className={`text-sm text-gray-500 mt-1 ${textAlign}`}>
              {t("labels.selectCurrencyHint")}
            </p>
          </div>
        )}

        {/* تفاصيل العملة */}
        <div>
          <h3 className={`text-lg font-semibold mb-3 text-gray-700 ${textAlign}`}>
            {t("labels.currencyDetails")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              isRequired
              isDisabled={isViewMode}
              label={t("fields.name")}
              value={currency.cur_name || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_name: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label={t("fields.nameEn")}
              value={currency.cur_name_e || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_name_e: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label={t("fields.part")}
              value={currency.cur_part || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_part: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label={t("fields.partEn")}
              value={currency.cur_part_e || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_part_e: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label={t("fields.sign")}
              value={currency.cur_sign || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_sign: e.target.value })
              }
            />
            <div>
              <Input
                description={t("labels.tagDescription")}
                isDisabled={isViewMode}
                label={t("fields.tag")}
                maxLength={1}
                placeholder={t("labels.tagPlaceholder")}
                value={currency.cur_tag || ""}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 1).toUpperCase();

                  setCurrency({ ...currency, cur_tag: value });
                }}
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                isRequired
                className="flex-1"
                description={
                  isLoadingPrice
                    ? t("labels.priceLoading")
                    : t("labels.priceDescription")
                }
                isDisabled={isViewMode || isLoadingPrice}
                label={t("fields.price")}
                value={currency.cur_price || ""}
                onChange={(e) =>
                  setCurrency({ ...currency, cur_price: e.target.value })
                }
              />
              {isAddMode &&
                (selectedCurrencyCode || currency.cur_tag) &&
                !isViewMode && (
                  <Button
                    isIconOnly
                    className="h-[56px] min-w-[40px] bg-transparent hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded-lg transition-colors"
                    isLoading={isLoadingPrice}
                    size="md"
                    title={t("actions.refreshPrice")}
                    variant="light"
                    onPress={handleRefreshPrice}
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </Button>
                )}
            </div>
            <div className="md:col-span-2">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currency.cur_status)}
                onValueChange={(val) =>
                  setCurrency({ ...currency, cur_status: val })
                }
              >
                {t("labels.statusEnabled")}
              </Checkbox>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyFormClient;
