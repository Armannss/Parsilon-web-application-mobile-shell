import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildReportMetrics,
  getCategoryLabel,
  getRangeLabel,
  getStatusLabel,
  type ReportFilters,
  type ReportOrderItem,
} from "./report-utils";
import { loadPersianFontBase64 } from "./pdf-font";

type ExportArgs = {
  filteredOrders: ReportOrderItem[];
  filters: ReportFilters;
};

let fontReady = false;

function rtlText(value: string) {
  return value.split("").reverse().join("");
}

export async function exportSalesReportPdf({
  filteredOrders,
  filters,
}: ExportArgs) {
  const doc = new jsPDF();
  const metrics = buildReportMetrics(filteredOrders, filters.category);

  if (!fontReady) {
    const fontBase64 = await loadPersianFontBase64();
    doc.addFileToVFS("Vazirmatn-VariableFont_wght.ttf", fontBase64);
    doc.addFont("Vazirmatn-VariableFont_wght.ttf", "Vazirmatn", "normal");
    fontReady = true;
  }

  doc.setFont("Vazirmatn", "normal");

  doc.setFontSize(16);
  doc.text(rtlText("گزارش فروش پارسیلون پارت"), 195, 16, {
    align: "right",
  });

  doc.setFontSize(10);
  doc.text(
    rtlText(`تاریخ تولید گزارش: ${new Date().toLocaleString("fa-IR")}`),
    195,
    24,
    { align: "right" }
  );
  doc.text(rtlText(`بازه: ${getRangeLabel(filters.rangeType)}`), 195, 30, {
    align: "right",
  });
  doc.text(rtlText(`وضعیت: ${getStatusLabel(filters.status)}`), 195, 36, {
    align: "right",
  });
  doc.text(rtlText(`دسته: ${getCategoryLabel(filters.category)}`), 195, 42, {
    align: "right",
  });

  if (filters.rangeType === "custom") {
    doc.text(rtlText(`از تاریخ: ${filters.startDate || "-"}`), 195, 48, {
      align: "right",
    });
    doc.text(rtlText(`تا تاریخ: ${filters.endDate || "-"}`), 195, 54, {
      align: "right",
    });
  }

  autoTable(doc, {
    startY: filters.rangeType === "custom" ? 62 : 50,
    styles: {
      font: "Vazirmatn",
      fontSize: 10,
      halign: "right",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      halign: "right",
    },
    head: [[rtlText("مقدار"), rtlText("شاخص")]],
    body: [
      [metrics.totalOrders.toLocaleString("fa-IR"), rtlText("تعداد سفارش‌ها")],
      [metrics.totalItems.toLocaleString("fa-IR"), rtlText("تعداد اقلام فروخته‌شده")],
      [metrics.totalSales.toLocaleString("fa-IR"), rtlText("جمع فروش")],
      [metrics.averageOrderValue.toLocaleString("fa-IR"), rtlText("میانگین هر سفارش")],
      [rtlText(metrics.topCategory), rtlText("پرفروش‌ترین دسته")],
    ],
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    styles: {
      font: "Vazirmatn",
      fontSize: 10,
      halign: "right",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      halign: "right",
    },
    head: [[rtlText("فروش"), rtlText("تعداد"), rtlText("دسته")]],
    body:
      metrics.salesByCategoryList.length > 0
        ? metrics.salesByCategoryList.map((row) => [
            row.sales.toLocaleString("fa-IR"),
            row.qty.toLocaleString("fa-IR"),
            rtlText(row.label),
          ])
        : [["-", "-", rtlText("داده‌ای وجود ندارد")]],
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    styles: {
      font: "Vazirmatn",
      fontSize: 9,
      halign: "right",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      halign: "right",
    },
    head: [[
      rtlText("تاریخ"),
      rtlText("مبلغ"),
      rtlText("تعداد"),
      rtlText("شهر"),
      rtlText("مشتری"),
      rtlText("شماره سفارش"),
    ]],
    body:
      filteredOrders.length > 0
        ? filteredOrders.map((order) => [
            new Date(order.createdAt).toLocaleDateString("fa-IR"),
            order.total.toLocaleString("fa-IR"),
            order.itemCount.toLocaleString("fa-IR"),
            rtlText(order.customer.city || "-"),
            rtlText(order.customer.fullName || "-"),
            order.orderNumber,
          ])
        : [["-", "-", "-", "-", "-", rtlText("سفارشی وجود ندارد")]],
  });

  doc.save(`parsilon-sales-report-${Date.now()}.pdf`);
}