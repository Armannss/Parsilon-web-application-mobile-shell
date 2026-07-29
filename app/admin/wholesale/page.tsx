"use client";

import { useEffect, useMemo, useState } from "react";

type WholesaleStatus = "NEW" | "CONTACTED" | "CLOSED";
type StatusFilter = "all" | WholesaleStatus;

type WholesaleRequestItem = {
  id: string;
  fullName: string;
  phone: string;
  companyName: string;
  description: string;
  status: WholesaleStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
};

function getWholesaleStatusMeta(status: WholesaleStatus) {
  switch (status) {
    case "NEW":
      return {
        label: "جدید",
        badgeClass: "bg-amber-50 text-amber-700",
      };
    case "CONTACTED":
      return {
        label: "تماس گرفته شده",
        badgeClass: "bg-blue-50 text-blue-700",
      };
    case "CLOSED":
      return {
        label: "بسته شده",
        badgeClass: "bg-emerald-50 text-emerald-700",
      };
    default:
      return {
        label: "جدید",
        badgeClass: "bg-amber-50 text-amber-700",
      };
  }
}

export default function AdminWholesalePage() {
  const [requests, setRequests] = useState<WholesaleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/wholesale", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !Array.isArray(data?.requests)) {
        throw new Error(data?.message || "دریافت درخواست‌های عمده انجام نشد.");
      }

      const mapped: WholesaleRequestItem[] = data.requests.map((item: any) => ({
        id: item.id,
        fullName: item.fullName || "",
        phone: item.phone || "",
        companyName: item.companyName || "",
        description: item.description || "",
        status: item.status as WholesaleStatus,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        user: item.user
          ? {
              id: item.user.id,
              fullName: item.user.fullName,
              phone: item.user.phone,
            }
          : null,
      }));

      setRequests(mapped);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "خطا در دریافت درخواست‌های عمده.";
      setErrorMessage(message);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    nextStatus: WholesaleStatus
  ) => {
    try {
      setIsUpdatingId(id);
      setErrorMessage("");

      const response = await fetch(`/api/admin/wholesale/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "به‌روزرسانی وضعیت انجام نشد.");
      }

      setRequests((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "خطا در تغییر وضعیت درخواست.";
      setErrorMessage(message);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim();

    return requests.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        item.fullName.includes(normalizedSearch) ||
        item.phone.includes(normalizedSearch) ||
        item.companyName.includes(normalizedSearch) ||
        item.description.includes(normalizedSearch) ||
        item.user?.fullName.includes(normalizedSearch) ||
        item.user?.phone.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, search]);

  return (
    <main className="px-4 py-4 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">
          مدیریت درخواست‌های عمده
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          اینجا می‌توانی درخواست‌های خرید عمده را ببینی، جستجو کنی و وضعیت آن‌ها
          را تغییر بدهی.
        </p>
      </section>

      {errorMessage ? (
        <section className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="text-sm font-extrabold text-red-700">
            خطا در پردازش
          </div>
          <p className="mt-2 text-sm leading-7 text-red-600">{errorMessage}</p>
        </section>
      ) : null}

      <section className="mt-5 space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-bold text-slate-500">
            جستجو
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="نام، شماره تماس، شرکت یا توضیحات"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-bold text-slate-500">
            فیلتر وضعیت
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
          >
            <option value="all">همه درخواست‌ها</option>
            <option value="NEW">جدید</option>
            <option value="CONTACTED">تماس گرفته شده</option>
            <option value="CLOSED">بسته شده</option>
          </select>
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">
            لیست درخواست‌ها
          </h2>
          <span className="text-sm text-slate-500">
            {filteredRequests.length} درخواست
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-900">
                در حال دریافت درخواست‌ها...
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                چند لحظه صبر کن.
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-sm font-bold text-slate-900">
                درخواستی با این فیلتر پیدا نشد
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                فیلتر وضعیت یا عبارت جستجو را تغییر بده.
              </p>
            </div>
          ) : (
            filteredRequests.map((item) => {
              const statusMeta = getWholesaleStatusMeta(item.status);
              const isUpdating = isUpdatingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {item.fullName}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString("fa-IR")}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">شماره تماس</span>
                      <span className="font-bold text-slate-900">
                        {item.phone || "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">شرکت / فروشگاه</span>
                      <span className="font-bold text-slate-900">
                        {item.companyName || "-"}
                      </span>
                    </div>

                    {item.user ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">کاربر ثبت‌کننده</span>
                        <span className="font-bold text-slate-900">
                          {item.user.fullName}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <div className="mb-2 text-xs font-bold text-slate-500">
                      توضیحات درخواست
                    </div>
                    <div className="whitespace-pre-line text-sm leading-7 text-slate-700">
                      {item.description || "توضیحی ثبت نشده است."}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-bold text-slate-500">
                      تغییر وضعیت
                    </label>

                    <select
                      value={item.status}
                      disabled={isUpdating}
                      onChange={(e) =>
                        handleUpdateStatus(
                          item.id,
                          e.target.value as WholesaleStatus
                        )
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none disabled:opacity-60"
                    >
                      <option value="NEW">جدید</option>
                      <option value="CONTACTED">تماس گرفته شده</option>
                      <option value="CLOSED">بسته شده</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}