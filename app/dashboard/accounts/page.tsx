"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem
} from "@heroui/react";
import { FaPlus } from "react-icons/fa";
import { API_BASE_URL } from "@/utilities/api";

interface Account {
  id: number;
  acc_id: string;
  acc_name: string;
  acc_name_e: string;
  parent: number | null;
  acc_type: number;
  acc_kind: number;
  acc_rep: number;
  acc_digit: number;
  acc_priv: number;
  acc_cat: number;
  acc_level: number;
  acc_vat: string;
  cur: number;
  acc_notes: string;
}

export default function AccountsTree() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Account>>({});
  const [currencies, setCurrencies] = useState<{ id: number; cur_name: string }[]>([]);

  const fetchAccounts = async () => {
    const res = await fetch(`${API_BASE_URL}accounts_list`);
    const data = await res.json();
    setAccounts(data);
  };

  const fetchCurrencies = async () => {
    const res = await fetch(`${API_BASE_URL}currencies_list/`);
    const data = await res.json();
    setCurrencies(data);
  };

  useEffect(() => {
    fetchAccounts();
    fetchCurrencies();
  }, []);

  const buildTree = (parentId: number | null): JSX.Element[] => {
    return accounts
      .filter((acc) => acc.parent === parentId)
      .map((acc) => (
        <li key={acc.id} className="relative ml-4">
          <span
            onClick={() => setSelectedParentId(acc.id)}
            className="inline-block cursor-pointer hover:bg-gray-200 px-2 rounded transition"
          >
            ▶ {acc.acc_name}
          </span>
          <ul className="ml-4 pl-4 border-l">{buildTree(acc.id)}</ul>
        </li>
      ));
  };

  const handleAddAccount = () => {
    setFormData({
      parent: selectedParentId ?? null,
      acc_type: selectedParentId ? 2 : 1,
      acc_level:
        (accounts.find((a) => a.id === selectedParentId)?.acc_level || 0) + 1,
    });
    setIsModalOpen(true);
  };

  const handleChange = (key: keyof Account, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}api_create_account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        alert("حدث خطأ أثناء الإضافة");
        return;
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (error) {
      console.error("حدث خطأ:", error);
      alert("فشل في الاتصال بالخادم");
    }
  };

  return (
    <div className="p-4 font-cairo">
      <div className="flex items-center justify-between mb-4">
        <Input placeholder="بحث عن حساب..." className="w-60" />
        <Button onPress={handleAddAccount}>
          <FaPlus className="ml-2" /> إضافة حساب جديد
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="w-1/3 border p-3 rounded">
          <h2 className="text-lg font-bold mb-3">شجرة الحسابات</h2>
          <ul className="list-none">
            <li>
              <span
                onClick={() => setSelectedParentId(null)}
                className="font-bold cursor-pointer text-blue-600"
              >
                دليل الحسابات
              </span>
              <ul className="ml-4 border-l pl-4">{buildTree(null)}</ul>
            </li>
          </ul>
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-bold mb-3">تفاصيل الحسابات الفرعية</h2>
          <table className="table w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th>رقم</th>
                <th>الاسم</th>
                <th>التقرير</th>
                <th>النوع</th>
              </tr>
            </thead>
            <tbody>
              {accounts
                .filter((acc) => acc.parent === selectedParentId)
                .map((acc) => (
                  <tr key={acc.id} className="border-t">
                    <td>{acc.acc_id}</td>
                    <td>{acc.acc_name}</td>
                    <td>{acc.acc_rep === 1 ? "الأرباح والخسائر" : "الميزانية العمومية"}</td>
                    <td>{acc.acc_type === 1 ? "رئيسي" : "فرعي"}</td>
                  </tr>
                ))}
              {accounts.filter((acc) => acc.parent === selectedParentId).length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-2">
                    لا توجد حسابات فرعية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          <ModalHeader>إضافة حساب جديد</ModalHeader>
          <ModalBody className="grid grid-cols-2 gap-4">
            <Input label="اسم الحساب" value={formData.acc_name || ""} onChange={(e) => handleChange("acc_name", e.target.value)} />
            <Input label="اسم الحساب بالإنجليزي" value={formData.acc_name_e || ""} onChange={(e) => handleChange("acc_name_e", e.target.value)} />
            <Input label="رقم الحساب" value={formData.acc_id || ""} onChange={(e) => handleChange("acc_id", e.target.value)} />
            <Select label="العملة" selectedKeys={[String(formData.cur || "")]} onSelectionChange={(keys) => handleChange("cur", Number([...keys][0]))}>
              {currencies.map((c) => (
                <SelectItem key={c.id}>{c.cur_name}</SelectItem>
              ))}
            </Select>
            <Input label="المستوى" value={formData.acc_level?.toString() || ""} onChange={(e) => handleChange("acc_level", Number(e.target.value))} />
            <Input label="التقرير" value={formData.acc_rep?.toString() || "1"} onChange={(e) => handleChange("acc_rep", Number(e.target.value))} />
            <Input label="النوع" value={formData.acc_type?.toString() || "1"} onChange={(e) => handleChange("acc_type", Number(e.target.value))} />
            <Input label="الطبيعة" value={formData.acc_kind?.toString() || "1"} onChange={(e) => handleChange("acc_kind", Number(e.target.value))} />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={() => setIsModalOpen(false)}>إلغاء</Button>
            <Button color="success" onPress={handleSave}>حفظ</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
