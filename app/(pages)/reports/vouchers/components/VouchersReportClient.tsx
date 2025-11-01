"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Select,
  SelectItem,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from "@heroui/react";
import { CardBody } from "@heroui/react";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

import Card from "@/components/Card";
import { PrintButton } from "@/components";
import { Voucher } from "@/types/voucher";
import { deleteVoucherAction } from "@/app/actions/voucher.action";
import { formatAmount } from "@/utilities/formatAmount";
import { useQueryParams } from "@/utilities/hooks/useQueryParams";
import { IParams } from "@/types/services/base";
import { voucherService } from "@/services/api";

// VouchersTable Component
interface VouchersTableProps {
  vouchers: Voucher[];
  onView: (voucher: Voucher) => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  onPrint?: (voucher: Voucher) => void;
  getVoucherTypeName: (typeId: number) => string;
  getStatusChip: (status?: number) => React.ReactNode;
  calculateVoucherCashTotal: (voucher: Voucher) => number;
  calculateVoucherGoldTotal: (voucher: Voucher) => number;
  formatDate: (dateString: string) => string;
}

function VouchersTable({
  vouchers,
  onView,
  onEdit,
  onDelete,
  onPrint,
  getVoucherTypeName,
  getStatusChip,
  calculateVoucherCashTotal,
  calculateVoucherGoldTotal,
  formatDate,
}: VouchersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>رقم السند</TableColumn>
        <TableColumn>التاريخ</TableColumn>
        <TableColumn>نوع السند</TableColumn>
        <TableColumn>المبلغ (نقدي)</TableColumn>
        <TableColumn>الجرام (ذهب)</TableColumn>
        <TableColumn>البيان</TableColumn>
        <TableColumn>الحالة</TableColumn>
        <TableColumn>إجراءات</TableColumn>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher, index) => (
          <TableRow
            key={
              voucher.id ||
              `voucher-${voucher.vouch_id}-${voucher.vouch_type}-${index}`
            }
          >
            <TableCell>
              <span className="font-semibold">{voucher.vouch_id}</span>
            </TableCell>
            <TableCell>{formatDate(voucher.vouch_date)}</TableCell>
            <TableCell>
              <Chip color="primary" size="sm">
                {getVoucherTypeName(voucher.vouch_type || 0)}
              </Chip>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-green-600">
                {formatAmount(calculateVoucherCashTotal(voucher))}
              </span>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-yellow-600 flex items-center gap-1">
                {formatAmount(calculateVoucherGoldTotal(voucher))}
                <span className="text-xs text-yellow-500">جم</span>
              </span>
            </TableCell>
            <TableCell>
              <span className="truncate max-w-xs block">
                {voucher.vouch_notes || "-"}
              </span>
            </TableCell>
            <TableCell>{getStatusChip(voucher.vouch_status)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Tooltip content="عرض">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onView(voucher)}
                  >
                    <EyeIcon className="h-4 w-4 text-blue-500" />
                  </Button>
                </Tooltip>
                <Tooltip content="تعديل">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onEdit(voucher)}
                  >
                    <PencilIcon className="h-4 w-4 text-yellow-500" />
                  </Button>
                </Tooltip>
                {onPrint && (
                  <Tooltip content="طباعة">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onPrint(voucher)}
                    >
                      <PrinterIcon className="h-4 w-4 text-gray-600" />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="حذف">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => onDelete(voucher)}
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface VoucherType {
  id: number;
  type_name: string;
  type_name_e: string;
  type_desc?: string;
}

interface VouchersReportClientProps {
  initialVouchers: Voucher[];
  initialVoucherTypes: VoucherType[];
  searchParams: IParams;
  totalVouchers: number;
  totalPages: number;
}

const VouchersReportClient = ({
  initialVouchers,
  initialVoucherTypes,
  searchParams,
  totalVouchers,
  totalPages,
}: VouchersReportClientProps) => {
  const router = useRouter();

  // Query parameters management
  const { params, setParams } = useQueryParams<{
    xvouch_type: string;
    xvouch_id: string;
    xfrom_date: string;
    xto_date: string;
    page: string;
  }>(["xvouch_type", "xvouch_id", "xfrom_date", "xto_date", "page"], {
    defaultValues: {
      xvouch_type: searchParams.xvouch_type || "0",
      xvouch_id: searchParams.xvouch_id || "0",
      xfrom_date: searchParams.xfrom_date || "0",
      xto_date: searchParams.xto_date || "0",
      page: searchParams.page || "1",
    },
    schema: {
      xvouch_type: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "0",
      },
      xvouch_id: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "0",
      },
      xfrom_date: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "0",
      },
      xto_date: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "0",
      },
      page: {
        parse: (value) => value,
        serialize: (value) => value,
        default: "1",
      },
    },
    pushMode: "replace",
    refreshOnChange: true,
    debounce: 350,
  });

  // State
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [voucherTypes, setVoucherTypes] =
    useState<VoucherType[]>(initialVoucherTypes);
  const [searchQ, setSearchQ] = useState(params.xvouch_id || "");
  const [activeTab, setActiveTab] = useState("all");
  const [, startTransition] = useTransition();

  // Clear filters function
  const clearFilters = () => {
    setSearchQ("");
    startTransition(() =>
      setParams({
        xvouch_type: "0",
        xvouch_id: "0",
        xfrom_date: "0",
        xto_date: "0",
        page: "1",
      }),
    );
  };

  // خريطة ثابتة لأنواع السندات (القيم الثابتة في النظام)
  const VOUCHER_TYPE_NAMES: Record<number, string> = {
    0: "قيد افتتاحي",
    1: "سند قبض",
    2: "سند صرف",
    3: "قيد تسوية",
    4: "سند قبض عميل",
    5: "سند صرف عميل",
  };

  // Get voucher type name
  const getVoucherTypeName = (typeId: number) => {
    const type = voucherTypes.find((t) => t.id === typeId);

    // تشخيص البيانات
    if (typeId && !type) {
      console.log(`❌ لم يتم العثور على نوع السند ${typeId} في:`, voucherTypes);
    }

    // محاولة العثور على الاسم في حقول مختلفة
    const typeName = type?.type_name || type?.type_name_e;

    // استخدام الاسم من API أو الخريطة الثابتة
    return typeName || VOUCHER_TYPE_NAMES[typeId] || `نوع ${typeId}`;
  };

  // Format date to dd/mm/yyyy
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString; // fallback to original string if parsing fails
    }
  };

  // Get vouchers by type (filtered on client side for tabs)
  const getVouchersByType = (typeId: number) => {
    return vouchers.filter((v) => v.vouch_type === typeId);
  };

  // Get vouchers for specific types (vouch_type values)
  const openingVouchers = getVouchersByType(0); // القيد الافتتاحي
  const receiptVouchers = getVouchersByType(1); // سند قبض
  const paymentVouchers = getVouchersByType(2); // سند صرف
  const customerReceiptVouchers = getVouchersByType(4); // سند قبض عميل
  const customerPaymentVouchers = getVouchersByType(5); // سند صرف عميل
  const adjustmentVouchers = getVouchersByType(3); // قيد تسوية

  // Get voucher status chip
  const getStatusChip = (status?: number) => {
    switch (status) {
      case 1:
        return (
          <Chip color="success" size="sm">
            مفتوح
          </Chip>
        );
      case 2:
        return (
          <Chip color="warning" size="sm">
            مغلق
          </Chip>
        );
      default:
        return (
          <Chip color="default" size="sm">
            غير محدد
          </Chip>
        );
    }
  };

  // Handle actions - تحديد المسار بناءً على نوع السند
  const handleView = (voucher: Voucher) => {
    const voucherId = voucher.id || voucher.vouch_id;
    const vouchType = voucher.vouch_type;

    // تحديد المسار بناءً على نوع السند
    if (vouchType === 0) {
      // القيد الافتتاحي
      router.push(`/forms/balance/${voucherId}?mode=preview`);
    } else if (vouchType === 1) {
      // سند قبض
      router.push(`/forms/voucher1/${voucherId}?mode=preview`);
    } else if (vouchType === 2) {
      // سند صرف
      router.push(`/forms/voucher2/${voucherId}?mode=preview`);
    } else if (vouchType === 4) {
      // سند قبض عميل
      router.push(`/forms/gvoucher4/${voucherId}?mode=preview`);
    } else if (vouchType === 5) {
      // سند صرف عميل
      router.push(`/forms/gvoucher5/${voucherId}?mode=preview`);
    } else {
      // قيد تسوية (vouch_type = 3) أو أنواع أخرى
      router.push(`/forms/voucher/${voucherId}?mode=preview`);
    }
  };

  const handleEdit = (voucher: Voucher) => {
    const voucherId = voucher.id || voucher.vouch_id;
    const vouchType = voucher.vouch_type;

    // تحديد المسار بناءً على نوع السند
    if (vouchType === 0) {
      // القيد الافتتاحي
      router.push(`/forms/balance/${voucherId}?mode=edit`);
    } else if (vouchType === 1) {
      // سند قبض
      router.push(`/forms/voucher1/${voucherId}?mode=edit`);
    } else if (vouchType === 2) {
      // سند صرف
      router.push(`/forms/voucher2/${voucherId}?mode=edit`);
    } else if (vouchType === 4) {
      // سند قبض عميل
      router.push(`/forms/gvoucher4/${voucherId}?mode=edit`);
    } else if (vouchType === 5) {
      // سند صرف عميل
      router.push(`/forms/gvoucher5/${voucherId}?mode=edit`);
    } else {
      // قيد تسوية (vouch_type = 3) أو أنواع أخرى
      router.push(`/forms/voucher/${voucherId}?mode=edit`);
    }
  };

  const handlePrint = (voucher: Voucher) => {
    const voucherId = voucher.id || voucher.vouch_id;
    const vouchType = voucher.vouch_type;

    // تحديد المسار بناءً على نوع السند
    let printUrl = "";

    if (vouchType === 0) {
      // القيد الافتتاحي
      printUrl = `/forms/balance/${voucherId}?mode=preview`;
    } else if (vouchType === 1) {
      // سند قبض
      printUrl = `/forms/voucher1/${voucherId}?mode=preview`;
    } else if (vouchType === 2) {
      // سند صرف
      printUrl = `/forms/voucher2/${voucherId}?mode=preview`;
    } else if (vouchType === 4) {
      // سند قبض عميل
      printUrl = `/forms/gvoucher4/${voucherId}?mode=preview`;
    } else if (vouchType === 5) {
      // سند صرف عميل
      printUrl = `/forms/gvoucher5/${voucherId}?mode=preview`;
    } else {
      // قيد تسوية (vouch_type = 3) أو أنواع أخرى
      printUrl = `/forms/voucher/${voucherId}?mode=preview`;
    }

    // فتح صفحة القيد في نافذة جديدة للطباعة
    const printWindow = window.open(printUrl, "_blank");

    // بعد تحميل الصفحة، استدعاء الطباعة
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      });
    }
  };

  const handleDelete = async (voucher: Voucher) => {
    if (confirm("هل أنت متأكد من حذف هذا السند؟")) {
      try {
        if (!voucher.vouch_id) return;

        const result = await deleteVoucherAction(voucher.vouch_id);

        if (result.success) {
          alert(result.message);
          // إعادة تحميل الصفحة لتحديث البيانات
          router.refresh();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error deleting voucher:", error);
        alert("حدث خطأ أثناء حذف السند");
      }
    }
  };

  const handleNewVoucher = () => {
    router.push("/forms/voucher");
  };

  // Calculate totals - استخدام useMemo لتحسين الأداء
  const totals = useMemo(() => {
    return vouchers.reduce(
      (acc, voucher) => {
        // استخدام vouch_amt مباشرة (أسرع بكثير)
        acc.totalAmount += parseFloat(String(voucher.vouch_amt || 0));
        acc.totalCount += 1;

        return acc;
      },
      { totalAmount: 0, totalCount: 0 },
    );
  }, [vouchers]);

  // State for storing voucher details
  const [voucherDetails, setVoucherDetails] = useState<Record<number, any[]>>(
    {},
  );

  // Fetch details for a specific voucher
  const fetchVoucherDetails = async (voucherId: number) => {
    if (voucherDetails[voucherId]) {
      return voucherDetails[voucherId];
    }

    try {
      const response = await voucherService.getDetails(voucherId);

      if (response.success && response.data) {
        const details = Array.isArray(response.data) ? response.data : [];

        setVoucherDetails((prev) => ({ ...prev, [voucherId]: details }));

        return details;
      }
    } catch (error) {
      console.error("Error fetching voucher details:", error);
    }

    return [];
  };

  // Calculate cash totals for each voucher - محسن للأداء
  const calculateVoucherCashTotal = (voucher: Voucher) => {
    // أولاً: استخدام vouch_amt مباشرة إذا كان متوفراً (أسرع)
    if (
      voucher.vouch_amt !== undefined &&
      voucher.vouch_amt !== null &&
      voucher.vouch_amt > 0
    ) {
      return parseFloat(String(voucher.vouch_amt)) || 0;
    }

    // ثانياً: استخدام التفاصيل المحملة إذا كانت متوفرة
    const voucherId = voucher.id || voucher.vouch_id;
    const details = voucherDetails[voucherId] || [];

    if (details.length > 0) {
      return details.reduce((total: number, detail: any) => {
        const debit = parseFloat(detail.debit) || 0;
        const credit = parseFloat(detail.credit) || 0;

        return total + debit + credit;
      }, 0);
    }

    return 0;
  };

  // Calculate gold totals for each voucher - محسن للأداء
  const calculateVoucherGoldTotal = (voucher: Voucher) => {
    // أولاً: استخدام bag_wt مباشرة إذا كان متوفراً (أسرع)
    if (
      voucher.bag_wt !== undefined &&
      voucher.bag_wt !== null &&
      voucher.bag_wt > 0
    ) {
      return parseFloat(String(voucher.bag_wt)) || 0;
    }

    // ثانياً: استخدام التفاصيل المحملة إذا كانت متوفرة
    const voucherId = voucher.id || voucher.vouch_id;
    const details = voucherDetails[voucherId] || [];

    if (details.length > 0) {
      return details.reduce((total: number, detail: any) => {
        const debitG = parseFloat(detail.debit_g) || 0;
        const creditG = parseFloat(detail.credit_g) || 0;

        return total + debitG + creditG;
      }, 0);
    }

    return 0;
  };

  // Calculate total cash amount for all vouchers - استخدام useMemo مع voucherDetails
  const calculateTotalCash = useMemo(() => {
    return vouchers.reduce((total, voucher) => {
      return total + calculateVoucherCashTotal(voucher);
    }, 0);
  }, [vouchers, voucherDetails]);

  // Calculate total gold amount for all vouchers - استخدام useMemo مع voucherDetails
  const calculateTotalGold = useMemo(() => {
    return vouchers.reduce((total, voucher) => {
      return total + calculateVoucherGoldTotal(voucher);
    }, 0);
  }, [vouchers, voucherDetails]);

  // جلب تفاصيل السندات بشكل متوازي لتحسين الأداء
  useEffect(() => {
    const fetchAllVoucherDetails = async () => {
      // فلترة السندات التي تحتاج لجلب التفاصيل
      // نجلب التفاصيل لجميع السندات التي لم تكن محملة مسبقاً
      const vouchersToFetch = vouchers.filter((voucher) => {
        const voucherId = voucher.id || voucher.vouch_id;

        if (!voucherId) return false;

        // إذا كانت التفاصيل محملة مسبقاً، لا نحتاج لجلبها
        if (
          voucherDetails[voucherId] &&
          Array.isArray(voucherDetails[voucherId])
        ) {
          return false;
        }

        // نجلب التفاصيل لجميع السندات (سنستخدمها في الحسابات)
        return true;
      });

      if (vouchersToFetch.length === 0) {
        return;
      }

      console.log(`📥 جلب تفاصيل ${vouchersToFetch.length} سند بشكل متوازي...`);

      // جلب جميع التفاصيل بشكل متوازي (أسرع بكثير من المتسلسل)
      try {
        const detailsPromises = vouchersToFetch.map(async (voucher) => {
          const voucherId = voucher.id || voucher.vouch_id;

          if (!voucherId) return null;

          const branchId = Number(voucher.com_id ?? voucher.com ?? 1) || 1;
          const response = await voucherService.getDetails(voucherId, {
            xcom_id: branchId,
          });

          if (response.success && response.data) {
            const details = Array.isArray(response.data) ? response.data : [];

            return { voucherId, details };
          }

          return { voucherId, details: [] };
        });

        const results = await Promise.all(detailsPromises);

        // تحديث state بجميع التفاصيل مرة واحدة
        setVoucherDetails((prev) => {
          const updated = { ...prev };
          let newDetailsCount = 0;

          results.forEach((result) => {
            if (result && result.voucherId && result.details.length > 0) {
              updated[result.voucherId] = result.details;
              newDetailsCount++;
            }
          });
          console.log(`✅ تم تحميل تفاصيل ${newDetailsCount} سند`);

          return updated;
        });
      } catch (error) {
        console.error("Error fetching voucher details:", error);
      }
    };

    if (vouchers.length > 0) {
      fetchAllVoucherDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vouchers]);

  return (
    <div className="font-cairo p-1 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold mt-2">تقرير السندات</h1>
          <div className="flex gap-3">
            <PrintButton />
            <Button
              color="primary"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={handleNewVoucher}
            >
              سند جديد
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardBody className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
              <Input
                placeholder="البحث بالرقم أو البيان..."
                startContent={
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                }
                value={searchQ}
                onChange={(e) => {
                  const value = e.target.value;

                  setSearchQ(value);
                  if (value === params.xvouch_id) return;
                  startTransition(() =>
                    setParams({ xvouch_id: value, page: "1" }),
                  );
                }}
              />
              <Select
                placeholder="نوع السند"
                selectedKeys={[params.xvouch_type || "0"]}
                onSelectionChange={(keys) =>
                  startTransition(() =>
                    setParams({
                      xvouch_type: Array.from(keys)[0] as string,
                      page: "1",
                    }),
                  )
                }
              >
                {[
                  <SelectItem key="0">جميع الأنواع</SelectItem>,
                  ...voucherTypes.map((type, idx) => (
                    <SelectItem key={type.id || `type-${idx}`}>
                      {type.type_name}
                    </SelectItem>
                  )),
                ]}
              </Select>
              <Input
                placeholder="من تاريخ"
                type="date"
                value={params.xfrom_date === "0" ? "" : params.xfrom_date}
                onChange={(e) =>
                  startTransition(() =>
                    setParams({ xfrom_date: e.target.value || "0", page: "1" }),
                  )
                }
              />
              <Input
                placeholder="إلى تاريخ"
                type="date"
                value={params.xto_date === "0" ? "" : params.xto_date}
                onChange={(e) =>
                  startTransition(() =>
                    setParams({ xto_date: e.target.value || "0", page: "1" }),
                  )
                }
              />
              <Button
                className="btn-secondary"
                variant="bordered"
                onPress={clearFilters}
              >
                مسح الفلاتر
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Vouchers Table with Tabs */}
      <Card>
        <CardBody className="p-2">
          <Tabs
            aria-label="أنواع السندات"
            color="primary"
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="all" title={`جميع السندات (${vouchers.length})`}>
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                formatDate={formatDate}
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={vouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="opening"
              title={`القيد الافتتاحي (${openingVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                formatDate={formatDate}
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={openingVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="receipt"
              title={`سندات القبض (${receiptVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                formatDate={formatDate}
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={receiptVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="payment"
              title={`سندات الصرف (${paymentVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                formatDate={formatDate}
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={paymentVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="customer-receipt"
              title={`سندات القبض (عملاء) (${customerReceiptVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                formatDate={formatDate}
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={customerReceiptVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="customer-payment"
              title={`سندات الصرف (عملاء) (${customerPaymentVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                formatDate={formatDate}
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={customerPaymentVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
            <Tab
              key="adjustment"
              title={`قيود التسوية (${adjustmentVouchers.length})`}
            >
              <VouchersTable
                calculateVoucherCashTotal={calculateVoucherCashTotal}
                calculateVoucherGoldTotal={calculateVoucherGoldTotal}
                formatDate={formatDate}
                getStatusChip={getStatusChip}
                getVoucherTypeName={getVoucherTypeName}
                vouchers={adjustmentVouchers}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onView={handleView}
              />
            </Tab>
          </Tabs>

          {/* Summary */}
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-600">
              إجمالي السندات: {totalVouchers} سند | إجمالي المبلغ:{" "}
              {formatAmount(calculateTotalCash)} | إجمالي الجرام:{" "}
              {formatAmount(calculateTotalGold)} جم
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-gray-600">
                الصفحة {params.page} من {totalPages}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default VouchersReportClient;
