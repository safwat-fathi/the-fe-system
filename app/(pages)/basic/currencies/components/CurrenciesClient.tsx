"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Checkbox,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import currencyService from "@/services/api/currency.service";
import { revalidateTableData } from "@/app/actions/revalidate.action";
import { getCurrencyOptions, findCurrencyByCode } from "@/utilities/currencies";
import currencyExchangeService from "@/services/external/currency-exchange.service";

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

const columns = [
  { name: "الاسم", uid: "cur_name" },
  { name: "الاسم بالإنجليزي", uid: "cur_name_e" },
  { name: "جزء العملة", uid: "cur_part" },
  { name: "جزء العملة بالإنجليزي", uid: "cur_part_e" },
  { name: "الرمز", uid: "cur_sign" },
  { name: "السعر", uid: "cur_price" },
  { name: "الوسم", uid: "cur_tag" },
  { name: "الحالة", uid: "cur_status" },
  { name: "", uid: "actions" },
];

interface CurrenciesClientProps {
  initialData: Currency[];
  error?: string | null;
}

export default function CurrenciesClient({
  initialData,
  error,
}: CurrenciesClientProps) {
  const [currencies, setCurrencies] = useState<Currency[]>(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentCurrency, setCurrentCurrency] = useState<Partial<Currency>>({});
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(""); // حفظ كود العملة المختارة

  const rowsPerPage = 12;

  // تحديث البيانات عند تغيير initialData
  useEffect(() => {
    setCurrencies(initialData);
  }, [initialData]);

  const loadCurrencies = useCallback(async () => {
    try {
      const data = await currencyService.getAllCurrencies();

      setCurrencies(data);
    } catch (error) {
      toast.error("فشل في جلب العملات");
      setCurrencies([]);
    }
  }, []);

  // إعادة تحميل البيانات عند العودة للصفحة
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCurrencies();
      }
    };

    const handleFocus = () => {
      loadCurrencies();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadCurrencies]);

  const handleSave = async () => {
    // التحقق من الحقول المطلوبة
    if (!currentCurrency.cur_name || currentCurrency.cur_name.trim() === "") {
      toast.error("⚠️ اسم العملة مطلوب");

      return;
    }

    if (!currentCurrency.cur_price || currentCurrency.cur_price.trim() === "") {
      toast.error("⚠️ السعر مطلوب");

      return;
    }

    const previousCurrencies = [...currencies];

    try {
      let result: Currency | null = null;

      // Optimistic update for create
      if (modalMode === "add") {
        const optimisticId = Date.now();
        const optimisticCurrency = {
          ...currentCurrency,
          id: optimisticId,
          cr_date: new Date().toISOString(),
          cur_status: true,
        } as Currency;

        setCurrencies([...currencies, optimisticCurrency]);
      }

      if (modalMode === "edit" && currentCurrency.id) {
        result = await currencyService.updateCurrency(
          currentCurrency.id,
          currentCurrency,
        );
      } else {
        result = await currencyService.createCurrency(
          currentCurrency as Omit<Currency, "id">,
        );
      }

      if (result) {
        toast.success(
          modalMode === "edit"
            ? "✅ تم تعديل العملة بنجاح"
            : "✅ تم إضافة العملة بنجاح",
        );

        // Revalidate cache
        await revalidateTableData("currencies_list");

        setIsModalOpen(false);
        loadCurrencies();
      } else {
        // Rollback on failure
        setCurrencies(previousCurrencies);
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      // Rollback on error
      setCurrencies(previousCurrencies);
      toast.error("❌ حدث خطأ أثناء الحفظ، يرجى المحاولة لاحقًا");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذه العملة؟")) return;

    // Optimistic delete
    const previousCurrencies = [...currencies];

    setCurrencies(currencies.filter((cur) => cur.id !== id));

    try {
      const result = await currencyService.deleteCurrency(id);

      if (result) {
        toast.success("✅ تم حذف العملة بنجاح");

        // Revalidate cache
        await revalidateTableData("currencies_list");

        loadCurrencies();
      } else {
        // Rollback on failure
        setCurrencies(previousCurrencies);
        toast.error("❌ فشل في حذف العملة");
      }
    } catch (error) {
      // Rollback on error
      setCurrencies(previousCurrencies);
      toast.error("❌ حدث خطأ أثناء الحذف");
    }
  };

  const renderActions = (cur: Currency) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("view", cur)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("edit", cur)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        variant="light"
        onPress={() => handleDelete(cur.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  const filtered = useMemo(
    () =>
      currencies.filter((c) =>
        c.cur_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [currencies, search],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  const openModal = (
    mode: "add" | "edit" | "view",
    currency: Partial<Currency> = {},
  ) => {
    setModalMode(mode);
    setCurrentCurrency(currency);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  return (
    <>
      <div className="flex justify-between mb-4">
        <Button className="btn-primary" onPress={() => openModal("add")}>
          <PlusIcon className="h-4 w-4" /> إضافة عملة
        </Button>
        <Input
          className="w-60"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table aria-label="جدول العملات">
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {paginated.map((cur) => (
            <TableRow key={cur.id}>
              <TableCell>{cur.cur_name}</TableCell>
              <TableCell>{cur.cur_name_e}</TableCell>
              <TableCell>{cur.cur_part}</TableCell>
              <TableCell>{cur.cur_part_e}</TableCell>
              <TableCell>{cur.cur_sign}</TableCell>
              <TableCell>{cur.cur_price}</TableCell>
              <TableCell>{cur.cur_tag}</TableCell>
              <TableCell>
                <Checkbox isReadOnly isSelected={cur.cur_status} />
              </TableCell>
              <TableCell>{renderActions(cur)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center py-4">
        <span>عدد العملات: {filtered.length}</span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filtered.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>

      <Modal
        isDismissable={false}
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة عملة"}
            {modalMode === "edit" && "تعديل عملة"}
            {modalMode === "view" && "عرض بيانات العملة"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* اختيار العملة من القائمة العالمية - فقط في وضع الإضافة */}
            {modalMode === "add" && (
              <div className="col-span-2">
                <Select
                  label="اختر العملة"
                  placeholder="ابحث واختر عملة من القائمة العالمية"
                  selectedKeys={
                    currentCurrency.cur_tag ? [currentCurrency.cur_tag] : []
                  }
                  variant="bordered"
                  onSelectionChange={async (keys) => {
                    const selectedCode = Array.from(keys)[0] as string;

                    if (selectedCode) {
                      const currencyInfo = findCurrencyByCode(selectedCode);

                      if (currencyInfo) {
                        // حفظ كود العملة المختارة لاستخدامه لاحقاً
                        setSelectedCurrencyCode(currencyInfo.code);

                        // استخدام أول حرف من كود ISO للوسم (حرف واحد فقط)
                        const tagChar = currencyInfo.code
                          .charAt(0)
                          .toUpperCase();

                        // جلب المعلومات الأساسية أولاً
                        setCurrentCurrency({
                          ...currentCurrency,
                          cur_tag: tagChar,
                          cur_name: currencyInfo.nameAr,
                          cur_name_e: currencyInfo.nameEn,
                          cur_part: currencyInfo.fractionalUnit,
                          cur_part_e: currencyInfo.fractionalUnitEn,
                          cur_sign: currencyInfo.symbol,
                        });

                        // جلب سعر الصرف تلقائياً (باستثناء الريال السعودي)
                        if (selectedCode.toUpperCase() !== "SAR") {
                          setIsLoadingPrice(true);
                          try {
                            const exchangeRate =
                              await currencyExchangeService.getExchangeRateToSAR(
                                selectedCode,
                              );

                            if (exchangeRate && exchangeRate > 0) {
                              setCurrentCurrency((prev) => ({
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
                              toast(
                                "⚠️ لم يتم جلب سعر الصرف. يرجى إدخال السعر يدوياً",
                                { icon: "ℹ️", duration: 4000 },
                              );
                            }
                          } catch (error) {
                            toast.success(
                              `تم تحميل معلومات ${currencyInfo.nameAr} تلقائياً`,
                            );
                            toast(
                              "⚠️ لم يتم جلب سعر الصرف. يرجى إدخال السعر يدوياً",
                              { icon: "ℹ️", duration: 4000 },
                            );
                          } finally {
                            setIsLoadingPrice(false);
                          }
                        } else {
                          // إذا كانت العملة هي الريال السعودي، السعر = 1
                          setCurrentCurrency((prev) => ({
                            ...prev,
                            cur_price: "1",
                          }));
                          toast.success(
                            `تم تحميل معلومات ${currencyInfo.nameAr} تلقائياً`,
                          );
                        }
                      }
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

            {/* قسم تفاصيل العملة */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                تفاصيل العملة
              </h3>
            </div>

            <Input
              required
              isDisabled={isViewMode}
              label="اسم العملة"
              value={currentCurrency.cur_name || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_name: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="اسم العملة بالإنجليزي"
              value={currentCurrency.cur_name_e || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_name_e: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="جزء العملة"
              value={currentCurrency.cur_part || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_part: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="جزء العملة بالإنجليزي"
              value={currentCurrency.cur_part_e || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_part_e: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="رمز العملة"
              value={currentCurrency.cur_sign || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_sign: e.target.value,
                })
              }
            />
            <Input
              description="الوسم يجب أن يكون حرف واحد فقط (سيتم أخذ أول حرف تلقائياً)"
              isDisabled={isViewMode}
              label="الوسم (حرف واحد فقط)"
              maxLength={1}
              placeholder="مثال: U, E, S"
              value={currentCurrency.cur_tag || ""}
              onChange={(e) => {
                const value = e.target.value.slice(0, 1).toUpperCase();

                setCurrentCurrency({
                  ...currentCurrency,
                  cur_tag: value,
                });
              }}
            />
            <div className="flex items-end gap-2">
              <Input
                required
                className="flex-1"
                description={
                  isLoadingPrice
                    ? "جاري جلب سعر الصرف..."
                    : "سعر الصرف مقابل الريال السعودي"
                }
                isDisabled={isViewMode || isLoadingPrice}
                label="السعر (مقابل الريال السعودي)"
                value={currentCurrency.cur_price || ""}
                onChange={(e) =>
                  setCurrentCurrency({
                    ...currentCurrency,
                    cur_price: e.target.value,
                  })
                }
              />
              {modalMode === "add" &&
                (selectedCurrencyCode || currentCurrency.cur_tag) && (
                  <Button
                    isIconOnly
                    className="h-[56px] min-w-[40px] bg-transparent hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded-lg transition-colors"
                    isLoading={isLoadingPrice}
                    size="md"
                    title="تحديث سعر الصرف من الإنترنت"
                    variant="light"
                    onPress={async () => {
                      // استخدام الكود المحفوظ أو البحث عن العملة
                      const currencyCode =
                        selectedCurrencyCode ||
                        getCurrencyOptions().find(
                          (opt) =>
                            opt.value.charAt(0).toUpperCase() ===
                            currentCurrency.cur_tag?.toUpperCase(),
                        )?.value;

                      if (
                        currencyCode &&
                        currencyCode.toUpperCase() !== "SAR"
                      ) {
                        setIsLoadingPrice(true);
                        try {
                          const rate =
                            await currencyExchangeService.getExchangeRateToSAR(
                              currencyCode,
                            );

                          if (rate && rate > 0) {
                            setCurrentCurrency((prev) => ({
                              ...prev,
                              cur_price: rate.toFixed(2),
                            }));
                            toast.success("✅ تم تحديث سعر الصرف");
                          } else {
                            toast.error("❌ لم يتم جلب سعر الصرف");
                          }
                        } catch (error) {
                          toast.error("❌ خطأ في جلب سعر الصرف");
                        } finally {
                          setIsLoadingPrice(false);
                        }
                      } else if (currencyCode?.toUpperCase() === "SAR") {
                        setCurrentCurrency((prev) => ({
                          ...prev,
                          cur_price: "1",
                        }));
                        toast.success("✅ السعر محدث (الريال السعودي = 1)");
                      }
                    }}
                  >
                    <ArrowPathIcon
                      className={`w-4 h-4 text-gray-600 ${
                        isLoadingPrice ? "animate-spin text-blue-600" : ""
                      }`}
                    />
                  </Button>
                )}
            </div>
            <Input
              isDisabled={isViewMode}
              label="الوسم"
              value={currentCurrency.cur_tag || ""}
              onChange={(e) =>
                setCurrentCurrency({
                  ...currentCurrency,
                  cur_tag: e.target.value,
                })
              }
            />
            <Input
              isDisabled={true}
              label="تاريخ الإنشاء"
              value={currentCurrency.cr_date || ""}
            />
            <div className="col-span-2">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentCurrency.cur_status)}
                onValueChange={(val) =>
                  setCurrentCurrency({ ...currentCurrency, cur_status: val })
                }
              >
                الحالة مفعلة
              </Checkbox>
            </div>
          </ModalBody>

          {modalMode !== "view" && (
            <ModalFooter className="flex justify-end gap-2">
              <Button color="danger" onPress={() => setIsModalOpen(false)}>
                إلغاء
              </Button>
              <Button color="success" onPress={handleSave}>
                {modalMode === "edit" ? "تحديث" : "حفظ"}
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
