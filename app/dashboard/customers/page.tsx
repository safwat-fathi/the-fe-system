"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import ReactSelect from "react-select";

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
  Tooltip,
} from "@heroui/react";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";
import { fetchData } from "@/utilities/api";
import { API_BASE_URL } from "@/utilities/api";

interface Customer {
  id: number;
  cust_code?: string;
  cust_name: string;
  cust_name_e: string;
  mobile: number | string;
  email: string;
  address: string;
  vat_no: number | null;
  cr_no: number | null;
  phone: string;
  fax: string;
  gov: string;
  city: string;
  area: string;
  street: string;
  build_no: string;
  post_code: string;
  cust_status: boolean;
  acc?: number;
  acc_name?: string;
  cust_type?: number;
  box_type: string;
  handling: string;
  handling_e?: string;
  perc?: number;
  expt?: boolean;
  cancel?: boolean;
}

const API_URL = `${API_BASE_URL}customers_list`;
const CREATE_URL = `${API_BASE_URL}api_create_customer`;
const UPDATE_URL = (id: number) => `${API_BASE_URL}api_update_customer/${id}`;
const DELETE_URL = (id: number) => `${API_BASE_URL}api_delete_customer/${id}`;
const cust_type_URL = `${API_BASE_URL}cust_type_list`;
const ACCOUNTS_URL = `${API_BASE_URL}accounts_list`;
const BOX_TYPE_URL = `${API_BASE_URL}getBoxTypeList`;

const columns = [
  { name: "كود العميل", uid: "cust_code" },
  { name: "الاسم", uid: "cust_name" },
  { name: "الاسم بالإنجليزي", uid: "cust_name_e" },
  { name: "الجوال", uid: "mobile" },
  { name: "البريد الإلكتروني", uid: "email" },
  { name: "الحالة", uid: "cust_status" },
  { name: "", uid: "actions" },
];

export function handleLanguageChange(e: React.FocusEvent<HTMLInputElement>) {
  e.target.setAttribute("lang", "en");
}

export default function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerTypes, setCustomerTypes] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [boxTypes, setBoxTypes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
  const [custTypeFilter, setCustTypeFilter] = useState<number | null>(null);
  const router = useRouter();
  const rowsPerPage = 12;

  const loadCustomers = useCallback(async () => {
    const data = await fetchData(API_URL);
    if (Array.isArray(data)) {
      setCustomers(data as Customer[]);
    } else {
      console.error("البيانات غير متوقعة:", data);
      setCustomers([]);
    }
  }, []);

  const loadMetaData = useCallback(async () => {
    const types = await fetchData(cust_type_URL);
    const accs = await fetchData(ACCOUNTS_URL);
    const boxesResponse = await fetchData(BOX_TYPE_URL);
    const boxes = Array.isArray(boxesResponse?.results) ? boxesResponse.results : [];
    setCustomerTypes(types);
    setAccounts(accs);
    setBoxTypes(boxes);
  }, []);

  useEffect(() => {
    loadCustomers();
    loadMetaData();
  }, [loadCustomers, loadMetaData]);

  const handleSave = async () => {
    try {
      const url = modalMode === "edit" && currentCustomer.id ? UPDATE_URL(currentCustomer.id) : CREATE_URL;
      const method = modalMode === "edit" ? "PUT" : "POST";
      const { acc_name, ...rest } = currentCustomer;

      const cleanedCustomer = {
        ...rest,
        acc: Number(currentCustomer.acc) || null,
        vat_no: Number(currentCustomer.vat_no) || null,
        cr_no: Number(currentCustomer.cr_no) || null,
        perc: Number(currentCustomer.perc) || null,
        cust_type: Number(currentCustomer.cust_type) || null,
        expt: !!currentCustomer.expt,
        cancel: !!currentCustomer.cancel,
        post_code: currentCustomer.post_code || ""
      };
      
      console.log("🚀 البيانات المرسلة:", cleanedCustomer);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedCustomer),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("❌ خطأ في الإرسال:", err);
        throw new Error("فشل في العملية");
      }

      alert(modalMode === "edit" ? "✅ تم تعديل العميل بنجاح" : "✅ تم إضافة العميل بنجاح");
      setIsModalOpen(false);
      loadCustomers();
    } catch (error) {
      alert("❌ حدث خطأ أثناء الحفظ");
    }
  };

  const renderActions = (cust: Customer) => (
    <div className="flex gap-5">
      <Tooltip content="تعديل">
        <Button
          className="rounded-full border border-gray-300"
          isIconOnly
          size="sm"
          variant="flat"
          onPress={() => openModal("edit", cust)}
        >
          <FaEdit className="text-base" />
        </Button>
      </Tooltip>
      <Tooltip content="عرض">
        <Button
          className="rounded-full border border-gray-300"
          isIconOnly
          size="sm"
          variant="flat"
          onPress={() => openModal("view", cust)}
        >
          <FaEye className="text-base" />
        </Button>
      </Tooltip>
      <Tooltip content="حذف">
        <Button
          className="rounded-full border border-gray-300"
          isIconOnly
          size="sm"
          variant="flat"
          onPress={() => handleDelete(cust.id)}
        >
          <FaTrash className="text-base" />
        </Button>
      </Tooltip>
    </div>
  );
  

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذا العميل؟")) return;
    try {
      const response = await fetch(DELETE_URL(id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error();
      alert("✅ تم حذف العميل بنجاح");
      loadCustomers();
    } catch (error) {
      alert("❌ حدث خطأ أثناء الحذف");
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.cust_name?.toLowerCase().includes(search.toLowerCase()) &&
        (!custTypeFilter || c.cust_type === custTypeFilter)
    );
  }, [customers, search, custTypeFilter]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  const openModal = (mode: "add" | "edit" | "view", customer: Partial<Customer> = {}) => {
    setModalMode(mode);
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  return (
    <div className="p-4 font-cairo">
        <h1 className="text-2xl font-bold mb-6">العملاء</h1>
<div className="flex justify-between mb-4">
  <Button onPress={() => openModal("add")}> <FaPlus /> إضافة عميل </Button>
  <div className="flex gap-2 items-center">
    
      <Select
        placeholder="فرز حسب نوع العميل"
        selectedKeys={custTypeFilter !== null ? [String(custTypeFilter)] : ["all"]}
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0];
          setCustTypeFilter(key === "all" ? null : Number(key));
        }}
        className="w-60"
      >
        <SelectItem key="all" textValue="الكل">الكل</SelectItem>
        {customerTypes.map((type) => (
          <SelectItem
            key={String(type.id)}
            textValue={type.type_name}
          >
            {type.type_name}
          </SelectItem>
        ))}
    </Select>



    <Tooltip content="إدارة أنواع العملاء">
      <Button isIconOnly size="sm" variant="flat" onPress={() => router.push('/dashboard/cust_types')}>
        +
      </Button>
    </Tooltip>

    <Input
      placeholder="بحث بالاسم..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-60"
    />
  </div>
</div>

      <Table aria-label="جدول العملاء">
        <TableHeader>
          {columns.map(col => <TableColumn key={col.uid}>{col.name}</TableColumn>)}
        </TableHeader>
        <TableBody>
          {paginatedCustomers.map((cust) => (
            <TableRow key={cust.id}>
              <TableCell>{cust.cust_code}</TableCell>
              <TableCell>{cust.cust_name}</TableCell>
              <TableCell>{cust.cust_name_e}</TableCell>
              <TableCell>{cust.mobile}</TableCell>
              <TableCell>{cust.email}</TableCell>
              <TableCell><Checkbox isSelected={cust.cust_status} isReadOnly /></TableCell>
              <TableCell>{renderActions(cust)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center py-4">
        <span>عدد العملاء: {filteredCustomers.length}</span>
        <Pagination color="primary" page={page} total={Math.ceil(filteredCustomers.length / rowsPerPage)} onChange={setPage} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} scrollBehavior="inside" size="5xl" backdrop="opaque" isDismissable={false}>
  <ModalContent className="font-cairo">
    <ModalHeader>
      {modalMode === "add" && "إضافة عميل"}
      {modalMode === "edit" && "تعديل عميل"}
      {modalMode === "view" && "عرض بيانات العميل"}
    </ModalHeader>

    <ModalBody className="grid grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto pr-2">
      <div className="col-span-3 text-lg font-bold border-b pb-2">البيانات الأساسية</div>

      <Input isDisabled={isViewMode} label="كود العميل" value={currentCustomer.cust_code || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, cust_code: e.target.value })} />
      <Input isDisabled={isViewMode} label="اسم العميل" value={currentCustomer.cust_name || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, cust_name: e.target.value })} />
      <Input isDisabled={isViewMode} label="اسم العميل بالإنجليزي" value={currentCustomer.cust_name_e || ""} onFocus={handleLanguageChange} onChange={(e) => setCurrentCustomer({ ...currentCustomer, cust_name_e: e.target.value })} />
      <Input isDisabled={isViewMode} label="الجوال" value={currentCustomer.mobile?.toString() || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, mobile: e.target.value })} />
      <Input isDisabled={isViewMode} label="البريد الإلكتروني" value={currentCustomer.email || ""} onFocus={handleLanguageChange} onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })} />
      <Input isDisabled={isViewMode} label="الرقم الضريبي" value={currentCustomer.vat_no?.toString() || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, vat_no: Number(e.target.value) })} />
      <Input isDisabled={isViewMode} label="رقم السجل التجاري" value={currentCustomer.cr_no?.toString() || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, cr_no: Number(e.target.value) })} />

      <div className="col-span-3 text-lg font-bold border-b pb-2">العناوين والتواصل</div>

      <Input isDisabled={isViewMode} label="هاتف المنزل" value={currentCustomer.phone || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })} />
      <Input isDisabled={isViewMode} label="الفاكس" value={currentCustomer.fax || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, fax: e.target.value })} />
      <Input isDisabled={isViewMode} label="العنوان" value={currentCustomer.address || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })} />
      <Input isDisabled={isViewMode} label="المحافظة" value={currentCustomer.gov || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, gov: e.target.value })} />
      <Input isDisabled={isViewMode} label="المدينة" value={currentCustomer.city || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, city: e.target.value })} />
      <Input isDisabled={isViewMode} label="المنطقة" value={currentCustomer.area || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, area: e.target.value })} />
      <Input isDisabled={isViewMode} label="الشارع" value={currentCustomer.street || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, street: e.target.value })} />
      <Input isDisabled={isViewMode} label="المبنى" value={currentCustomer.build_no || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, build_no: e.target.value })} />
      <Input isDisabled={isViewMode} label="الرمز البريدي" value={currentCustomer.post_code || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, post_code: e.target.value })} />

<div className="col-span-3 text-lg font-bold border-b pb-2">الحسابات والتصنيفات</div>

{/* رقم الحساب / اسم الحساب */}
<div className="col-span-2">
  <ReactSelect
    className="w-full text-sm"
    classNamePrefix="heroui"
    isDisabled={isViewMode}
    options={accounts.map((acc) => ({
      value: acc.id,
      label: `${acc.id} - ${acc.acc_name}`,
    }))}
    placeholder="رقم الحساب / اسم الحساب"
    value={
      currentCustomer.acc
        ? {
            value: currentCustomer.acc,
            label: `${currentCustomer.acc} - ${currentCustomer.acc_name || ""}`,
          }
        : null
    }
    onChange={(selectedOption) => {
      const accObj = accounts.find((acc) => acc.id === selectedOption?.value);
      if (accObj) {
        setCurrentCustomer({
          ...currentCustomer,
          acc: accObj.id,
          acc_name: accObj.acc_name,
        });
      }
    }}
    isSearchable
    menuPlacement="auto"
    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
    menuPosition="fixed"
    styles={{
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }}
    components={{
      IndicatorSeparator: () => null,
    }}
  />
</div>

{/* نوع الصندوق */}
<div className="col-span-1">
  <ReactSelect
    className="w-full text-sm"
    classNamePrefix="heroui"
    isDisabled={isViewMode}
    options={boxTypes.map((box) => ({
      value: box.code_id,
      label: box.code_desc,
    }))}
    placeholder="نوع الصندوق"
    value={
      currentCustomer.box_type
        ? {
            value: currentCustomer.box_type,
            label: boxTypes.find((b) => b.code_id === currentCustomer.box_type)?.code_desc || "",
          }
        : null
    }
    onChange={(selectedOption) => {
      setCurrentCustomer({ ...currentCustomer, box_type: selectedOption?.value || "" });
    }}
    isSearchable
    menuPlacement="auto"
    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
    menuPosition="fixed"
    styles={{
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }}
    components={{
      IndicatorSeparator: () => null,
    }}
  />
</div>

{/* نوع العميل */}
<div className="col-span-1">
  <ReactSelect
    className="w-full text-sm"
    classNamePrefix="heroui"
    isDisabled={isViewMode}
    options={customerTypes.map((type) => ({
      value: type.id,
      label: type.type_name,
    }))}
    placeholder="نوع العميل"
    value={
      currentCustomer.cust_type
        ? {
            value: currentCustomer.cust_type,
            label: customerTypes.find((t) => t.id === currentCustomer.cust_type)?.type_name || "",
          }
        : null
    }
    onChange={(selectedOption) => {
      setCurrentCustomer({ ...currentCustomer, cust_type: selectedOption?.value || null });
    }}
    isSearchable
    menuPlacement="auto"
    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
    menuPosition="fixed"
    styles={{
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }}
    components={{
      IndicatorSeparator: () => null,
    }}
  />
</div>

      <Input isDisabled={isViewMode} label="المحصل" value={currentCustomer.handling || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, handling: e.target.value })} />

      <div className="col-span-3 text-lg font-bold border-b pb-2">معلومات إضافية</div>

      <Input isDisabled={isViewMode} label="مناولة (بالإنجليزي)" value={currentCustomer.handling_e || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, handling_e: e.target.value })} />
      <Input isDisabled={isViewMode} label="نسبة الخصم" type="number" value={currentCustomer.perc?.toString() || ""} onChange={(e) => setCurrentCustomer({ ...currentCustomer, perc: parseFloat(e.target.value) })} />

      <div className="flex gap-6 items-center col-span-3">
        <Checkbox isDisabled={isViewMode} isSelected={currentCustomer.expt || false} onValueChange={(val) => setCurrentCustomer({ ...currentCustomer, expt: val })}>مستثنى من كشف الأرصدة</Checkbox>
        <Checkbox isDisabled={isViewMode} isSelected={currentCustomer.cancel || false} onValueChange={(val) => setCurrentCustomer({ ...currentCustomer, cancel: val })}>ملغي</Checkbox>
      </div>
    </ModalBody>

    {modalMode !== "view" && (
      <ModalFooter className="flex justify-end gap-2">
        <Button color="danger" onPress={() => setIsModalOpen(false)}>إلغاء</Button>
        <Button color="success" onPress={handleSave}>{modalMode === "edit" ? "تحديث" : "حفظ"}</Button>
      </ModalFooter>
    )}
  </ModalContent>
</Modal>

    </div>
  );
}
