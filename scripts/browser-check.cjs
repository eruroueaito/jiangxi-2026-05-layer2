/**
 * 模块名称：Layer 2 browser check
 * 职责描述：用 Playwright 校验高德 JSAPI 地图的基础渲染、marker、路线、内嵌 POI 交通卡、Day切换、popup 和移动端横向溢出
 * 输入/输出：输入本地静态页面 URL；输出检查结果并在 output/playwright 写入截图
 * 依赖关系：playwright 或 bundled workspace Node 的 NODE_PATH
 * 注意事项：瓦片检查受网络和高德瓦片服务影响，失败时需区分页面问题和外部网络问题
 */

const path = require("node:path");
const { chromium } = require("playwright");

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/browser-check.cjs <url>");
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".amap-marker", { timeout: 20000 });
  await page.waitForSelector(".route-label span", { timeout: 20000 });
  await page.waitForFunction(() => window.__AMAP_ROUTE_STATUS && window.__AMAP_ROUTE_STATUS.completed > 0, { timeout: 30000 });
  await page.waitForFunction(() => window.__AMAP_ROUTE_STATUS && window.__AMAP_ROUTE_STATUS.directional >= 20, { timeout: 10000 });
  await page.screenshot({ path: path.join("output", "playwright", "layer2-desktop.png"), fullPage: true });

  const counts = await page.evaluate(() => ({
    markers: document.querySelectorAll(".amap-marker").length,
    paths: document.querySelectorAll(".amap-overlay-text-container, .amap-layers canvas").length,
    standaloneCards: document.querySelectorAll(".segment-card").length,
    poiCards: document.querySelectorAll(".poi-card").length,
    labels: document.querySelectorAll(".route-label span").length,
    dayTabs: document.querySelectorAll(".day-tab").length,
    budgetCards: document.querySelectorAll(".budget-card").length,
    layer3Cards: document.querySelectorAll(".layer3-card").length,
    layer3Options: document.querySelectorAll(".layer3-option").length,
    hasConcertVenue: (document.body.textContent || "").includes("南昌国际体育中心"),
    hasJingdezhen: (document.body.textContent || "").includes("景德镇"),
    hasDirectReturnTrain: (document.body.textContent || "").includes("G1378"),
    hasReturnFallbackTrain: (document.body.textContent || "").includes("G1528+G7086"),
    budgetText: document.querySelector("#budget-panel")?.textContent || "",
    layer3Text: document.querySelector("#layer3-panel")?.textContent || "",
    mapCanvases: document.querySelectorAll(".amap-layers canvas").length,
    hasSegmentList: Boolean(document.querySelector("#segment-list")),
    routeStatus: window.__AMAP_ROUTE_STATUS,
  }));

  if (counts.markers < 15) throw new Error(`expected at least 15 markers, got ${counts.markers}`);
  if (counts.paths < 1) throw new Error(`expected AMap canvas/overlay paths, got ${counts.paths}`);
  if (counts.hasSegmentList) throw new Error("standalone adjacent transport segment list should be removed");
  if (counts.standaloneCards !== 0) throw new Error(`expected no standalone transport cards, got ${counts.standaloneCards}`);
  if (counts.poiCards < 20) throw new Error(`expected at least 20 POI cards, got ${counts.poiCards}`);
  if (counts.labels < 20) throw new Error(`expected route labels to remain on the map, got ${counts.labels}`);
  if (counts.dayTabs !== 4) throw new Error(`expected 4 day tabs, got ${counts.dayTabs}`);
  if (counts.budgetCards < 3) throw new Error(`expected budget cards, got ${counts.budgetCards}`);
  if (counts.layer3Cards < 1) throw new Error("expected Layer 3 Sanqingshan card");
  if (counts.layer3Options < 3) throw new Error(`expected at least 3 Layer 3 route options, got ${counts.layer3Options}`);
  if (!counts.layer3Text.includes("三清山") || !counts.layer3Text.includes("金沙索道")) throw new Error("Layer 3 panel should show Sanqingshan route detail");
  if (!counts.hasConcertVenue) throw new Error("rebuilt route should include the concert venue");
  if (counts.hasJingdezhen) throw new Error("rebuilt route should not include Jingdezhen");
  if (!counts.hasDirectReturnTrain || !counts.hasReturnFallbackTrain) throw new Error("return rail risk and fallback should be visible");
  if (!counts.budgetText.includes("费用估算") || !counts.budgetText.includes("酒店")) throw new Error("budget panel should show cost estimates");
  if (counts.mapCanvases < 1) throw new Error("expected at least one AMap canvas");
  if (counts.routeStatus.completed < 1) throw new Error(`expected at least one completed AMap route, got ${JSON.stringify(counts.routeStatus)}`);
  if (counts.routeStatus.directional < 20) throw new Error(`expected directional route styling, got ${JSON.stringify(counts.routeStatus)}`);
  const firstRouteLabel = await page.locator(".route-label span").first().innerText();
  if (!firstRouteLabel.includes("→")) throw new Error(`expected route labels to include direction order, got ${firstRouteLabel}`);

  await page.click(".poi-focus-button");
  await page.waitForSelector(".amap-info-content", { timeout: 5000 });
  await page.click(".poi-route-toggle");
  await page.waitForSelector(".poi-card.open .poi-next-time", { timeout: 5000 });

  const before = await page.locator(".route-label span").count();
  await page.click(".day-tab");
  const after = await page.locator(".route-label span").count();
  if (after >= before) throw new Error("day tab did not hide the selected day's route layer");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join("output", "playwright", "layer2-mobile.png"), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error("mobile viewport has horizontal overflow");
  const mobileLayout = await page.evaluate(() => {
    const panel = document.querySelector(".panel");
    const map = document.querySelector("#map");
    const eyebrow = document.querySelector(".eyebrow");
    const title = document.querySelector("#trip-title");
    const subtitle = document.querySelector("#trip-subtitle");
    const overviewButton = document.querySelector("#overview-button");
    const panelRect = panel.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const panelStyle = getComputedStyle(panel);
    const headerStyle = getComputedStyle(document.querySelector(".panel-header"));
    return {
      panelPosition: panelStyle.position,
      panelBottom: Math.round(window.innerHeight - panelRect.bottom),
      panelTop: Math.round(panelRect.top),
      panelHeight: Math.round(panelRect.height),
      mapTop: Math.round(mapRect.top),
      mapHeight: Math.round(mapRect.height),
      viewportHeight: window.innerHeight,
      headerPosition: headerStyle.position,
      eyebrowDisplay: getComputedStyle(eyebrow).display,
      titleDisplay: getComputedStyle(title).display,
      subtitlePosition: getComputedStyle(subtitle).position,
      overviewDisplay: getComputedStyle(overviewButton).display,
    };
  });
  if (mobileLayout.panelPosition !== "fixed") throw new Error(`mobile panel should float over the map, got ${mobileLayout.panelPosition}`);
  if (Math.abs(mobileLayout.panelBottom) > 2) throw new Error(`mobile panel should be anchored to bottom, got ${JSON.stringify(mobileLayout)}`);
  if (mobileLayout.panelHeight > mobileLayout.viewportHeight * 0.5) throw new Error(`mobile panel should leave at least half the screen for the map, got ${JSON.stringify(mobileLayout)}`);
  if (mobileLayout.mapTop !== 0 || mobileLayout.mapHeight < mobileLayout.viewportHeight - 2) throw new Error(`mobile map should fill viewport behind sheet, got ${JSON.stringify(mobileLayout)}`);
  if (mobileLayout.headerPosition !== "static") throw new Error(`mobile header should scroll with the sheet content, got ${JSON.stringify(mobileLayout)}`);
  if (mobileLayout.eyebrowDisplay !== "none" || mobileLayout.titleDisplay !== "none" || mobileLayout.overviewDisplay !== "none") {
    throw new Error(`mobile chrome should hide nonessential title controls, got ${JSON.stringify(mobileLayout)}`);
  }
  if (mobileLayout.subtitlePosition !== "static") throw new Error(`mobile subtitle should stay in the scrollable content, got ${JSON.stringify(mobileLayout)}`);
  const beforeDragHeight = mobileLayout.panelHeight;
  await page.evaluate(() => {
    document.querySelector(".panel").scrollTop = 260;
  });
  const stickyGrip = await page.evaluate(() => {
    const grip = document.querySelector(".mobile-sheet-grip");
    const panel = document.querySelector(".panel");
    const gripRect = grip.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    return {
      gripTop: Math.round(gripRect.top),
      panelTop: Math.round(panelRect.top),
      gripVisible: gripRect.top >= panelRect.top - 2 && gripRect.bottom <= panelRect.bottom + 2,
    };
  });
  if (!stickyGrip.gripVisible || stickyGrip.gripTop > stickyGrip.panelTop + 20) {
    throw new Error(`mobile drag grip should remain fixed while sheet content scrolls, got ${JSON.stringify(stickyGrip)}`);
  }
  await page.evaluate(() => {
    const grip = document.querySelector(".mobile-sheet-grip");
    const gripRect = grip.getBoundingClientRect();
    const startY = gripRect.top + gripRect.height / 2;
    grip.dispatchEvent(new MouseEvent("mousedown", { clientY: startY, button: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent("mousemove", { clientY: 190, bubbles: true }));
    window.dispatchEvent(new MouseEvent("mouseup", { clientY: 190, bubbles: true }));
  });
  await page.waitForTimeout(500);
  const afterDragHeight = await page.evaluate(() => Math.round(document.querySelector(".panel").getBoundingClientRect().height));
  if (afterDragHeight <= beforeDragHeight + 80) {
    throw new Error(`mobile sheet should be draggable upward, before ${beforeDragHeight}, after ${afterDragHeight}`);
  }

  await browser.close();
  console.log("Layer 3 browser check passed.", counts);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
