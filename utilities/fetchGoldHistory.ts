// // fetchGoldHistory.ts

// export async function fetchGoldPriceByDate(date: string) {
//   const token =
//     process.env.NEXT_PUBLIC_GOLD_API_TOKEN || "goldapi-5chasmbzw52m3-io";
//   const headers = new Headers();
//   headers.append("x-access-token", token);
//   headers.append("Content-Type", "application/json");

//   const url = `https://www.goldapi.io/api/XAU/SAR/${date}`; // date format: YYYYMMDD

//   try {
//     const response = await fetch(url, {
//       method: "GET",
//       headers,
//     });

//     if (!response.ok) throw new Error("فشل في جلب بيانات الذهب للتاريخ المحدد");

//     const data = await response.json();
//     return {
//       date,
//       price: data.price_gram_24k,
//     };
//   } catch (error) {
//     console.error("Error fetching gold price by date:", error);
//     return null;
//   }
// }

// export async function fetchGoldHistoryRange(start: string, end: string) {
//   const startDate = new Date(start);
//   const endDate = new Date(end);

//   const results: { date: string; price: number }[] = [];

//   for (
//     let d = new Date(startDate);
//     d <= endDate;
//     d.setDate(d.getDate() + 1)
//   ) {
//     const dateStr = d.toISOString().split("T")[0].replace(/-/g, "");
//     const result = await fetchGoldPriceByDate(dateStr);
//     if (result) results.push(result);
//     await new Promise((r) => setTimeout(r, 800)); // delay to avoid API rate limits
//   }

//   return results;
// }
