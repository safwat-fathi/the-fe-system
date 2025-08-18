"use client";

import { useEffect, useState, useRef } from "react";
import { Input, Button, Select, SelectItem, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import toast from "react-hot-toast";
import { API_ENDPOINTS, fetchData } from "../../../../utilities/api";
import Card from "../../../../components/Card";
import { FormModal, InfoModal } from "../../../../components/Modal";

// Simple icon components
const ChevronRightIcon = ({ className }: { className?: string }) => <span className={className}>▶</span>;
const ChevronDownIcon = ({ className }: { className?: string }) => <span className={className}>▼</span>;
const FolderIcon = ({ className }: { className?: string }) => <span className={className}>📁</span>;
const DocumentIcon = ({ className }: { className?: string }) => <span className={className}>📄</span>;
const PlusIcon = ({ className }: { className?: string }) => <span className={className}>+</span>;
const PencilIcon = ({ className }: { className?: string }) => <span className={className}>✏️</span>;
const EyeIcon = ({ className }: { className?: string }) => <span className={className}>👁️</span>;
const TrashIcon = ({ className }: { className?: string }) => <span className={className}>🗑️</span>;

interface Account {
  id: number;
  acc_id: string;
  acc_name: string;
  acc_name_e?: string;
  acc_type: number; // 1 = رئيسي, 2 = فرعي
  parent: number | null;
  acc_level: number;
  acc_kind: number;
  acc_rep: number; // 1 = الأرباح والخسائر, 2 = الميزانية العمومية
  acc_digit: number;
  acc_priv: number;
  acc_cat: number;
  acc_notes?: string;
  cur?: number;
  children?: Account[];
}

interface Currency {
  id: number;
  cur_name: string;
  cur_code: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Form states
  const [formData, setFormData] = useState({
    acc_id: "",
    acc_name: "",
    acc_name_e: "",
    acc_type: 1,
    parent: null as number | null,
    acc_kind: 1,
    acc_rep: 1,
    acc_digit: 4,
    acc_priv: 1,
    acc_cat: 1,
    acc_notes: "",
    cur: 1,
    acc_level: 1
  });



  useEffect(() => {
    fetchAccounts();
    fetchCurrencies();
  }, []);

  const fetchAccounts = async () => {
    try {
      const allAccountsData = await fetchData<Account[]>(API_ENDPOINTS.ACCOUNTS_LIST);
      if (!allAccountsData || !Array.isArray(allAccountsData)) {
        toast.error("فشل في تحميل الحسابات");
        return;
      }
      
      console.log("Fetched Accounts:", allAccountsData);
      
      const accountsWithChildren = buildAccountTree(allAccountsData);
      setAccounts(accountsWithChildren);
    } catch (error) {
      toast.error("فشل في تحميل الحسابات");
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const currenciesData = await fetchData<Currency[]>(API_ENDPOINTS.CURRENCIES_LIST);
      if (!currenciesData || !Array.isArray(currenciesData)) {
        toast.error("حدث خطأ أثناء جلب بيانات العملات.");
        return;
      }
      
      console.log("Fetched Currencies:", currenciesData);
      setCurrencies(currenciesData);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      toast.error("حدث خطأ أثناء جلب بيانات العملات.");
    }
  };

  const buildAccountTree = (flatAccounts: Account[]): Account[] => {
    const accountMap = new Map<number, Account>();
    const rootAccounts: Account[] = [];

    // Create a map of all accounts
    flatAccounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build the tree structure
    flatAccounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;
      
      if (account.parent === null) {
        rootAccounts.push(accountWithChildren);
      } else {
        const parent = accountMap.get(account.parent);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(accountWithChildren);
        }
      }
    });

    return rootAccounts;
  };

  const toggleNode = (accountId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedNodes(newExpanded);
  };

  const generateAccountId = (parentId: number | null): string => {
    const parentAccount = accounts.find(account => account.id === parentId);
    const parentAccId = parentAccount ? parentAccount.acc_id : "";

    // تحقق من المستوى الأب
    if (parentAccount && parentAccount.acc_level >= 5) {
      toast.error("لا يمكن إضافة حسابات جديدة تحت المستوى الخامس.");
      return "";
    }

    // إيجاد جميع الحسابات التي لها نفس الأب
    const siblings = accounts.filter(account => account.parent === parentId);
    const siblingCount = siblings.length;

    // تحقق من العدد المسموح به بناءً على المستوى
    if (parentAccount && parentAccount.acc_level < 5 && siblingCount >= 9) {
      toast.error("لا يمكن إضافة أكثر من 9 حسابات في هذا المستوى.");
      return "";
    }

    let newSuffix: string;
    if (parentAccount && parentAccount.acc_level < 4) {
      // للمستويات الأول إلى الثالث، يتم استخدام رقم تسلسلي (1-9)
      newSuffix = (siblingCount + 1).toString();
    } else if (parentAccount && parentAccount.acc_level === 4) {
      // للمستوى الخامس، يتم استخدام أربع خانات تسلسلية
      const siblingNumbers = siblings.map(sibling => parseInt(sibling.acc_id.substring(parentAccId.length)) || 0);
      newSuffix = (Math.max(...siblingNumbers, 0) + 1).toString().padStart(4, "0"); // أربعة أرقام مع الصفر في البداية
    } else {
      // للمستويات الأخرى
      newSuffix = (siblingCount + 1).toString();
    }

    return `${parentAccId}${newSuffix}`;
  };

  const handleAddAccount = () => {
    // تعيين الحساب الأب إذا كان محددًا
    if (selectedAccount) {
      const parentAccount = accounts.find(account => account.id === selectedAccount.id);

      if (parentAccount && parentAccount.acc_level >= 5) {
        toast.error("لا يمكن إضافة حسابات جديدة تحت المستوى الخامس.");
        return;
      }

      // ضبط الحساب الأب والمستوى
      setFormData(prev => ({
        ...prev,
        parent: selectedAccount.id,
        acc_type: 2, // 2 = فرعي
        acc_level: parentAccount ? parentAccount.acc_level + 1 : 1
      }));
    } else {
      // إذا لم يتم تحديد حساب أب، يكون الحساب "رئيسي"
      setFormData(prev => ({
        ...prev,
        parent: null,
        acc_type: 1, // 1 = رئيسي
        acc_level: 1
      }));
    }

    const newAccountId = generateAccountId(selectedAccount?.id || null);
    if (!newAccountId) return;

    setFormData(prev => ({ ...prev, acc_id: newAccountId }));
    setIsAddModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setFormData({
      acc_id: account.acc_id,
      acc_name: account.acc_name,
      acc_name_e: account.acc_name_e || "",
      acc_type: account.acc_type,
      parent: account.parent,
      acc_kind: account.acc_kind,
      acc_rep: account.acc_rep,
      acc_digit: account.acc_digit,
      acc_priv: account.acc_priv,
      acc_cat: account.acc_cat,
      acc_notes: account.acc_notes || "",
      cur: account.cur || 1,
      acc_level: account.acc_level
    });
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleViewAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsViewModalOpen(true);
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذا الحساب؟")) return;

    try {
      const result = await fetchData(API_ENDPOINTS.DELETE_ACCOUNT(accountId), "DELETE");
      if (result === null) {
        toast.error("حدث خطأ أثناء حذف الحساب");
        return;
      }

      toast.success("تم حذف الحساب بنجاح");
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("خطأ في الاتصال بالخادم. تحقق من الرابط أو الإعدادات.");
    }
  };

  const handleSubmit = async (isEdit: boolean = false) => {
    try {
      const newAccount: any = {
        acc_id: formData.acc_id,
        acc_name: formData.acc_name,
        acc_name_e: formData.acc_name_e || "Unnamed Account",
        acc_type: formData.acc_type,
        parent: formData.parent,
        acc_kind: formData.acc_kind,
        acc_rep: formData.acc_rep,
        acc_digit: formData.acc_digit,
        acc_priv: formData.acc_priv,
        acc_cat: formData.acc_cat,
        acc_notes: formData.acc_notes || "",
        acc_vat: "0%",
        cur: formData.cur,
        acc_level: formData.parent ? 
          (accounts.find(a => a.id === formData.parent)?.acc_level || 0) + 1 : 1
      };

      if (isEdit && selectedAccount) {
        newAccount.id = selectedAccount.id;
      }

      const url = isEdit ? API_ENDPOINTS.UPDATE_ACCOUNT(selectedAccount?.id!) : API_ENDPOINTS.CREATE_ACCOUNT;
      const method = isEdit ? "PUT" : "POST";

      const result = await fetchData(url, method, newAccount);
      if (result === null) {
        toast.error("حدث خطأ أثناء حفظ الحساب");
        return;
      }

      toast.success(isEdit ? "تم تحديث الحساب بنجاح" : "تمت إضافة الحساب بنجاح");
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
              setFormData({
          acc_id: "",
          acc_name: "",
          acc_name_e: "",
          acc_type: 1,
          parent: null,
          acc_kind: 1,
          acc_rep: 1,
          acc_digit: 4,
          acc_priv: 1,
          acc_cat: 1,
          acc_notes: "",
          cur: 1,
          acc_level: 1
        });
      fetchAccounts();
    } catch (error) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم.");
      console.error("Error submitting account:", error);
    }
  };

  const renderAccountTree = (accounts: Account[], level: number = 0) => {
    return accounts.map(account => {
      const hasChildren = account.children && account.children.length > 0;
      const isExpanded = expandedNodes.has(account.id);
      const isSelected = selectedAccount?.id === account.id;

      return (
        <div key={account.id} className="w-full">
          <div 
            className={`
              flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200
              ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
              ${level > 0 ? 'mr-' + (level * 4) : ''}
            `}
            onClick={() => setSelectedAccount(account)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(account.id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            {hasChildren ? (
              <FolderIcon className="w-5 h-5 text-blue-500" />
            ) : (
              <DocumentIcon className="w-5 h-5 text-gray-500" />
            )}
            
            <div className="flex-1 min-w-0 text-right">
              <div className="font-medium text-gray-900 truncate">
                {account.acc_name}
              </div>
              <div className="text-sm text-gray-500">
                {account.acc_id}
              </div>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="mr-4 border-r border-gray-200">
              {renderAccountTree(account.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // دالة لجلب الحسابات الفرعية المباشرة فقط (المستوى التالي)
  const getDirectSubAccounts = (account: Account): Account[] => {
    return account.children || [];
  };

  // دالة لجلب جميع الحسابات الفرعية للحساب المختار
  const getSubAccounts = (account: Account): Account[] => {
    const subAccounts: Account[] = [];
    
    const getAllChildren = (acc: Account) => {
      if (acc.children && acc.children.length > 0) {
        acc.children.forEach(child => {
          subAccounts.push(child);
          getAllChildren(child);
        });
      }
    };
    
    getAllChildren(account);
    return subAccounts;
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.acc_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.acc_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "main") return matchesSearch && account.acc_type === 1;
    if (filterType === "sub") return matchesSearch && account.acc_type === 2;
    
    return matchesSearch;
  });

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">دليل الحسابات</h1>
          <p className="text-gray-600 text-sm">إدارة وتنظيم شجرة الحسابات المحاسبية</p>
        </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
           {/* Tree Panel */}
           <div className="lg:col-span-1">
             <Card className="h-[700px]">
              <CardBody className="p-2">
                                 <div className="flex items-center justify-between mb-2">
                   <h2 className="text-lg font-semibold text-gray-900">شجرة الحسابات</h2>
                   <Button
                     size="sm"
                     color="primary"
                     startContent={<PlusIcon className="w-4 h-4" />}
                     onClick={handleAddAccount}
                   >
                     إضافة حساب
                   </Button>
                 </div>

                                {/* Search and Filters */}
                <div className="space-y-2 mb-2">
                                     <Input
                     placeholder="بحث في الحسابات..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     startContent={<i className="bi bi-search text-gray-400" />}
                     size="sm"
                     variant="bordered"
                   />

                  <Select
                    placeholder="تصفية حسب النوع"
                    selectedKeys={[filterType]}
                    onSelectionChange={(keys) => setFilterType(Array.from(keys)[0] as string)}
                    size="sm"
                    variant="bordered"
                  >
                    <SelectItem key="all">جميع الحسابات</SelectItem>
                    <SelectItem key="main">الحسابات الرئيسية</SelectItem>
                    <SelectItem key="sub">الحسابات الفرعية</SelectItem>
                  </Select>
                </div>

                                                                   {/* Tree View */}
                  <div className="overflow-y-auto max-h-[500px] text-right">
                    {filteredAccounts.length > 0 ? (
                      renderAccountTree(filteredAccounts)
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        لا توجد حسابات
                      </div>
                    )}
                  </div>
              </CardBody>
            </Card>
          </div>

                                {/* Details Panel */}
            <div className="lg:col-span-2">
              <Card className="h-[700px]">
               <CardBody className="p-2">
                                                                       <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-3">
                       <h2 className="text-lg font-semibold text-gray-900">
                         {selectedAccount ? `حسابات ${selectedAccount.acc_name}` : "تفاصيل الحسابات"}
                       </h2>
                       {selectedAccount && selectedAccount.parent && (
                         <button
                           onClick={() => {
                             const parentAccount = accounts.find(acc => acc.id === selectedAccount.parent);
                             if (parentAccount) {
                               setSelectedAccount(parentAccount);
                             }
                           }}
                           className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                           title="العودة للحساب الأب"
                         >
                           ← العودة للأب
                         </button>
                       )}
                     </div>
                     {selectedAccount && (
                       <div className="flex items-center gap-2">
                         <span className="text-sm text-gray-500">المستوى:</span>
                         <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                           {selectedAccount.acc_level}
                         </span>
                       </div>
                     )}
                   </div>

                 {selectedAccount ? (
                   <div className="space-y-2">
                     {/* معلومات الحساب المختار */}
                     <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                       <h3 className="font-semibold text-blue-900 mb-1 text-sm">معلومات الحساب المختار</h3>
                                               <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">رقم الحساب:</span>
                            <div className="font-medium">{selectedAccount.acc_id}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">اسم الحساب:</span>
                            <div className="font-medium">{selectedAccount.acc_name}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">نوع الحساب:</span>
                            <div className="font-medium">{selectedAccount.acc_type === 1 ? "رئيسي" : "فرعي"}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">العملة:</span>
                            <div className="font-medium">{currencies.find(c => c.id === selectedAccount.cur)?.cur_name || "غير محددة"}</div>
                          </div>
                        </div>
                     </div>

                                                                                      {/* جدول الحسابات الفرعية */}
                      <div>
                                                 <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                           المستوى {selectedAccount.acc_level + 1} - الحسابات الفرعية المباشرة
                         </h3>
                         <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                           <table className="w-full border-collapse border border-gray-300">
                                                         <thead className="bg-gray-100">
                               <tr>
                                 <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">رقم الحساب</th>
                                 <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">اسم الحساب</th>
                                 <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">نوع الحساب</th>
                                 <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">المستوى</th>
                                 <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">نوع التقرير</th>       
                                 <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">العملة</th>
                                 <th className="border border-gray-300 px-2 py-1 text-right text-xs font-medium text-gray-700">الإجراءات</th>
                               </tr>
                             </thead>
                            <tbody>
                              {getDirectSubAccounts(selectedAccount).length > 0 ? (
                                getDirectSubAccounts(selectedAccount).map((account) => (
                                                                     <tr 
                                     key={account.id} 
                                     className="hover:bg-gray-50 cursor-pointer"
                                     onDoubleClick={() => setSelectedAccount(account)}
                                     title="انقر مزدوج للانتقال إلى المستوى التالي"
                                   >
                                     <td className="border border-gray-300 px-2 py-1 text-xs">{account.acc_id}</td>
                                     <td className="border border-gray-300 px-2 py-1 text-xs font-medium">{account.acc_name}</td>
                                     <td className="border border-gray-300 px-2 py-1 text-xs">
                                       {account.acc_type === 1 ? "رئيسي" : "فرعي"}
                                     </td>
                                     <td className="border border-gray-300 px-2 py-1 text-xs text-center">{account.acc_level}</td>
                                     <td className="border border-gray-300 px-2 py-1 text-xs">
                                       {account.acc_rep === 1 ? "الأرباح والخسائر" : "الميزانية العمومية"}
                                     </td>
                                     <td className="border border-gray-300 px-2 py-1 text-xs">
                                       {currencies.find(c => c.id === account.cur)?.cur_name || "غير محددة"}
                                     </td>
                                     <td className="border border-gray-300 px-2 py-1 text-xs">
                                       <div className="flex items-center gap-1 justify-center">
                                         <button
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             handleViewAccount(account);
                                           }}
                                           className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                           title="عرض"
                                         >
                                           <EyeIcon className="w-4 h-4" />
                                         </button>
                                         <button
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             handleEditAccount(account);
                                           }}
                                           className="p-1 hover:bg-green-100 rounded text-green-600"
                                           title="تعديل"
                                         >
                                           <PencilIcon className="w-4 h-4" />
                                         </button>
                                         <button
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             handleDeleteAccount(account.id);
                                           }}
                                           className="p-1 hover:bg-red-100 rounded text-red-600"
                                           title="حذف"
                                         >
                                           <TrashIcon className="w-4 h-4" />
                                         </button>
                                       </div>
                                     </td>
                                   </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="border border-gray-300 px-2 py-2 text-center text-gray-500 text-xs">
                                    لا توجد حسابات فرعية مباشرة لهذا الحساب
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                   </div>
                                   ) : (
                                         <div className="text-center text-gray-500 py-6">
                       <DocumentIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                       <p className="text-sm">اختر حساباً لعرض تفاصيله والحسابات الفرعية</p>
                     </div>
                  )}
               </CardBody>
             </Card>
           </div>
        </div>
      </div>

             {/* Add Account Modal */}
       <FormModal
         isOpen={isAddModalOpen}
         onClose={() => setIsAddModalOpen(false)}
         onSubmit={() => handleSubmit(false)}
         title="إضافة حساب جديد"
         submitText="إضافة الحساب"
         cancelText="إلغاء"
       >
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Input
             label="رقم الحساب"
             value={formData.acc_id}
             onChange={(e) => setFormData(prev => ({ ...prev, acc_id: e.target.value }))}
             variant="bordered"
           />
           
           <Input
             label="اسم الحساب"
             value={formData.acc_name}
             onChange={(e) => setFormData(prev => ({ ...prev, acc_name: e.target.value }))}
             variant="bordered"
           />

           <Input
             label="اسم الحساب (إنجليزي)"
             value={formData.acc_name_e}
             onChange={(e) => setFormData(prev => ({ ...prev, acc_name_e: e.target.value }))}
             variant="bordered"
           />

           <Select
             label="نوع الحساب"
             selectedKeys={[formData.acc_type.toString()]}
             onSelectionChange={(keys) => setFormData(prev => ({ ...prev, acc_type: parseInt(Array.from(keys)[0] as string) }))}
             variant="bordered"
           >
             <SelectItem key="1">رئيسي</SelectItem>
             <SelectItem key="2">فرعي</SelectItem>
           </Select>

           <Select
             label="نوع التقرير"
             selectedKeys={[formData.acc_rep.toString()]}
             onSelectionChange={(keys) => setFormData(prev => ({ ...prev, acc_rep: parseInt(Array.from(keys)[0] as string) }))}
             variant="bordered"
           >
             <SelectItem key="1">الأرباح والخسائر</SelectItem>
             <SelectItem key="2">الميزانية العمومية</SelectItem>
           </Select>

           <Select
             label="العملة"
             selectedKeys={[formData.cur.toString()]}
             onSelectionChange={(keys) => setFormData(prev => ({ ...prev, cur: parseInt(Array.from(keys)[0] as string) }))}
             variant="bordered"
           >
             {currencies.map(currency => (
               <SelectItem key={currency.id.toString()}>
                 {currency.cur_name}
               </SelectItem>
             ))}
           </Select>

           <Input
             label="عدد الخانات العشرية"
             type="number"
             value={formData.acc_digit.toString()}
             onChange={(e) => setFormData(prev => ({ ...prev, acc_digit: parseInt(e.target.value) }))}
             variant="bordered"
           />

           <Input
             label="ملاحظات"
             value={formData.acc_notes}
             onChange={(e) => setFormData(prev => ({ ...prev, acc_notes: e.target.value }))}
             variant="bordered"
           />
         </div>
       </FormModal>

             {/* Edit Account Modal */}
       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="2xl">
         <ModalContent>
           <ModalHeader>تعديل الحساب</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="رقم الحساب"
                value={formData.acc_id}
                onChange={(e) => setFormData(prev => ({ ...prev, acc_id: e.target.value }))}
                variant="bordered"
              />
              
              <Input
                label="اسم الحساب"
                value={formData.acc_name}
                onChange={(e) => setFormData(prev => ({ ...prev, acc_name: e.target.value }))}
                variant="bordered"
              />

              <Input
                label="اسم الحساب (إنجليزي)"
                value={formData.acc_name_e}
                onChange={(e) => setFormData(prev => ({ ...prev, acc_name_e: e.target.value }))}
                variant="bordered"
              />

              <Select
                label="نوع الحساب"
                selectedKeys={[formData.acc_type.toString()]}
                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, acc_type: parseInt(Array.from(keys)[0] as string) }))}
                variant="bordered"
              >
                <SelectItem key="1">رئيسي</SelectItem>
                <SelectItem key="2">فرعي</SelectItem>
              </Select>

              <Select
                label="نوع التقرير"
                selectedKeys={[formData.acc_rep.toString()]}
                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, acc_rep: parseInt(Array.from(keys)[0] as string) }))}
                variant="bordered"
              >
                <SelectItem key="1">الأرباح والخسائر</SelectItem>
                <SelectItem key="2">الميزانية العمومية</SelectItem>
              </Select>

              <Select
                label="العملة"
                selectedKeys={[formData.cur.toString()]}
                onSelectionChange={(keys) => setFormData(prev => ({ ...prev, cur: parseInt(Array.from(keys)[0] as string) }))}
                variant="bordered"
              >
                {currencies.map(currency => (
                  <SelectItem key={currency.id.toString()}>
                    {currency.cur_name}
                  </SelectItem>
                ))}
              </Select>

              <Input
                label="عدد الخانات العشرية"
                type="number"
                value={formData.acc_digit.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, acc_digit: parseInt(e.target.value) }))}
                variant="bordered"
              />

              <Input
                label="ملاحظات"
                value={formData.acc_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, acc_notes: e.target.value }))}
                variant="bordered"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={() => setIsEditModalOpen(false)}>
              إلغاء
            </Button>
            <Button color="primary" onPress={() => handleSubmit(true)}>
              حفظ التغييرات
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

             {/* View Account Modal */}
       <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="lg">
         <ModalContent>
           <ModalHeader>تفاصيل الحساب</ModalHeader>
          <ModalBody>
            {selectedAccount && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الحساب
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedAccount.acc_id}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم الحساب
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedAccount.acc_name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع الحساب
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedAccount.acc_type === 1 ? "رئيسي" : "فرعي"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المستوى
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedAccount.acc_level}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع التقرير
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedAccount.acc_rep === 1 ? "الأرباح والخسائر" : "الميزانية العمومية"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العملة
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {currencies.find(c => c.id === selectedAccount.cur)?.cur_name || "غير محددة"}
                    </div>
                  </div>
                </div>

                {selectedAccount.acc_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الملاحظات
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedAccount.acc_notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => setIsViewModalOpen(false)}>
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
