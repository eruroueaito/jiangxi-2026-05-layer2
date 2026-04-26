/**
 * 模块名称：Layer 2 route utilities
 * 职责描述：为第二版江西日级路线地图提供 POI 查询、线路点位和可见日期工具
 * 输入/输出：输入 tripData；输出相邻路线段、点位坐标和默认可见日
 * 依赖关系：无外部依赖
 * 注意事项：输出的是行程连接线，不是导航折线
 */

function getPoiById(tripData, id) {
  return tripData.pois.find((poi) => poi.id === id);
}

function createRouteSegments(tripData) {
  const sourceSegments = tripData.dailySegments || tripData.macroSegments || [];
  return sourceSegments.map((segment) => {
    const fromPoi = getPoiById(tripData, segment.from);
    const toPoi = getPoiById(tripData, segment.to);
    const enrichedSegment = {
      ...segment,
      fromPoi,
      toPoi,
      latLngs: fromPoi && toPoi ? [[fromPoi.lat, fromPoi.lng], [toPoi.lat, toPoi.lng]] : [],
    };
    return {
      ...enrichedSegment,
      recommended: getRecommendedTransport(enrichedSegment),
    };
  });
}

function parseRailMinutes(text) {
  const match = String(text || "").match(/(\d+)\s*分钟/);
  return match ? Number(match[1]) : null;
}

function getRecommendedTransport(segment) {
  const transport = segment.transport || {};
  if (transport.rail) {
    const minutes = parseRailMinutes(transport.rail) || transport.railMin || null;
    return {
      mode: "高铁",
      minutes,
      label: minutes ? `高铁 ${minutes}分钟` : "高铁 时间待查",
      geometry: "rail",
    };
  }

  if (transport.shuttle) {
    const minutes = transport.shuttleMin || null;
    return {
      mode: "班车/接驳",
      minutes,
      label: minutes ? `班车/接驳 ${minutes}分钟` : "班车/接驳 时间待查",
      geometry: "straight",
    };
  }

  const walkingMin = transport.walkingMin;
  const drivingMin = transport.drivingMin;
  const walkingM = transport.walkingM;

  if (!segment.luggage && walkingMin && walkingM <= 500) {
    return { mode: "步行", minutes: walkingMin, label: `步行 ${walkingMin}分钟`, geometry: "walking" };
  }

  if (!segment.luggage && walkingMin && !drivingMin) {
    return { mode: "步行", minutes: walkingMin, label: `步行 ${walkingMin}分钟`, geometry: "walking" };
  }

  if (!segment.luggage && walkingMin && walkingM <= 1500 && walkingMin <= 12) {
    return { mode: "步行", minutes: walkingMin, label: `步行 ${walkingMin}分钟`, geometry: "walking" };
  }

  if (drivingMin) {
    const mode = segment.transport?.charter ? "包车" : "打车";
    return { mode, minutes: drivingMin, label: `${mode} ${drivingMin}分钟`, geometry: "driving" };
  }

  if (walkingMin) {
    return { mode: "步行", minutes: walkingMin, label: `步行 ${walkingMin}分钟`, geometry: "walking" };
  }

  return { mode: "待查", minutes: null, label: "时间待查", geometry: "straight" };
}

function estimateSegmentCost(segment, tripData) {
  const transport = segment.transport || {};
  const travelers = tripData.budgetRules?.travelers || 1;
  const taxiCnyPerKm = tripData.budgetRules?.taxiCnyPerKm || 3;
  if (typeof transport.costCny === "number") return transport.costCny;
  if (typeof transport.unitCny === "number") return transport.unitCny * travelers;
  if (transport.drivingKm && !transport.shuttle && !transport.rail) {
    return Math.round(transport.drivingKm * taxiCnyPerKm);
  }
  return 0;
}

function estimateBudgetTotals(tripData) {
  const segments = createRouteSegments(tripData);
  const segmentTransportCny = segments.reduce((sum, segment) => sum + estimateSegmentCost(segment, tripData), 0);
  const railCny = (tripData.budget?.railTickets || []).reduce((sum, ticket) => sum + ticket.unitCny * (ticket.travelers || tripData.budgetRules?.travelers || 1), 0);
  const hotelCny = (tripData.budget?.hotelNights || []).reduce((sum, item) => sum + item.nights * item.unitCny, 0);
  const transportCny = segmentTransportCny + railCny;
  return {
    segmentTransportCny: Math.round(segmentTransportCny),
    railCny: Math.round(railCny),
    transportCny: Math.round(transportCny),
    hotelCny: Math.round(hotelCny),
    totalCny: Math.round(transportCny + hotelCny),
  };
}

function getVisibleDays(tripData) {
  return tripData.days.slice();
}

function getBounds(pois) {
  return pois.filter((poi) => typeof poi.lat === "number" && typeof poi.lng === "number").map((poi) => [poi.lat, poi.lng]);
}

if (typeof module !== "undefined") {
  module.exports = { createRouteSegments, estimateBudgetTotals, estimateSegmentCost, getBounds, getPoiById, getRecommendedTransport, getVisibleDays };
}

if (typeof window !== "undefined") {
  window.ROUTE_UTILS = { createRouteSegments, estimateBudgetTotals, estimateSegmentCost, getBounds, getPoiById, getRecommendedTransport, getVisibleDays };
}
