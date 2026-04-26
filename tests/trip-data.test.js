/**
 * 模块名称：Layer 2 trip data tests
 * 职责描述：校验江西七日游第二层日级路线、行李约束和相邻交通段是否完整一致
 * 输入/输出：读取 src/trip-data.js 与 src/route-utils.js，失败时抛出断言错误，成功时输出通过信息
 * 依赖关系：依赖 Node.js assert、trip-data 和 route-utils
 * 注意事项：只校验结构、顺序和估算，不代表实时交通、实时天气或最终购票信息
 */

const assert = require("node:assert/strict");
const { tripData } = require("../src/trip-data.js");
const { createRouteSegments, estimateBudgetTotals, getRecommendedTransport, getVisibleDays } = require("../src/route-utils.js");

function testUserConstraintsAreEncoded() {
  assert.equal(tripData.layer, 2);
  assert.equal(tripData.fixedHotelIds.nanchang, "nanchang-hanting-xuefu-east");
  assert.equal(tripData.arrival.stationId, "nanchang-west-station");
  assert.equal(tripData.arrival.time, "2026-05-21 13:00");
  assert.equal(tripData.departure.stationId, "shangrao-station");
  assert.equal(tripData.departure.time, "2026-05-26 17:00");
  assert.equal(tripData.luggagePolicy.mode, "drop-store-first");
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
    assert.ok(poi.lng >= 115 && poi.lng <= 119, `${poi.id} lng outside route range`);
    assert.ok(poi.lat >= 28 && poi.lat <= 30, `${poi.id} lat outside route range`);
  }
}

function testDailyPoiOrderMatchesPlan() {
  assert.deepEqual(tripData.days.map((day) => day.base), [
    "南昌固定酒店",
    "南昌固定酒店",
    "景德镇陶溪川/陶阳里",
    "景德镇陶溪川/陶阳里",
    "三清山金沙索道口",
    "上饶站离开",
  ]);
  assert.deepEqual(tripData.days[0].poiIds, ["nanchang-west-station", "nanchang-hanting-xuefu-east", "nanchang-vientiane"]);
  assert.ok(tripData.days[5].poiIds.includes("sanqingshan-jinsha-lower"));
  assert.equal(tripData.days.length, 6);
}

function testWuyuanAndHuanglingAreRemoved() {
  const allPoiIds = tripData.pois.map((poi) => poi.id);
  const allDayPoiIds = tripData.days.flatMap((day) => day.poiIds);
  const allSegmentIds = tripData.dailySegments.flatMap((segment) => [segment.from, segment.to]);
  for (const id of ["huangling", "wuyuan-station"]) {
    assert.ok(!allPoiIds.includes(id), `${id} should be removed from POIs`);
    assert.ok(!allDayPoiIds.includes(id), `${id} should be removed from days`);
    assert.ok(!allSegmentIds.includes(id), `${id} should be removed from segments`);
  }
  assert.ok(!JSON.stringify(tripData).includes("包车"), "charter/package car should not appear in revised guide");
}

function testEachAdjacentSegmentHasTransport() {
  const segments = createRouteSegments(tripData);
  assert.ok(segments.length >= 12, "Layer 2 should include daily adjacent segments");
  for (const segment of segments) {
    assert.ok(segment.from && segment.to, "segment endpoints are required");
    assert.ok(segment.day, `segment lacks day: ${segment.from}->${segment.to}`);
    assert.ok(segment.transport?.note || segment.transport?.drivingKm || segment.transport?.walkingM || segment.transport?.rail || segment.transport?.shuttle, `segment lacks transport estimate: ${segment.from}->${segment.to}`);
  }
}

function testNoUnnecessaryLongTaxiSegments() {
  for (const segment of tripData.dailySegments) {
    const transport = segment.transport || {};
    const isTaxi = transport.drivingMin && !transport.rail && !transport.shuttle && !transport.walkingOnly;
    assert.ok(!isTaxi || transport.drivingMin <= tripData.budgetRules.maxNonEssentialTaxiMin, `${segment.from}->${segment.to} is an overlong taxi segment`);
  }
}

function testRecommendedTransportShowsOneTime() {
  const segments = createRouteSegments(tripData);
  const byPair = new Map(segments.map((segment) => [`${segment.from}->${segment.to}`, getRecommendedTransport(segment)]));

  assert.deepEqual(byPair.get("nanchang-west-station->nanchang-hanting-xuefu-east"), {
    mode: "打车",
    minutes: 17,
    label: "打车 17分钟",
    geometry: "driving",
  });
  assert.deepEqual(byPair.get("nanchang-hanting-xuefu-east->nanchang-vientiane"), {
    mode: "步行",
    minutes: 8,
    label: "步行 8分钟",
    geometry: "walking",
  });
  assert.deepEqual(byPair.get("nanchang-east-station->jingdezhen-north-station"), {
    mode: "高铁",
    minutes: 54,
    label: "高铁 54分钟",
    geometry: "rail",
  });
  assert.deepEqual(byPair.get("sanqingshan-hanting-jinsha->sanqingshan-jinsha-lower"), {
    mode: "打车",
    minutes: 4,
    label: "打车 4分钟",
    geometry: "driving",
  });
  assert.deepEqual(byPair.get("shangrao-station->sanqingshan-hanting-jinsha"), {
    mode: "班车/接驳",
    minutes: 95,
    label: "班车/接驳 95分钟",
    geometry: "straight",
  });
}

function testLuggageSensitiveSegmentsAreFlagged() {
  const segments = createRouteSegments(tripData).filter((segment) => segment.luggage === true);
  const labels = segments.map((segment) => `${segment.from}->${segment.to}`);
  assert.ok(labels.includes("nanchang-west-station->nanchang-hanting-xuefu-east"));
  assert.ok(labels.includes("nanchang-hanting-xuefu-east->nanchang-east-station"));
  assert.ok(labels.includes("jingdezhen-hanting-taoxichuan->jingdezhen-north-station"));
  assert.ok(labels.includes("sanqingshan-hanting-jinsha->shangrao-station"));
}

function testRailChecksFrom12306AreEncoded() {
  assert.equal(tripData.railChecks.source, "12306 MCP");
  assert.equal(tripData.railChecks.stationCodes["南昌东"], "NUG");
  assert.equal(tripData.railChecks.stationCodes["景德镇北"], "JDG");
  assert.ok(tripData.railChecks.queryLimitations.includes("2026-05-23"));
  assert.ok(tripData.railChecks.queryLimitations.includes("2026-05-25"));

  const day3Check = tripData.railChecks.items.find((item) => item.id === "day3-nanchang-east-jingdezhen-north");
  assert.ok(day3Check, "missing Day 3 12306 rail check");
  assert.equal(day3Check.comparableDate, "2026-05-09");
  assert.equal(day3Check.recommendedTrain, "D6360");
  assert.equal(day3Check.recommendedMinutes, 54);
  assert.ok(day3Check.recommendation.includes("15:18"));
  assert.ok(day3Check.candidates.some((candidate) => candidate.train === "G3068" && candidate.duration === "00:42"));

  const day5Check = tripData.railChecks.items.find((item) => item.id === "day5-jingdezhen-shangrao-transfer");
  assert.ok(day5Check, "missing Day 5 Shangrao rail transfer check");
  assert.equal(day5Check.recommendedTrain, "G1456");
  assert.equal(day5Check.recommendedMinutes, 52);
}

function testDayTwoDoesNotBacktrackToHotelBeforeTengwangPavilion() {
  const day2Pairs = tripData.dailySegments.filter((segment) => segment.day === 2).map((segment) => `${segment.from}->${segment.to}`);
  assert.ok(day2Pairs.includes("jiangxi-museum->tengwang-pavilion"));
  assert.ok(!day2Pairs.includes("jiangxi-museum->nanchang-hanting-xuefu-east"));
  assert.ok(!day2Pairs.includes("nanchang-hanting-xuefu-east->tengwang-pavilion"));
}

function testBudgetEstimatesAreEncoded() {
  assert.equal(tripData.budgetRules.taxiCnyPerKm, 3);
  assert.equal(tripData.budgetRules.travelers, 2);
  assert.ok(tripData.budget.hotelNights.length >= 5);
  assert.ok(tripData.budget.railTickets.some((ticket) => ticket.train === "D6360" && ticket.unitCny === 86));
  assert.ok(tripData.budget.railTickets.some((ticket) => ticket.train === "G1456" && ticket.unitCny === 63.5));

  const totals = estimateBudgetTotals(tripData);
  assert.ok(totals.transportCny > 0);
  assert.ok(totals.hotelCny > 0);
  assert.ok(totals.totalCny === totals.transportCny + totals.hotelCny);
}

function testVisibleDaysDefaultToAllDays() {
  assert.equal(getVisibleDays(tripData).length, tripData.days.length);
}

testUserConstraintsAreEncoded();
testMustSeePoisExist();
testCoreCoordinatesArePlausible();
testDailyPoiOrderMatchesPlan();
testWuyuanAndHuanglingAreRemoved();
testEachAdjacentSegmentHasTransport();
testNoUnnecessaryLongTaxiSegments();
testRecommendedTransportShowsOneTime();
testLuggageSensitiveSegmentsAreFlagged();
testRailChecksFrom12306AreEncoded();
testDayTwoDoesNotBacktrackToHotelBeforeTengwangPavilion();
testBudgetEstimatesAreEncoded();
testVisibleDaysDefaultToAllDays();

console.log("Layer 2 trip data tests passed.");
