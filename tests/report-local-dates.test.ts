import { strict as assert } from "node:assert";
import { test } from "node:test";
import { filterOrdersForReport, type ReportOrderItem } from "../lib/report-utils";

test("custom report includes exactly the selected local day", () => {
  const previous = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  try {
    const orders = ["2026-10-29T23:59:59-07:00", "2026-10-30T00:00:00-07:00", "2026-10-30T23:59:59-07:00", "2026-10-31T00:00:00-07:00"].map((createdAt, i) => ({ createdAt, orderNumber: String(i), items: [] })) as ReportOrderItem[];
    const result = filterOrdersForReport(orders, { rangeType: "custom", startDate: "2026-10-30", endDate: "2026-10-30", category: "all", status: "all" });
    assert.deepEqual(result.map(o => o.orderNumber), ["1", "2"]);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
