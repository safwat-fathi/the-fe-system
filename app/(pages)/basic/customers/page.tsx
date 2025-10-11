"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactSelect from "react-select";
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
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

import customerService from "@/services/api/customer.service";
import { API_BASE_URL } from "@/utilities/api";
import ActionButtons from "@/components/ActionButtons";
import type { Customer as CustomerModel } from "@/types/models/customer";
// import { handleLanguageChange } from "@/utilities/global";

interface CustomerFull {
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
  cust_status: number;
  acc?: number;
  acc_name?: string;
  cust_type?: number;
  box_type: string;
  handling: string;
  handling_e?: string;
  perc?: number;
  expt?: boolean;
  hide?: boolean;
}

interface CustomerType {
  id: number;
  type_name: string;
}

// URLs للبيانات المساعدة (سيتم تحديثها لاحقاً)
const cust_type_URL = `${API_BASE_URL}cust_type_list`;
const ACCOUNTS_URL = `${API_BASE_URL}getAccounts`;
const BOX_TYPE_URL = `${API_BASE_URL}getBoxTypeList`;
const Max_CustID_URL = `${API_BASE_URL}api_max_Cust_id`;
const Cust_Status_URL = `${API_BASE_URL}getCustomerStatus`;
const codec_Desc_URL = (type_id: number, id: number) =>
  `${API_BASE_URL}getCodecDesc/${type_id},${id}`;

const columns = [
  { name: "كود العميل", uid: "cust_code" },
  { name: "الاسم", uid: "cust_name" },
  { name: "الاسم بالإنجليزي", uid: "cust_name_e" },
  { name: "الجوال", uid: "mobile" },
  { name: "البريد الإلكتروني", uid: "email" },
  { name: "الحالة", uid: "cust_status" },
  { name: "", uid: "actions" },
];

export default function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [customerStatus, setCustomerStatus] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [boxTypes, setBoxTypes] = useState<any[]>([]);
  const [maxCustId, setMaxCustId] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
  const [custTypeFilter, setCustTypeFilter] = useState<number | null>(null);
  const router = useRouter();
  const rowsPerPage = 12;

  const loadCustomers = useCallback(async () => {
    try {
      const data = await customerService.getAllCustomers();
      setCustomers(data as any);
    } catch (error) {
      console.error("فشل في جلب العملاء:", error);
      setCustomers([]);
    }
  }, []);

  const loadMetaData = useCallback(async () => {
    try {
      // TODO: إنشاء خدمات منفصلة للبيانات المساعدة أو استخدام apiFetch مع التوكن
      // const types = await fetchData(cust_type_URL);
      // const custsResponse = await fetchData(Cust_Status_URL);
      // const accs = await fetchData(ACCOUNTS_URL);
      // const boxesResponse = await fetchData(BOX_TYPE_URL);
      // const CustId = await fetchData(Max_CustID_URL);

      // setCustomerTypes(types as any[]);
      // setCustomerStatus(custs);
      // setAccounts(accs as any[]);
      // setBoxTypes(boxes);
      // setMaxCustId(CustId as any);
    } catch (error) {
      console.error("فشل في جلب البيانات المساعدة:", error);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
    loadMetaData();
  }, [loadCustomers, loadMetaData]);

  const handleSave = async () => {
    try {
      // ✅ استخدم نسخة محلية بدلاً من setState
      let updatedCustomer = { ...currentCustomer };

      if (!updatedCustomer.id) {
        // updatedCustomer.cust_code = String((maxCustId as any).id__max);
      }

      if (!updatedCustomer.cust_code) {
        updatedCustomer.cust_code = updatedCustomer.id
          ? String(updatedCustomer.id)
          : "";
      }

      const { acc_name, ...rest } = updatedCustomer;
      const cleanedCustomer = {
        ...rest,
        acc: Number(updatedCustomer.acc) || null,
        vat_no: Number(updatedCustomer.vat_no) || null,
        cr_no: Number(updatedCustomer.cr_no) || null,
        perc: Number(updatedCustomer.perc) || null,
        cust_type: Number(updatedCustomer.cust_type) || null,
        expt: !!updatedCustomer.expt,
        hide: !!updatedCustomer.hide,
        post_code: updatedCustomer.post_code || "",
      };

      const custTypeElement = document.getElementById(
        "cust_type",
      ) as HTMLElement | null;

      if (!cleanedCustomer.cust_type) {
        toast.error("⚠️ يرجى إدخال نوع العميل");
        if (custTypeElement) {
          custTypeElement.focus();
        }

        return;
      }

      const result =
        modalMode === "edit" && currentCustomer.id
          ? await customerService.updateCustomer(currentCustomer.id, cleanedCustomer)
          : await customerService.createCustomer(cleanedCustomer);

      if (result) {
        toast.success(
          modalMode === "edit"
            ? "✅ تم تعديل العميل بنجاح"
            : "✅ تم إضافة العميل بنجاح",
        );
        setIsModalOpen(false);
        loadCustomers();
      } else {
        toast.error("❌ فشل في العملية");
      }
    } catch (error) {
      toast.error("❌ حدث خطأ أثناء الحفظ");
    }
  };

  const renderActions = (cust: Customer) => (
    <div className="flex gap-2">
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("view", cust)}
      >
        <EyeIcon className="h-4 w-4 text-blue-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        onPress={() => openModal("edit", cust)}
      >
        <PencilIcon className="h-4 w-4 text-yellow-500" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        color="danger"
        onPress={() => handleDelete(cust.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد أنك تريد حذف هذا العميل؟")) return;
    try {
      const result = await customerService.deleteCustomer(id);

      if (result) {
        toast.success("✅ تم حذف العميل بنجاح");
        loadCustomers();
      } else {
        toast.error("❌ فشل في حذف العميل");
      }
    } catch (error) {
      toast.error("❌ حدث خطأ أثناء الحذف");
    }
  };

const filteredCustomers = useMemo(() => {
  const searchLower = search.toLowerCase();

  return customers.filter((c) => {
    const fieldsToSearch = [
      c.cust_code?.toString(),
      c.cust_name,
      c.cust_name_e,
      c.mobile?.toString(),
      c.email,
      c.vat_no?.toString(),
      c.cr_no?.toString(),
      c.phone,
      c.fax,
      c.address,
      c.gov,
      c.city,
      c.area,
      c.street,
      c.build_no,
      c.post_code,
      c.handling,
    ];

    return (
      fieldsToSearch.some((field) =>
        field?.toString().toLowerCase().includes(searchLower),
      ) &&
      (!custTypeFilter || c.cust_type === custTypeFilter)
    );
  });
}, [customers, search, custTypeFilter]);


  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  const openModal = (
    mode: "add" | "edit" | "view",
    customer: Partial<Customer> = {},
  ) => {
    setModalMode(mode);
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  const isViewMode = modalMode === "view";

  return (
    <div className="responsive-container font-cairo">
      <h1 className="responsive-text-xl font-bold mb-4">العملاء</h1>
      <div className="responsive-filters">
        <Button onPress={() => openModal("add")}>
          {" "}
          <PlusIcon className="h-4 w-4" /> إضافة عميل{" "}
        </Button>
        <div className="responsive-search-group">
          <Select
            className="w-60"
            placeholder="فرز حسب نوع العميل"
            aria-label="اختيار نوع العميل للفرز"
            selectedKeys={
              custTypeFilter !== null ? [String(custTypeFilter)] : ["all"]
            }
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0];

              setCustTypeFilter(key === "all" ? null : Number(key));
            }}
          >
            <SelectItem key="all" textValue="الكل">
              الكل
            </SelectItem>
            {customerTypes.map((type) => (
              <SelectItem key={String(type.id)} textValue={type.type_name}>
                {type.type_name}
              </SelectItem>
            ))}
          </Select>

          <Tooltip content="إدارة أنواع العملاء">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={() => router.push("/basic/cust_type")}
            >
              +
            </Button>
          </Tooltip>

          <Input
            className="responsive-search"
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="responsive-table">
        <Table aria-label="جدول العملاء">
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {paginatedCustomers.map((cust) => (
            <TableRow key={cust.id}>
              <TableCell>{cust.cust_code}</TableCell>
              <TableCell>{cust.cust_name}</TableCell>
              <TableCell>{cust.cust_name_e}</TableCell>
              <TableCell>{cust.mobile}</TableCell>
              <TableCell>{cust.email}</TableCell>
              <TableCell>
                {customerStatus.find((t) => t.code_id === cust.cust_status)
                  ?.code_desc || "-"}
              </TableCell>
              <TableCell>{renderActions(cust)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>

      <div className="responsive-pagination">
        <span>عدد العملاء: {filteredCustomers.length}</span>
        <Pagination
          color="primary"
          page={page}
          total={Math.ceil(filteredCustomers.length / rowsPerPage)}
          onChange={setPage}
        />
      </div>

      <Modal
        backdrop="opaque"
        isDismissable={false}
        isOpen={isModalOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={() => setIsModalOpen(false)}
      >
        <ModalContent className="font-cairo">
          <ModalHeader>
            {modalMode === "add" && "إضافة عميل"}
            {modalMode === "edit" && "تعديل عميل"}
            {modalMode === "view" && "عرض بيانات العميل"}
          </ModalHeader>

          <ModalBody className="grid grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto pr-2">
            <div className="col-span-3 text-lg font-bold border-b pb-2">
              البيانات الأساسية
            </div>

            <Input
              isDisabled={isViewMode}
              label="كود العميل"
              value={currentCustomer.cust_code || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  cust_code: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="اسم العميل"
              value={currentCustomer.cust_name || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  cust_name: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="اسم العميل بالإنجليزي"
              value={currentCustomer.cust_name_e || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  cust_name_e: e.target.value,
                })
              }
              // onFocus={handleLanguageChange}
            />
            <Input
              isDisabled={isViewMode}
              label="الجوال"
              value={currentCustomer.mobile?.toString() || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  mobile: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="البريد الإلكتروني"
              value={currentCustomer.email || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  email: e.target.value,
                })
              }
              // onFocus={handleLanguageChange}
            />
            <Input
              isDisabled={isViewMode}
              label="الرقم الضريبي"
              value={currentCustomer.vat_no?.toString() || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  vat_no: Number(e.target.value),
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="رقم السجل التجاري"
              value={currentCustomer.cr_no?.toString() || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  cr_no: Number(e.target.value),
                })
              }
            />

            <div className="col-span-3 text-lg font-bold border-b pb-2">
              العناوين والتواصل
            </div>

            <Input
              isDisabled={isViewMode}
              label="هاتف المنزل"
              value={currentCustomer.phone || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  phone: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الفاكس"
              value={currentCustomer.fax || ""}
              onChange={(e) =>
                setCurrentCustomer({ ...currentCustomer, fax: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="العنوان"
              value={currentCustomer.address || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  address: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المحافظة"
              value={currentCustomer.gov || ""}
              onChange={(e) =>
                setCurrentCustomer({ ...currentCustomer, gov: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المدينة"
              value={currentCustomer.city || ""}
              onChange={(e) =>
                setCurrentCustomer({ ...currentCustomer, city: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المنطقة"
              value={currentCustomer.area || ""}
              onChange={(e) =>
                setCurrentCustomer({ ...currentCustomer, area: e.target.value })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الشارع"
              value={currentCustomer.street || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  street: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="المبنى"
              value={currentCustomer.build_no || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  build_no: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="الرمز البريدي"
              value={currentCustomer.post_code || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  post_code: e.target.value,
                })
              }
            />

            <div className="col-span-3 text-lg font-bold border-b pb-2">
              الحسابات والتصنيفات
            </div>

            {/* رقم الحساب / اسم الحساب */}
            <div className="col-span-2">
              <ReactSelect
                isSearchable
                className="w-full text-sm"
                classNamePrefix="heroui"
                components={{
                  IndicatorSeparator: () => null,
                }}
                isDisabled={isViewMode}
                menuPlacement="auto"
                menuPortalTarget={
                  typeof window !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.id} - ${acc.acc_name}`,
                }))}
                placeholder="رقم الحساب / اسم الحساب"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                value={
                  currentCustomer.acc
                    ? (() => {
                        const selectedAcc = accounts.find(
                          (acc) => acc.id === currentCustomer.acc,
                        );

                        return selectedAcc
                          ? {
                              value: selectedAcc.id,
                              label: `${selectedAcc.id} - ${selectedAcc.acc_name}`,
                            }
                          : {
                              value: currentCustomer.acc,
                              label: `${currentCustomer.acc} - ${currentCustomer.acc_name || ""}`,
                            };
                      })()
                    : null
                }
                onChange={(selectedOption) => {
                  const accObj = accounts.find(
                    (acc) => acc.id === selectedOption?.value,
                  );

                  if (accObj) {
                    setCurrentCustomer({
                      ...currentCustomer,
                      acc: accObj.id,
                      acc_name: accObj.acc_name,
                    });
                  }
                }}
              />
            </div>

            {/* نوع الصندوق */}
            <div className="col-span-1">
              <ReactSelect
                isSearchable
                className="w-full text-sm"
                classNamePrefix="heroui"
                components={{
                  IndicatorSeparator: () => null,
                }}
                isDisabled={isViewMode}
                menuPlacement="auto"
                menuPortalTarget={
                  typeof window !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                options={boxTypes.map((box) => ({
                  value: box.code_id,
                  label: box.code_desc,
                }))}
                placeholder="نوع الصندوق"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                value={
                  currentCustomer.box_type
                    ? {
                        value: currentCustomer.box_type,
                        label:
                          boxTypes.find(
                            (b) => b.code_id === currentCustomer.box_type,
                          )?.code_desc || "",
                      }
                    : null
                }
                onChange={(selectedOption) => {
                  setCurrentCustomer({
                    ...currentCustomer,
                    box_type: selectedOption?.value || "",
                  });
                }}
              />
            </div>

            {/* نوع العميل */}
            <div className="col-span-1">
              <ReactSelect
                isSearchable
                className="w-full text-sm"
                classNamePrefix="heroui"
                components={{
                  IndicatorSeparator: () => null,
                }}
                isDisabled={isViewMode}
                menuPlacement="auto"
                menuPortalTarget={
                  typeof window !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                options={customerTypes.map((type) => ({
                  value: type.id,
                  label: type.type_name,
                }))}
                placeholder="نوع العميل"
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                value={
                  currentCustomer.cust_type
                    ? {
                        value: currentCustomer.cust_type,
                        label:
                          customerTypes.find(
                            (t) => t.id === currentCustomer.cust_type,
                          )?.type_name || "",
                      }
                    : null
                }
                onChange={(selectedOption) => {
                  setCurrentCustomer({
                    ...currentCustomer,
                    cust_type: selectedOption?.value as number || undefined,
                  });
                }}
              />
            </div>

            <Input
              isDisabled={isViewMode}
              label="المحصل"
              value={currentCustomer.handling || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  handling: e.target.value,
                })
              }
            />

            <div className="col-span-3 text-lg font-bold border-b pb-2">
              معلومات إضافية
            </div>

            <Input
              isDisabled={isViewMode}
              label="مناولة (بالإنجليزي)"
              value={currentCustomer.handling_e || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  handling_e: e.target.value,
                })
              }
            />
            <Input
              isDisabled={isViewMode}
              label="نسبة الخصم"
              type="number"
              value={currentCustomer.perc?.toString() || ""}
              onChange={(e) =>
                setCurrentCustomer({
                  ...currentCustomer,
                  perc: parseFloat(e.target.value),
                })
              }
            />

            {/* حالة العميل */}
            <div className="col-span-1">
              <ReactSelect
                isSearchable
                className="w-full text-sm"
                classNamePrefix="heroui"
                components={{
                  IndicatorSeparator: () => null,
                }}
                isDisabled={isViewMode}
                menuPlacement="auto"
                menuPortalTarget={
                  typeof window !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                options={customerStatus.map((cust1) => ({
                  value: cust1.code_id,
                  label: cust1.code_desc,
                }))}
                placeholder="حالة العميل "
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                value={
                  currentCustomer.cust_status
                    ? {
                        value: currentCustomer.cust_status,
                        label:
                          customerStatus.find(
                            (b) => b.code_id === currentCustomer.cust_status,
                          )?.code_desc || "",
                      }
                    : null
                }
                onChange={(selectedOption) => {
                  setCurrentCustomer({
                    ...currentCustomer,
                    cust_status: selectedOption?.value as number || 0,
                  });
                }}
              />
            </div>

            <div className="flex gap-6 items-center col-span-3">
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentCustomer.expt)}
                onValueChange={(val) =>
                  setCurrentCustomer({ ...currentCustomer, expt: val })
                }
              >
                مستثنى من كشف الأرصدة
              </Checkbox>
              <Checkbox
                isDisabled={isViewMode}
                isSelected={Boolean(currentCustomer.hide)}
                onValueChange={(val) =>
                  setCurrentCustomer({ ...currentCustomer, hide: val })
                }
              >
                مخفي{" "}
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
    </div>
  );
}
