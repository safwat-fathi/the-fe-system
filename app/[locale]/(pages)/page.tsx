import { cookies } from "next/headers";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import DashboardClient from "./components/DashboardClient";

import { StatCard } from "@/components/Card";
import Breadcrumb from "@/components/Breadcrumb";
import dashboardService from "@/services/bff/dashboard.service";

// Revalidate dashboard data every 60 seconds (1 minute)
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("dashboard");

	return {
		title: t("title"),
	};
}

export default async function DashboardPage() {
	const t = await getTranslations("dashboard");

	// Get branch and year from localStorage (now using cookies as a fallback)
	const cookieStore = await cookies();

	const branch = cookieStore.get("selectedBranch")?.value || "";
	const year = cookieStore.get("selectedYear")?.value || "";

	const dashboardData = await dashboardService.getDashboardStats();

	if (!dashboardData) throw new Error(t("error"));

	// Fill in missing monthly sales data with zeros
	// const monthlySales =
	//   dashboardData.monthlySales.length === 12
	//     ? dashboardData.monthlySales
	//     : new Array(12).fill(0);

	const salesChartData = {
		labels: [
			t("months.jan"),
			t("months.feb"),
			t("months.mar"),
			t("months.apr"),
			t("months.may"),
			t("months.jun"),
			t("months.jul"),
			t("months.aug"),
			t("months.sep"),
			t("months.oct"),
			t("months.nov"),
			t("months.dec"),
		],
		datasets: [
			{
				label: t("salesDataset"),
				// data: monthlySales,
				fill: false,
				borderColor: "#3b82f6",
				backgroundColor: "rgba(59, 130, 246, 0.1)",
				tension: 0.1,
			},
		],
	};

	return (
		<div className="font-cairo space-y-8">
			<Breadcrumb showHome={false} />
			{/* Header */}
			<div className="space-y-2">
				<h1 className="text-3xl font-bold text-gray-800">{t("title")}</h1>
				<div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg inline-block">
					{t("summary", {
						branch: branch || t("summaryPlaceholder"),
						year: year || t("summaryPlaceholder"),
					})}
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatCard
					href="/reports/invoices"
					icon="🧾"
					title={t("invoices")}
					value={dashboardData.invoices?.count || 0}
				/>
				<StatCard
					href="/basic/customers"
					icon="👥"
					title={t("customers")}
					value={dashboardData.customerCount}
				/>
				<StatCard
					href="/basic/items"
					icon="📦"
					title={t("items")}
					value={dashboardData.itemCount}
				/>
				<StatCard
					href="/basic/categories"
					icon="🏷️"
					title={t("categories")}
					value={dashboardData.categoryCount}
				/>
			</div>

			{/* Gold Price Card */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<StatCard
					icon="💰"
					title={t("goldPrice")}
					value={
						dashboardData.goldPrice
							? `${dashboardData.goldPrice} ﷼`
							: t("summaryPlaceholder")
					}
				/>
			</div>

			{/* Pass data to client component for interactive charts */}

			<DashboardClient
				branch={branch}
				invoices={dashboardData.invoices?.results || []}
				salesChartData={salesChartData}
				year={year}
			/>
		</div>
	);
}
