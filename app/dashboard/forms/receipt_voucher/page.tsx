"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Tooltip,
  Chip,
  useDisclosure,
  Checkbox,
} from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import {
  FaSave,
  FaPrint,
  FaSearch,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCalculator,
  FaFolder,
  FaChevronLeft,
  FaChevronRight,
  FaStepForward,
  FaStepBackward,
  FaEye,
  FaCopy,
  FaCheck,
  FaTimes,
  FaMoneyBillWave,
  FaReceipt,
} from "react-icons/fa";
import { Voucher, VoucherDetail, VoucherBox } from "@/types/voucher";
import { API_ENDPOINTS, fetchData, apiFetch } from "@/utilities/api";
import { formatAmount } from "@/utilities/formatAmount";
import { getCurrDate } from "@/utilities/getCurrDate";
import { getNextReceiptVoucherNumber } from "@/utilities/numbering";
import useFractions from "@/utilities/useFractions";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function ReceiptVoucherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vouchId = searchParams.get("id");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // معالجة useFractions
  const fractions = useFractions();
  const frac = typeof fractions === "object" ? fractions.frac : 2;
  const frac2 = typeof fractions === "object" ? fractions.frac2 : 2;

  // State Management
  const [voucher, setVoucher] = useState<Voucher>({
    vouch_id: 0,
    vouch_date: new Date().toISOString(),
    vouch_type: 1, // سند قبض
    vouch_amt: 0,
    pay_type: 1,
    cr_date: new Date().toISOString(),
    vouch_status: 1,
  });

  const [currentTime, setCurrentTime] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [details, setDetails] = useState<VoucherDetail[]>([]);
  const [boxDetails, setBoxDetails] = useState<VoucherBox[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [voucherStatuses, setVoucherStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  // Initialize component
  useEffect(() => {
    setIsClient(true);
    updateCurrentTime();
    const timeInterval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadInitialData();
      loadVouchersList();
    }
  }, [isClient]);

  useEffect(() => {
    if (vouchId) {
      loadVoucher(parseInt(vouchId));
    } else {
      createNewVoucher();
    }
  }, [vouchId]);

  const updateCurrentTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleString('ar-SA'));
  };

  const loadInitialData = async () => {
    try {
      const [accountsData, boxesData, statusesData] = await Promise.all([
        fetchData(API_ENDPOINTS.ACCOUNTS_LIST),
        fetchData(API_ENDPOINTS.BOXES_LIST),
        fetchData(API_ENDPOINTS.VoucherStageList)
      ]);
      
      // Ensure we always set arrays, even if the API returns different data structures
      setAccounts(Array.isArray(accountsData) ? accountsData : ((accountsData as any)?.results || []));
      setBoxes(Array.isArray(boxesData) ? boxesData : ((boxesData as any)?.results || []));
      setVoucherStatuses(Array.isArray(statusesData) ? statusesData : ((statusesData as any)?.results || []));
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Set empty arrays on error to prevent map errors
      setAccounts([]);
      setBoxes([]);
      setVoucherStatuses([]);
    }
  };

  const loadVouchersList = async () => {
    try {
      const data = await fetchData(`${API_ENDPOINTS.VOUCHERS_LIST}?type=1`);
      setVouchersList(data as any[] || []);
      setTotalRecords((data as any[] || []).length);
    } catch (error) {
      console.error('Error loading vouchers list:', error);
    }
  };

  const getNextVoucherNumber = async () => {
    try {
      return await getNextReceiptVoucherNumber();
    } catch (error) {
      console.error('Error getting next voucher number:', error);
      return 1;
    }
  };

  const loadVoucher = async (id: number) => {
    try {
      setIsLoading(true);
      
      // جلب بيانات السند الأساسية
      const voucherData = await fetchData(`${API_ENDPOINTS.VOUCHERS_LIST}/${id}`);
      
      // جلب تفاصيل السند المحدد
      const detailsData = await fetchData(API_ENDPOINTS.VOUCHER_DETAILS(id));
      
      // جلب تفاصيل الصناديق للسند المحدد
      const boxDetailsData = await fetchData(API_ENDPOINTS.VOUCHER_BOX_DETAILS(id));
      
      setVoucher(voucherData as any);
      setDetails(Array.isArray(detailsData) ? detailsData : []);
      setBoxDetails(Array.isArray(boxDetailsData) ? boxDetailsData : []);
      setCurrentRecord((voucherData as any).vouch_id);
    } catch (error) {
      console.error('Error loading voucher:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToVoucher = (direction: 'first' | 'prev' | 'next' | 'last') => {
    const currentIndex = vouchersList.findIndex(v => v.vouch_id === currentRecord);
    let newIndex = 0;

    switch (direction) {
      case 'first':
        newIndex = 0;
        break;
      case 'prev':
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'next':
        newIndex = Math.min(vouchersList.length - 1, currentIndex + 1);
        break;
      case 'last':
        newIndex = vouchersList.length - 1;
        break;
    }

    if (newIndex >= 0 && newIndex < vouchersList.length) {
      const newVoucher = vouchersList[newIndex];
      router.push(`/dashboard/forms/receipt_voucher?id=${newVoucher.vouch_id}`);
    }
  };

  const addDetailRow = () => {
    const newDetail: VoucherDetail = {
      id: 0,
      vouch_id: voucher.vouch_id,
      acc_id: 0,
      debit: 0,
      credit: 0,
      vouch_notes: "",
      tax_prc: 0,
      tax: 0,
      cr_date: new Date().toISOString(),
    };
    setDetails([...details, newDetail]);
  };

  const removeDetailRow = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const updateDetail = (index: number, field: keyof VoucherDetail, value: any) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const addBoxDetailRow = () => {
    const newBoxDetail: VoucherBox = {
      id: 0,
      vouch_id: voucher.vouch_id,
      box_id: 0,
      amount: 0,
      tax_prc: 0,
      tax: 0,
      total_amount: 0,
      vouch_notes: "",
      cr_date: new Date().toISOString(),
    };
    setBoxDetails([...boxDetails, newBoxDetail]);
  };

  const removeBoxDetailRow = (index: number) => {
    setBoxDetails(boxDetails.filter((_, i) => i !== index));
  };

  const updateBoxDetail = (index: number, field: keyof VoucherBox, value: any) => {
    const newBoxDetails = [...boxDetails];
    newBoxDetails[index] = { ...newBoxDetails[index], [field]: value };
    setBoxDetails(newBoxDetails);
  };

  const saveVoucher = async () => {
    try {
      setIsLoading(true);
      
      // حفظ السند الأساسي
      const voucherData = {
        ...voucher,
        vouch_amt: totalBoxAmount // تحديث المبلغ الإجمالي
      };

      let response;
      let savedVoucher;
      
      if (voucher.id) {
        response = await apiFetch(`${API_ENDPOINTS.UPDATE_VOUCHER(voucher.id)}`, {
          method: 'PUT',
          body: JSON.stringify(voucherData)
        });
      } else {
        response = await apiFetch(API_ENDPOINTS.CREATE_VOUCHER, {
          method: 'POST',
          body: JSON.stringify(voucherData)
        });
      }

      if (response.ok) {
        savedVoucher = await response.json();
        
        // حفظ تفاصيل الحسابات
        for (const detail of details) {
          if (detail.acc_id) {
            const detailData = {
              ...detail,
              vouch_id: savedVoucher.id || voucher.id
            };
            
            if (detail.id) {
              await apiFetch(`${API_ENDPOINTS.UPDATE_VOUCHER_DTL(detail.id)}`, {
                method: 'PUT',
                body: JSON.stringify(detailData)
              });
            } else {
              await apiFetch(API_ENDPOINTS.CREATE_VOUCHER_DTL, {
                method: 'POST',
                body: JSON.stringify(detailData)
              });
            }
          }
        }
        
        // حفظ تفاصيل الصناديق
        for (const boxDetail of boxDetails) {
          if (boxDetail.box_id) {
            const boxDetailData = {
              ...boxDetail,
              vouch_id: savedVoucher.id || voucher.id
            };
            
            if (boxDetail.id) {
              await apiFetch(`${API_ENDPOINTS.UPDATE_VOUCHER_BOX(boxDetail.id)}`, {
                method: 'PUT',
                body: JSON.stringify(boxDetailData)
              });
            } else {
              await apiFetch(API_ENDPOINTS.CREATE_VOUCHER_BOX, {
                method: 'POST',
                body: JSON.stringify(boxDetailData)
              });
            }
          }
        }
        
        // تحديث حالة الحفظ وإعادة تحميل البيانات
        setVoucher({ ...savedVoucher, commit: true });
        router.push(`/dashboard/forms/receipt_voucher?id=${savedVoucher.id || voucher.id}`);
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const printVoucher = async () => {
    if (!voucher.id) return;
    
    try {
      setIsPrinting(true);
      const response = await apiFetch(`${API_ENDPOINTS.UPDATE_VOUCHER(voucher.id)}/print`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voucher_${voucher.vouch_id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error printing voucher:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const createNewVoucher = async () => {
    try {
      console.log("=== إنشاء سند قبض جديد ===");
      
      // توليد الرقم التالي
      const nextNumber = await getNextReceiptVoucherNumber();
      console.log("الرقم التالي لسند القبض:", nextNumber);
      
      setVoucher({
        vouch_id: nextNumber,
        vouch_date: new Date().toISOString(),
        vouch_type: 1,
        vouch_amt: 0,
        pay_type: 1,
        cr_date: new Date().toISOString(),
        vouch_status: 1,
      });
      setDetails([]);
      setBoxDetails([]);
      
      console.log("=== انتهاء إنشاء سند القبض الجديد ===");
    } catch (error) {
      console.error("خطأ في إنشاء سند القبض الجديد:", error);
      // في حالة الخطأ، نبدأ من 1
      setVoucher({
        vouch_id: 1,
        vouch_date: new Date().toISOString(),
        vouch_type: 1,
        vouch_amt: 0,
        pay_type: 1,
        cr_date: new Date().toISOString(),
        vouch_status: 1,
      });
      setDetails([]);
      setBoxDetails([]);
    }
  };

  const deleteVoucher = async () => {
    if (!voucher.id) return;
    
    if (confirm('هل أنت متأكد من حذف هذا السند؟')) {
      try {
        const response = await apiFetch(`${API_ENDPOINTS.DELETE_VOUCHER(voucher.id)}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          router.push('/dashboard/forms/receipt_voucher');
        }
      } catch (error) {
        console.error('Error deleting voucher:', error);
      }
    }
  };

  // Calculate totals
  const totalBoxAmount = boxDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
  const totalDebit = details.reduce((sum, detail) => sum + (detail.debit || 0), 0);
  const totalCredit = details.reduce((sum, detail) => sum + (detail.credit || 0), 0);

  // Calculate tax and total amounts for box details
  const calculatedBoxDetails = boxDetails.map(detail => {
    const amount = detail.amount || 0;
    const taxPrc = detail.tax_prc || 0;
    const tax = (amount * taxPrc) / 100;
    const totalAmount = amount + tax;
    
    return {
      ...detail,
      tax,
      total_amount: totalAmount
    };
  });

  return (
    <div className="p-3 max-w-[1500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* رأس السند المرتب */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 mb-4 border border-slate-200">
        {/* الصف الأول: معلومات السند */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
                <span>سند قبض</span>
                <span className="text-slate-600 font-medium">
                  #{voucher.vouch_id}
                </span>
                <span className="text-sm text-slate-600 font-medium flex items-center gap-1">
                  <i className="bi bi-calendar3 text-slate-500"></i>
                  {currentTime}
                </span>
              </h1>
            </div>
          </div>

          {/* البحث */}
          <div className="flex items-center gap-2">
            <Input
              className="w-32 h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="بحث برقم السند..."
              type="number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              size="sm"
              className="h-7 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onPress={() => {}}
            >
              <i className="bi bi-search text-xs"></i>
            </Button>
          </div>
        </div>

        {/* الصف الثاني: الأزرار والحالة */}
        <div className="flex items-center justify-between">
          {/* الأزرار من اليسار لليمين */}
          <div className="flex items-center gap-2">
            <Button
              className="h-7 px-3 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 rounded-md shadow-sm"
              onClick={saveVoucher}
              isLoading={isLoading}
            >
              <i className="bi bi-check-circle me-1"></i>
              حفظ
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
              onClick={() => {}}
            >
              <i className="bi bi-pencil-square me-1"></i>
              تعديل
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
              onClick={createNewVoucher}
            >
              <i className="bi bi-plus-circle me-1"></i>
              جديد
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onClick={printVoucher}
              isLoading={isPrinting}
            >
              <i className="bi bi-printer me-1"></i>
              طباعة
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
              onClick={() => {}}
            >
              <i className="bi bi-files me-1"></i>
              انشاء من سند سابق
            </Button>

            <Button
              className="h-7 px-3 text-xs bg-red-600 text-white hover:bg-red-700 border border-red-600 rounded-md shadow-sm"
              onClick={deleteVoucher}
              isDisabled={!voucher.id}
            >
              <i className="bi bi-trash me-1"></i>
              حذف
            </Button>

            {/* أزرار التنقل */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                size="sm"
                className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => navigateToVoucher('first')}
              >
                <i className="bi bi-chevron-double-right text-xs"></i>
              </Button>
              <Button
                size="sm"
                className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => navigateToVoucher('prev')}
              >
                <i className="bi bi-chevron-right text-xs"></i>
              </Button>
              <span className="text-xs text-slate-600 px-2 font-medium">
                {currentRecord} من {totalRecords}
              </span>
              <Button
                size="sm"
                className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => navigateToVoucher('next')}
              >
                <i className="bi bi-chevron-left text-xs"></i>
              </Button>
              <Button
                size="sm"
                className="h-7 w-7 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
                onClick={() => navigateToVoucher('last')}
              >
                <i className="bi bi-chevron-double-left text-xs"></i>
              </Button>
            </div>
          </div>

          {/* حالة السند */}
          <div className="flex items-center gap-3">
            <Checkbox
              isSelected={voucher.commit}
              isReadOnly
              color="success"
              size="sm"
            >
              <span className="text-xs text-slate-600">حُفظ</span>
            </Checkbox>
            
            <Checkbox
              isSelected={voucher.post}
              isReadOnly
              color="primary"
              size="sm"
            >
              <span className="text-xs text-slate-600">مرحل</span>
            </Checkbox>
            
            <Checkbox
              isSelected={voucher.print}
              isReadOnly
              color="warning"
              size="sm"
            >
              <span className="text-xs text-slate-600">طُبع</span>
            </Checkbox>
          </div>
        </div>
      </div>

      {/* معلومات السند */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <i className="bi bi-info-circle text-blue-600"></i>
            معلومات السند
          </h3>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block mb-1 font-medium text-gray-700 text-xs">تاريخ السند:</span>
                <Input
                  type="date"
                  value={voucher.vouch_date}
                  onChange={(e) => setVoucher(prev => ({ ...prev, vouch_date: e.target.value }))}
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                />
              </div>
              <div>
                <span className="block mb-1 font-medium text-gray-700 text-xs">نوع الدفع:</span>
                <Select
                  selectedKeys={[voucher.pay_type?.toString() || "1"]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setVoucher(prev => ({ ...prev, pay_type: parseInt(value) }));
                  }}
                  className="w-full h-[32px] text-sm"
                >
                  <SelectItem key="1">نقدي</SelectItem>
                  <SelectItem key="2">شيك</SelectItem>
                  <SelectItem key="3">تحويل بنكي</SelectItem>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block mb-1 font-medium text-gray-700 text-xs">حالة السند:</span>
                <Select
                  selectedKeys={[voucher.vouch_status?.toString() || "1"]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setVoucher(prev => ({ ...prev, vouch_status: parseInt(value) }));
                  }}
                  className="w-full h-[32px] text-sm"
                >
                  {(voucherStatuses || []).map((status) => (
                    <SelectItem key={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <span className="block mb-1 font-medium text-gray-700 text-xs">استلمت من:</span>
                <Input
                  value={voucher.vouch_notes || ""}
                  onChange={(e) => setVoucher(prev => ({ ...prev, vouch_notes: e.target.value }))}
                  placeholder="اسم المستلم"
                  className="w-full h-[32px] border px-2 rounded text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <span className="block mb-1 font-medium text-gray-700 text-xs">النقدية:</span>
              <div className="w-full h-[32px] text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-3 flex items-center">
                {formatAmount(totalBoxAmount, frac)} ريال
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شريط التنقل */}
      <div className="bg-slate-50 px-4 py-2 border border-slate-200 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-6 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onPress={() => navigateToVoucher('first')}
              isDisabled={currentRecord === 1}
            >
              <i className="bi bi-chevron-double-left text-xs"></i>
            </Button>
            <Button
              size="sm"
              className="h-6 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onPress={() => navigateToVoucher('prev')}
              isDisabled={currentRecord === 1}
            >
              <i className="bi bi-chevron-left text-xs"></i>
            </Button>
            <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-slate-300">
              السند: ◄ {currentRecord} من {totalRecords} ►
            </span>
            <Button
              size="sm"
              className="h-6 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onPress={() => navigateToVoucher('next')}
              isDisabled={currentRecord === totalRecords}
            >
              <i className="bi bi-chevron-right text-xs"></i>
            </Button>
            <Button
              size="sm"
              className="h-6 px-2 text-xs bg-slate-600 text-white hover:bg-slate-700 border border-slate-600 rounded-md shadow-sm"
              onPress={() => navigateToVoucher('last')}
              isDisabled={currentRecord === totalRecords}
            >
              <i className="bi bi-chevron-double-right text-xs"></i>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              className="h-6 px-2 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
            >
              إلغاء الفلتر
            </Button>
            <Input
              size="sm"
              placeholder="البحث في السندات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 h-6 text-xs"
            />
          </div>
        </div>
      </div>

      {/* جدول النقدية */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <i className="bi bi-cash-stack text-blue-600"></i>
            النقدية
          </h3>
          <Button
            size="sm"
            className="h-6 px-2 text-xs bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 rounded-md shadow-sm"
            onClick={addBoxDetailRow}
          >
            <i className="bi bi-plus-circle me-1"></i>
            إضافة صف نقدي
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table
            aria-label="جدول النقدية"
            className="min-w-full"
            classNames={{
              wrapper: "shadow-none",
              th: "bg-slate-50 text-slate-700 text-xs font-medium border-b border-slate-200",
              td: "border-b border-slate-100 text-xs",
            }}
          >
            <TableHeader>
              <TableColumn>الصندوق</TableColumn>
              <TableColumn>المبلغ</TableColumn>
              <TableColumn>نسبة الضريبة</TableColumn>
              <TableColumn>الضريبة</TableColumn>
              <TableColumn>الإجمالي</TableColumn>
              <TableColumn>رقم الضريبي</TableColumn>
              <TableColumn>البيان</TableColumn>
              <TableColumn>إجراءات</TableColumn>
            </TableHeader>
            <TableBody>
              {calculatedBoxDetails.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell className="py-2">
                    <Select
                      selectedKeys={[detail.box_id?.toString() || ""]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        updateBoxDetail(index, 'box_id', parseInt(value));
                      }}
                      placeholder="اختر الصندوق"
                      className="h-7 text-xs"
                    >
                                                                                          {(boxes || []).map((box) => (
                          <SelectItem key={box.id}>
                            {box.box_name}
                          </SelectItem>
                        ))}
                    </Select>
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                                             value={String(detail.amount || "0.00")}
                      onChange={(e) => updateBoxDetail(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-center border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                                             value={String(detail.tax_prc || "0.00")}
                      onChange={(e) => updateBoxDetail(index, 'tax_prc', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-center border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                      value={String(detail.tax || "0.00")}
                      isReadOnly
                      className="h-7 text-xs text-center border border-slate-300 rounded-md bg-gray-50"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                      value={String(detail.total_amount || "0.00")}
                      isReadOnly
                      className="h-7 text-xs text-center border border-slate-300 rounded-md bg-gray-50"
                      placeholder="0.00"
                    />
                  </TableCell>
                                       <TableCell className="py-2">
                       <Input
                         type="number"
                         value="0"
                         onChange={(e) => {}}
                         className="h-7 text-xs text-center border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                         placeholder="0"
                       />
                     </TableCell>
                  <TableCell className="py-2">
                    <Input
                      value={detail.vouch_notes || ""}
                      onChange={(e) => updateBoxDetail(index, 'vouch_notes', e.target.value)}
                      placeholder="البيان"
                      className="h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex gap-1 justify-center">
                      <Button
                        size="sm"
                        className="h-6 w-6 p-0 text-xs bg-red-600 text-white hover:bg-red-700 border border-red-600 rounded-md shadow-sm"
                        onClick={() => removeBoxDetailRow(index)}
                      >
                        <i className="bi bi-trash text-xs"></i>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* جدول الحسابات */}
      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <i className="bi bi-calculator text-green-600"></i>
            الحسابات
          </h3>
          <Button
            size="sm"
            className="h-6 px-2 text-xs bg-green-600 text-white hover:bg-green-700 border border-green-600 rounded-md shadow-sm"
            onClick={addDetailRow}
          >
            <i className="bi bi-plus-circle me-1"></i>
            إضافة صف حسابي
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table
            aria-label="جدول الحسابات"
            className="min-w-full"
            classNames={{
              wrapper: "shadow-none",
              th: "bg-slate-50 text-slate-700 text-xs font-medium border-b border-slate-200",
              td: "border-b border-slate-100 text-xs",
            }}
          >
            <TableHeader>
              <TableColumn>رقم الحساب</TableColumn>
              <TableColumn>الحساب</TableColumn>
              <TableColumn>البيان</TableColumn>
              <TableColumn>نسبة الضريبة</TableColumn>
              <TableColumn>الضريبة</TableColumn>
              <TableColumn>إجراءات</TableColumn>
            </TableHeader>
            <TableBody>
              {details.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                                             value={String(detail.acc_id || "")}
                      onChange={(e) => updateDetail(index, 'acc_id', parseInt(e.target.value) || 0)}
                      className="h-7 text-xs text-center border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="رقم الحساب"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Select
                      selectedKeys={[detail.acc_id?.toString() || ""]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        updateDetail(index, 'acc_id', parseInt(value));
                      }}
                      placeholder="اختر الحساب"
                      className="h-7 text-xs"
                    >
                                                                                               {(accounts || []).map((account) => (
                            <SelectItem key={account.id}>
                              {account.acc_name}
                            </SelectItem>
                          ))}
                    </Select>
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      value={detail.vouch_notes || ""}
                      onChange={(e) => updateDetail(index, 'vouch_notes', e.target.value)}
                      placeholder="البيان"
                      className="h-7 text-xs border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                                             value={String(detail.tax_prc || "0.00")}
                      onChange={(e) => updateDetail(index, 'tax_prc', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-center border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                                             value={String(detail.tax || "0.00")}
                      onChange={(e) => updateDetail(index, 'tax', parseFloat(e.target.value) || 0)}
                      className="h-7 text-xs text-center border border-slate-300 rounded-md focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex gap-1 justify-center">
                      <Button
                        size="sm"
                        className="h-6 w-6 p-0 text-xs bg-red-600 text-white hover:bg-red-700 border border-red-600 rounded-md shadow-sm"
                        onClick={() => removeDetailRow(index)}
                      >
                        <i className="bi bi-trash text-xs"></i>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* الإجماليات */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">إجمالي النقدية</p>
            <p className="text-lg font-bold text-blue-600">
              {formatAmount(totalBoxAmount, frac)} ريال
            </p>
          </div>
          <div className="text-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">إجمالي المدين</p>
            <p className="text-lg font-bold text-red-600">
              {formatAmount(totalDebit, frac)} ريال
            </p>
          </div>
          <div className="text-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">إجمالي الدائن</p>
            <p className="text-lg font-bold text-green-600">
              {formatAmount(totalCredit, frac)} ريال
            </p>
          </div>
          <div className="text-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">الفرق</p>
            <p className={`text-lg font-bold ${totalCredit - totalDebit === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatAmount(totalCredit - totalDebit, frac)} ريال
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
