"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Input,
  Switch,
  Select,
  SelectItem,
  Card,
  CardBody,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getYearStartDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();

  return `${year}-01-01`;
};

export default function IncomeStatementClient() {
  const [advancedAnalysis, setAdvancedAnalysis] = useState(true);
  const [checkMode, setCheckMode] = useState(true);
  const [level, setLevel] = useState("7");
  const [period, setPeriod] = useState("");
  const [comparePeriod, setComparePeriod] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [startDate, setStartDate] = useState(getYearStartDate());
  const [endDate, setEndDate] = useState(getCurrentDate());

  // بيانات التقرير (سيتم استبدالها ببيانات حقيقية من API)
  const reportData = useMemo(() => {
    return {
      grossProfit: 0.0,
      netIncomeBeforeInterestTaxZakat: 0.0,
      netProfit: 0.0,
    };
  }, []);

  const resetFilters = () => {
    setAdvancedAnalysis(true);
    setCheckMode(true);
    setLevel("7");
    setPeriod("");
    setComparePeriod(false);
    setSelectedDate(getCurrentDate());
    setStartDate(getYearStartDate());
    setEndDate(getCurrentDate());
  };

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)}`;
  };

  return (
    <>
      {/* Filters */}
      <div className="responsive-filters mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              isSelected={advancedAnalysis}
              onValueChange={setAdvancedAnalysis}
              size="sm"
            />
            <span className="text-sm">تحليل متقدم</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              isSelected={checkMode}
              onValueChange={setCheckMode}
              size="sm"
            />
            <span className="text-sm flex items-center gap-1">
              <MagnifyingGlassIcon className="h-4 w-4" />
              فحص
            </span>
          </div>
          <Button
            className="btn-secondary"
            size="sm"
            onPress={resetFilters}
          >
            <ArrowPathIcon className="h-4 w-4" /> إعادة تعيين
          </Button>
          <Button className="btn-secondary" size="sm">
            <FunnelIcon className="h-4 w-4" /> بحث
          </Button>
          <Select
            size="sm"
            placeholder="المستوى 7"
            selectedKeys={level ? [level] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;

              setLevel(val);
            }}
            className="min-w-[120px]"
          >
            <SelectItem key="7" value="7">
              المستوى 7
            </SelectItem>
            <SelectItem key="6" value="6">
              المستوى 6
            </SelectItem>
            <SelectItem key="5" value="5">
              المستوى 5
            </SelectItem>
          </Select>
          <Select
            size="sm"
            placeholder="فترة"
            selectedKeys={period ? [period] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;

              setPeriod(val);
            }}
            className="min-w-[120px]"
          >
            <SelectItem key="monthly" value="monthly">
              شهري
            </SelectItem>
            <SelectItem key="quarterly" value="quarterly">
              ربع سنوي
            </SelectItem>
            <SelectItem key="yearly" value="yearly">
              سنوي
            </SelectItem>
          </Select>
          <Button
            className="btn-secondary"
            size="sm"
            onPress={() => setComparePeriod(!comparePeriod)}
          >
            {comparePeriod ? "✓" : ""} مقارنة بفترة سابقة
          </Button>
          <Input
            type="date"
            size="sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="min-w-[150px]"
          />
        </div>
      </div>

      {/* Report Content */}
      <Card>
        <CardBody>
          {/* Report Header */}
          <div className="text-center mb-6">
            <p className="text-lg text-gray-600 mb-2">NAJAH</p>
            <p className="text-sm text-gray-500">
              من {formatDate(startDate)} إلى {formatDate(endDate)}
            </p>
          </div>

          {/* Date Range Selectors */}
          <div className="mb-6 flex gap-4 justify-center">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">من تاريخ</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="min-w-[200px]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">إلى تاريخ</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="min-w-[200px]"
              />
            </div>
          </div>

          {/* Report Items */}
          <div className="space-y-4">
            {/* Date Column Header */}
            <div className="text-right text-gray-600 font-semibold mb-2">
              {formatDate(endDate)}
            </div>

            {/* Gross Profit */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-right text-gray-700">
                <div className="font-semibold">إجمالي الربح</div>
              </div>
              <div className="text-left font-bold">
                {formatCurrency(reportData.grossProfit)}
              </div>
            </div>

            {/* Net Income Before Interest, Tax, and Zakat */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-right text-gray-700">
                <div className="font-semibold">
                  صافي الدخل قبل الفوائد والضريبة والزكاة
                </div>
              </div>
              <div className="text-left font-bold">
                {formatCurrency(reportData.netIncomeBeforeInterestTaxZakat)}
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-right text-gray-700">
                <div className="font-semibold">صافي الربح</div>
              </div>
              <div className="text-left font-bold text-blue-600">
                {formatCurrency(reportData.netProfit)}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

