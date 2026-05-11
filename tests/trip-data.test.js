/**
 * 模块名称：Layer 3 trip data tests
 * 职责描述：校验重构后的南昌演唱会与三清山半天+半天行程数据
 * 输入/输出：读取 trip-data 和 route-utils；失败时抛出断言错误
 * 依赖关系：Node.js assert、trip-data、route-utils
 * 注意事项：只校验结构和规划约束，不代表实时票务/天气/景区公告
 */

const assert = require("node:assert/strict");
const { tripData } = require("../src/trip-data.js");
const { createRouteSegments, estimateBudgetTotals, getRecommendedTransport, getVisibleDays } = require("../src/route-utils.js");

function testNewUserConstraintsAreEncoded() {
  assert.equal(tripData.layer, 3);
  assert.equal(tripData.arrival.time, "2026-05-21 18:00");
  assert.equal(tripData.departure.time, "2026-05-24 下午");
  assert.equal(tripData.fixedHotelIds.nanchang, "nanchang-hanting-xuefu-east");
  assert.equal(tripData.days.length, 4);
  assert.equal(tripData.days[1].poiIds.includes("nanchang-international-sports-center"), true);
}

function testJingdezhenIsRemoved() {
  const serialized = JSON.stringify(tripData);
  assert.ok(!serialized.includes("景德镇"), "Jingdezhen should be removed from the rebuilt route");
  assert.ok(!serialized.includes("taoxichuan"), "Taoxichuan should not remain in IDs");
  assert.ok(!serialized.includes("ceramic"), "Ceramic museum IDs should not remain");
}

function testMustSeePoisExist() {
  const ids = new Set(tripData.pois.map((poi) => poi.id));
  for (const id of tripData.mustSeePoiIds) {
    assert.ok(ids.has(id), `missing must-see POI: ${id}`);
  }
}

function testCoreCoordinatesArePlausible() {
  for (const poi of tripData.pois.filter((item) => item.core)) {
    assert.equal(typeof poi.lng, "number", `${poi.id} lng must be numeric`);
    assert.equal(typeof poi.lat, "number", `${poi.id} lat must be numeric`);
    assert.ok(poi.lng >= 115 && poi.lng <= 121, `${poi.id} lng outside route range`);
    assert.ok(poi.lat >= 28 && poi.lat <= 32, `${poi.id} lat outside route range`);
  }
}

function testDailyPlanMatchesRebuiltRoute() {
  assert.deepEqual(tripData.days.map((day) => day.base), [
    "南昌固定酒店",
    "南昌固定酒店",
    "三清山金沙索道口",
    "上饶返常州",
  ]);
  assert.ok(tripData.days[2].schedule.some((item) => item.includes("G1344")));
  assert.ok(tripData.days[3].schedule.some((item) => item.includes("G1378")));
  assert.ok(tripData.days[3].schedule.some((item) => item.includes("G1528+G7086")));
}

function testSanqingshanHalfDayPlusHalfDayLayerThree() {
  const deepDive = tripData.layer3?.find((item) => item.poiId === "sanqingshan-jinsha-lower");
  assert.ok(deepDive, "missing Sanqingshan Layer 3 deep dive");
  assert.equal(deepDive.entrance.recommended, "金沙索道");
  assert.ok(deepDive.ticketAndCableway.refreshRequired);
  assert.ok(deepDive.routeOptions.some((option) => option.id === "day3-afternoon-core"));
  assert.ok(deepDive.routeOptions.some((option) => option.id === "day4-morning-extension"));
  assert.ok(deepDive.routeOptions.some((option) => option.id === "ticket-risk-fallback"));
  assert.equal(deepDive.ticketAndCableway.eastCablewayFare.roundTripCny, 125);
  assert.ok(deepDive.ticketAndCableway.queueRule.includes("取号"));
  assert.ok(deepDive.risks.some((risk) => risk.includes("G1378")));
}

function testRailChecksAreExactTargetDateQueries() {
  assert.equal(tripData.railChecks.checkedAt, "2026-05-10");
  assert.equal(tripData.railChecks.stationCodes["南昌西"], "NXG");
  assert.equal(tripData.railChecks.stationCodes["上饶"], "SRG");
  assert.equal(tripData.railChecks.stationCodes["常州北"], "ESH");

  const day3 = tripData.railChecks.items.find((item) => item.id === "day3-nanchang-west-shangrao");
  assert.ok(day3);
  assert.ok(day3.recommendation.includes("G1344"));
  assert.ok(day3.candidates.some((candidate) => candidate.train === "G1344" && candidate.status === "有票"));

  const day4 = tripData.railChecks.items.find((item) => item.id === "day4-shangrao-changzhou");
  assert.ok(day4);
  assert.ok(day4.recommendation.includes("G1378"));
  assert.ok(day4.candidates.some((candidate) => candidate.train === "G1378" && candidate.status === "无票"));
  assert.ok(day4.candidates.some((candidate) => candidate.train === "G1528+G7086" && candidate.status.includes("有票")));
}

function testEachAdjacentSegmentHasTransport() {
  const segments = createRouteSegments(tripData);
  assert.ok(segments.length >= 20, "rebuilt route should include city, mountain, and return segments");
  for (const segment of segments) {
    assert.ok(segment.from && segment.to, "segment endpoints are required");
    assert.ok(segment.day, `segment lacks day: ${segment.from}->${segment.to}`);
    assert.ok(segment.transport?.note || segment.transport?.drivingKm || segment.transport?.walkingM || segment.transport?.rail || segment.transport?.shuttle || segment.transport?.cableway, `segment lacks transport estimate: ${segment.from}->${segment.to}`);
  }
}

function testRecommendedTransportSupportsRailShuttleAndCableway() {
  const segments = createRouteSegments(tripData);
  const byPair = new Map(segments.map((segment) => [`${segment.from}->${segment.to}`, getRecommendedTransport(segment)]));
  assert.deepEqual(byPair.get("nanchang-west-station->shangrao-station"), {
    mode: "高铁",
    minutes: 55,
    label: "高铁 55分钟",
    geometry: "rail",
  });
  assert.deepEqual(byPair.get("shangrao-station->sanqingshan-hanting-jinsha"), {
    mode: "班车/接驳",
    minutes: 95,
    label: "班车/接驳 95分钟",
    geometry: "straight",
  });
  assert.deepEqual(byPair.get("sanqingshan-jinsha-lower->sanqingshan-jinsha-upper"), {
    mode: "索道",
    minutes: 10,
    label: "索道 10分钟",
    geometry: "straight",
  });
}

function testNoUnnecessaryLongTaxiSegments() {
  for (const segment of tripData.dailySegments) {
    const transport = segment.transport || {};
    const isTaxi = transport.drivingMin && !transport.rail && !transport.shuttle && !transport.cableway;
    assert.ok(!isTaxi || transport.drivingMin <= tripData.budgetRules.maxNonEssentialTaxiMin, `${segment.from}->${segment.to} is an overlong taxi segment`);
  }
}

function testBudgetEstimatesAreEncoded() {
  assert.equal(tripData.budgetRules.taxiCnyPerKm, 3);
  assert.equal(tripData.budgetRules.travelers, 2);
  assert.equal(tripData.budget.hotelNights.length, 3);
  assert.ok(tripData.budget.railTickets.some((ticket) => ticket.train === "G1344" && ticket.unitCny === 113));
  assert.ok(tripData.budget.railTickets.some((ticket) => ticket.train === "G1378" && ticket.unitCny === 332));

  const totals = estimateBudgetTotals(tripData);
  assert.ok(totals.transportCny > 1400);
  assert.equal(totals.segmentTransportCny >= 500, true);
  assert.ok(totals.hotelCny === 820);
  assert.equal(totals.totalCny, totals.transportCny + totals.hotelCny);
}

function testVisibleDaysDefaultToAllDays() {
  assert.equal(getVisibleDays(tripData).length, tripData.days.length);
}

testNewUserConstraintsAreEncoded();
testJingdezhenIsRemoved();
testMustSeePoisExist();
testCoreCoordinatesArePlausible();
testDailyPlanMatchesRebuiltRoute();
testSanqingshanHalfDayPlusHalfDayLayerThree();
testRailChecksAreExactTargetDateQueries();
testEachAdjacentSegmentHasTransport();
testRecommendedTransportSupportsRailShuttleAndCableway();
testNoUnnecessaryLongTaxiSegments();
testBudgetEstimatesAreEncoded();
testVisibleDaysDefaultToAllDays();

console.log("Rebuilt Jiangxi route tests passed.");
