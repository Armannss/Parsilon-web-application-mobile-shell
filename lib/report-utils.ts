export type ReportRangeType =
  | "all"
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

export type ReportStatusFilter =
  | "all"
  | "pending_review"
  | "processing"
  | "shipped"
  | "delivered";

export type ReportCategoryFilter = "all" | "bearing" | "brake-parts";

export type ReportOrderStatus =
  | "pending_review"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ReportOrderItem = {
  orderNumber: string;
  createdAt: string;
  status: ReportOrderStatus;
  customer: {
    fullName: string;
    city: string;
  };
  items: {
    id: string | number;
    name: string;
    code: string;
    price: string;
    image: string;
    slug: string;
    quantity: number;
    brand?: string;
    category?: string;
  }[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
};

export type ReportFilters = {
  rangeType: ReportRangeType;
  status: ReportStatusFilter;
  category: ReportCategoryFilter;
  startDate?: string;
  endDate?: string;
};

function startOfToday(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parseLocalDateInput(value?: string, endOfDay = false) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function parsePrice(price?: string) {
  if (!price || price.includes("تماس")) return 0;

  const englishDigits = price
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^\d]/g, "");

  return Number(englishDigits || 0);
}

function getCategoryDisplayLabel(category?: string) {
  if (category === "bearing") return "بلبرینگ";
  if (category === "brake-parts") return "قطعات ترمز";
  return "نامشخص";
}

export function filterOrdersForReport(
  orders: ReportOrderItem[],
  filters: ReportFilters
) {
  const now = new Date();
  const todayStart = startOfToday(now);

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);

  const monthStart = new Date(todayStart);
  monthStart.setDate(todayStart.getDate() - 29);

  const customStart = parseLocalDateInput(filters.startDate, false);
  const customEnd = parseLocalDateInput(filters.endDate, true);

  return orders.filter((order) => {
    const createdAt = new Date(order.createdAt);

    let matchesRange = true;

    if (filters.rangeType === "daily") {
      matchesRange = createdAt >= todayStart;
    } else if (filters.rangeType === "weekly") {
      matchesRange = createdAt >= weekStart;
    } else if (filters.rangeType === "monthly") {
      matchesRange = createdAt >= monthStart;
    } else if (filters.rangeType === "custom") {
      matchesRange =
        (!customStart || createdAt >= customStart) &&
        (!customEnd || createdAt <= customEnd);
    }

    const matchesStatus =
      filters.status === "all" ? true : order.status === filters.status;

    const matchesCategory =
      filters.category === "all"
        ? true
        : order.items.some((item) => item.category === filters.category);

    return matchesRange && matchesStatus && matchesCategory;
  });
}

export function buildReportMetrics(
  filteredOrders: ReportOrderItem[],
  categoryFilter: ReportCategoryFilter
) {
  const totalOrders = filteredOrders.length;
  const totalItems = filteredOrders.reduce(
    (sum, order) => sum + order.itemCount,
    0
  );
  const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue =
    totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  const salesByCategory = filteredOrders.reduce<
    Record<
      string,
      {
        label: string;
        qty: number;
        sales: number;
      }
    >
  >((acc, order) => {
    order.items.forEach((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return;

      const key = item.category || "unknown";
      const label = getCategoryDisplayLabel(item.category);

      if (!acc[key]) {
        acc[key] = { label, qty: 0, sales: 0 };
      }

      acc[key].qty += item.quantity;
      acc[key].sales += parsePrice(item.price) * item.quantity;
    });

    return acc;
  }, {});

  const salesByCategoryList = Object.values(salesByCategory).sort(
    (a, b) => b.sales - a.sales
  );

  const topCategory = salesByCategoryList[0]?.label || "ندارد";

  const salesByProductMap = filteredOrders.reduce<
    Record<
      string,
      {
        name: string;
        code: string;
        category: string;
        qty: number;
        unitPrice: number;
        sales: number;
      }
    >
  >((acc, order) => {
    order.items.forEach((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return;

      const key = `${item.code}__${item.slug}`;
      const unitPrice = parsePrice(item.price);

      if (!acc[key]) {
        acc[key] = {
          name: item.name,
          code: item.code,
          category: getCategoryDisplayLabel(item.category),
          qty: 0,
          unitPrice,
          sales: 0,
        };
      }

      acc[key].qty += item.quantity;
      acc[key].sales += unitPrice * item.quantity;
    });

    return acc;
  }, {});

  const salesByProductList = Object.values(salesByProductMap).sort(
    (a, b) => b.sales - a.sales
  );

  const topProduct = salesByProductList[0]?.name || "ندارد";

  return {
    totalOrders,
    totalItems,
    totalSales,
    averageOrderValue,
    topCategory,
    topProduct,
    salesByCategoryList,
    salesByProductList,
  };
}

export function getRangeLabel(rangeType: ReportRangeType) {
  switch (rangeType) {
    case "daily":
      return "روزانه";
    case "weekly":
      return "هفتگی";
    case "monthly":
      return "ماهانه";
    case "custom":
      return "بازه دلخواه";
    default:
      return "همه بازه‌ها";
  }
}

export function getStatusLabel(status: ReportStatusFilter) {
  switch (status) {
    case "pending_review":
      return "در انتظار بررسی";
    case "processing":
      return "در حال پردازش";
    case "shipped":
      return "ارسال شده";
    case "delivered":
      return "تحویل شده";
    default:
      return "همه وضعیت‌ها";
  }
}

export function getCategoryLabel(category: ReportCategoryFilter) {
  switch (category) {
    case "bearing":
      return "بلبرینگ";
    case "brake-parts":
      return "قطعات ترمز";
    default:
      return "همه دسته‌ها";
  }
}