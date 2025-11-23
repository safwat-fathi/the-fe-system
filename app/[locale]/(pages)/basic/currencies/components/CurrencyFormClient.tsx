"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem, Checkbox } from "@heroui/react";
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

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
  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const [currency, setCurrency] = useState<Partial<Currency>>(initialCurrency);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>("");

  const handleSave = async () => {
    if (!currency.cur_name || currency.cur_name.trim() === "") {
      toast.error("⚠️ اسم العملة مطلوب");
      return;
    }

    if (!currency.cur_price || currency.cur_price.trim() === "") {
      toast.error("⚠️ السعر مطلوب");
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
            ? "✅ تم إضافة العملة بنجاح"
            : "✅ تم تعديل العملة بنجاح",
        );
        router.push("/basic/currencies");
        router.refresh();
      } else {
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      toast.error("❌ حدث خطأ أثناء الحفظ، يرجى المحاولة لاحقًا");
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
              `تم تحميل معلومات ${currencyInfo.nameAr} مع سعر الصرف تلقائياً`,
              { duration: 3000 },
            );
          } else {
            toast.success(
              `تم تحميل معلومات ${currencyInfo.nameAr} تلقائياً`,
            );
            toast("⚠️ لم يتم جلب سعر الصرف. يرجى إدخال السعر يدوياً", {
              icon: "ℹ️",
              duration: 4000,
            });
          }
        } catch (error) {
          toast.success(`تم تحميل معلومات ${currencyInfo.nameAr} تلقائياً`);
          toast("⚠️ لم يتم جلب سعر الصرف. يرجى إدخال السعر يدوياً", {
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
        toast.success(`تم تحميل معلومات ${currencyInfo.nameAr} تلقائياً`);
      }
    }
  };

  const handleRefreshPrice = async () => {
    const currencyCode =
      selectedCurrencyCode ||
      getCurrencyOptions().find(
        (opt) =>
          opt.value.charAt(0).toUpperCase() ===
          currency.cur_tag?.toUpperCase(),
      )?.value;

    if (!currencyCode) {
      toast.error("⚠️ لا يمكن تحديث السعر بدون تحديد العملة");
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
        toast.success("✅ تم تحديث سعر الصرف بنجاح", { duration: 3000 });
      } else {
        toast.error("⚠️ لم يتم جلب سعر الصرف");
      }
    } catch (error) {
      toast.error("⚠️ حدث خطأ أثناء جلب سعر الصرف");
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const getTitle = () => {
    if (isViewMode) return `عرض ${currency.cur_name || "العملة"}`;
    if (isAddMode) return "إضافة عملة جديدة";
    return `تعديل ${currency.cur_name || "العملة"}`;
  };

  const getDescription = () => {
    if (isViewMode) return "عرض تفاصيل العملة";
    if (isAddMode) return "قم بإضافة عملة جديدة إلى النظام";
    return "قم بتعديل بيانات العملة";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
          <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="light"
            onPress={() => router.push("/basic/currencies")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            رجوع
          </Button>
          {isViewMode && (
            <Button color="primary" onPress={handleEdit}>
              تعديل
            </Button>
          )}
          {!isViewMode && (
            <>
              <Button
                variant="light"
                onPress={() => router.push("/basic/currencies")}
              >
                إلغاء
              </Button>
              <Button
                color="success"
                isLoading={isSaving}
                onPress={handleSave}
              >
                {isAddMode ? "حفظ" : "تحديث"}
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
              label="اختر العملة"
              placeholder="ابحث واختر عملة من القائمة العالمية"
              selectedKeys={
                currency.cur_tag ? [currency.cur_tag] : []
              }
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
            <p className="text-sm text-gray-500 mt-1">
              اختر عملة من القائمة لتعبئة الحقول تلقائياً
            </p>
          </div>
        )}

        {/* تفاصيل العملة */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            تفاصيل العملة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              isDisabled={isViewMode}
              label="اسم العملة"
              value={currency.cur_name || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_name: e.target.value })
              }
              isRequired
            />
            <Input
              isDisabled={isViewMode}
              label="اسم العملة بالإنجليزي"
              value={currency.cur_name_e || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_name_e: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="جزء العملة"
              value={currency.cur_part || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_part: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="جزء العملة بالإنجليزي"
              value={currency.cur_part_e || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_part_e: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="رمز العملة"
              value={currency.cur_sign || ""}
              onChange={(e) =>
                setCurrency({ ...currency, cur_sign: e.target.value })
              }
            />
            <div>
              <Input
                description="الوسم يجب أن يكون حرف واحد فقط (سيتم أخذ أول حرف تلقائياً)"
                isDisabled={isViewMode}
                label="الوسم (حرف واحد فقط)"
                maxLength={1}
                placeholder="مثال: U, E, S"
                value={currency.cur_tag || ""}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 1).toUpperCase();
                  setCurrency({ ...currency, cur_tag: value });
                }}
              />
            </div>
            <div className="flex items-end gap-2">
              <Input
                className="flex-1"
                description={
                  isLoadingPrice
                    ? "جاري جلب سعر الصرف..."
                    : "سعر الصرف مقابل الريال السعودي"
                }
                isDisabled={isViewMode || isLoadingPrice}
                label="السعر (مقابل الريال السعودي)"
                value={currency.cur_price || ""}
                onChange={(e) =>
                  setCurrency({ ...currency, cur_price: e.target.value })
                }
                isRequired
              />
              {isAddMode &&
                (selectedCurrencyCode || currency.cur_tag) &&
                !isViewMode && (
                  <Button
                    isIconOnly
                    className="h-[56px] min-w-[40px] bg-transparent hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded-lg transition-colors"
                    isLoading={isLoadingPrice}
                    size="md"
                    title="تحديث سعر الصرف من الإنترنت"
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
                الحالة مفعلة
              </Checkbox>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyFormClient;

