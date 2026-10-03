import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysAgo(days: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
}

function normalizeOrderStatus(status: string) {
  switch (status) {
    case "PENDING_REVIEW":
      return "pending_review";
    case "PROCESSING":
      return "processing";
    case "SHIPPED":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending_review";
  }
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const todayStart = startOfToday();
    const last7DaysStart = daysAgo(6);

    const [
      totalOrders,
      totalSalesAgg,
      todaySalesAgg,
      last7DaysSalesAgg,
      ordersByStatus,
      recentOrdersRaw,
      topProductsRaw,
      totalWholesaleRequests,
      openWholesaleRequests,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }),

      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
        _sum: {
          total: true,
        },
      }),

      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: last7DaysStart,
          },
        },
        _sum: {
          total: true,
        },
      }),

      prisma.order.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),

      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          itemCount: true,
          createdAt: true,
          customerName: true,
          customerPhone: true,
        },
      }),

      prisma.orderItem.groupBy({
        by: ["productSlug", "productName", "productCode"],
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),

      prisma.wholesaleRequest.count(),

      prisma.wholesaleRequest.count({
        where: {
          status: {
            in: ["NEW", "CONTACTED"],
          },
        },
      }),
    ]);

    const statusMap = {
      pending_review: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const item of ordersByStatus) {
      const normalized = normalizeOrderStatus(item.status);
      statusMap[normalized] = item._count.status;
    }

    const recentOrders = recentOrdersRaw.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: normalizeOrderStatus(order.status),
      total: order.total,
      itemCount: order.itemCount,
      createdAt: order.createdAt,
      customer: {
        fullName: order.customerName,
        phone: order.customerPhone,
      },
    }));

    const topProducts = topProductsRaw.map((item, index) => ({
      rank: index + 1,
      slug: item.productSlug,
      name: item.productName,
      code: item.productCode,
      quantitySold: item._sum.quantity || 0,
      revenue: item._sum.totalPrice || 0,
    }));

    return NextResponse.json({
      success: true,
      report: {
        summary: {
          totalOrders,
          totalSales: totalSalesAgg._sum.total || 0,
          todaySales: todaySalesAgg._sum.total || 0,
          last7DaysSales: last7DaysSalesAgg._sum.total || 0,
          totalWholesaleRequests,
          openWholesaleRequests,
        },
        orders: {
          byStatus: statusMap,
          recent: recentOrders,
        },
        products: {
          topSelling: topProducts,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);

    return NextResponse.json(
      { success: false, message: "خطا در دریافت گزارش‌ها" },
      { status: 500 }
    );
  }
}