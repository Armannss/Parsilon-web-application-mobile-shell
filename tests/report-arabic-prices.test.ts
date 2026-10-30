import { strict as assert } from "node:assert";
import { test } from "node:test";
import { buildReportMetrics, type ReportOrderItem } from "../lib/report-utils";

test("sales totals accept Persian, Arabic-Indic and Latin digits", () => {
  for (const price of ["۱۲٬۳۴۵ ریال", "١٢٬٣٤٥ ریال", "12,345 ریال"]) {
    const order = { itemCount: 2, total: 24690, items: [{ code: "A", slug: "a", name: "Part", category: "bearing", price, quantity: 2 }] } as ReportOrderItem;
    const metrics = buildReportMetrics([order], "all");
    assert.equal(metrics.salesByCategoryList[0].sales, 24690);
    assert.equal(metrics.salesByProductList[0].sales, 24690);
  }
});
