/**
 * 模块名称：Layer 2 Amap JSAPI map app
 * 职责描述：渲染江西七日游第二层日级路线、POI marker、高德路线折线、推荐交通时间标签和内嵌 POI 交通卡片
 * 输入/输出：输入全局 TRIP_DATA、ROUTE_UTILS 与 AMAP_CONFIG；输出交互式高德地图
 * 依赖关系：高德 JS API v2.0 Loader、AMap.Driving、AMap.Walking、AMap.Transfer、src/trip-data.js、src/route-utils.js
 * 注意事项：驾车/步行/市内公交优先使用高德规划路径；高铁段仍为站到站行程连接线
 */

(async function initLayerTwoAmap() {
  const data = window.TRIP_DATA;
  const utils = window.ROUTE_UTILS;
  const config = window.AMAP_CONFIG;
  const markerById = new Map();
  const dayOverlays = new Map();
  const colors = ["#0f7b6c", "#3267b2", "#d45a2a", "#7c4d9e", "#647a12", "#b13f57", "#4b6673"];
  window.__AMAP_ROUTE_STATUS = { planned: 0, completed: 0, failed: 0, directional: 0 };

  window._AMapSecurityConfig = {
    securityJsCode: config.securityJsCode,
  };

  document.getElementById("trip-title").textContent = data.title;
  document.getElementById("trip-subtitle").textContent = data.subtitle;
  document.getElementById("assumptions").innerHTML = [
    ...data.assumptions,
    ...data.luggagePolicy.rules.map((rule) => `行李：${rule}`),
  ].map((item) => `<li>${item}</li>`).join("");
  renderBudgetSummary();
  setupMobileSheetDrag();

  const AMap = await AMapLoader.load({
    key: config.jsApiKey,
    version: "2.0",
    plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.Driving", "AMap.Walking", "AMap.Transfer"],
  });

  const map = new AMap.Map("map", {
    viewMode: "2D",
    zoom: 8,
    center: [117.2, 28.9],
    mapStyle: "amap://styles/normal",
  });
  map.addControl(new AMap.Scale());
  map.addControl(new AMap.ToolBar({ position: "RT" }));

  const infoWindow = new AMap.InfoWindow({ offset: new AMap.Pixel(0, -28) });
  const routeSegments = utils.createRouteSegments(data);

  function money(value) {
    return `¥${Math.round(value)}`;
  }

  function renderBudgetSummary() {
    const target = document.getElementById("budget-summary");
    if (!target || !data.budget) return;
    const totals = utils.estimateBudgetTotals(data);
    target.innerHTML = `
      <div class="budget-grid">
        <article class="budget-card">
          <strong>${money(totals.totalCny)}</strong>
          <span>总估算</span>
        </article>
        <article class="budget-card">
          <strong>${money(totals.transportCny)}</strong>
          <span>交通</span>
        </article>
        <article class="budget-card">
          <strong>${money(totals.hotelCny)}</strong>
          <span>酒店</span>
        </article>
      </div>
      <div class="budget-detail">打车变量：${data.budgetRules.taxiCnyPerKm}元/公里；高铁按12306样例二等座；酒店为1间房中端估算。</div>
      <ul class="budget-list">
        ${(data.budget.hotelNights || []).map((item) => `<li>${item.date} ${item.city}：${money(item.unitCny)} × ${item.nights}晚</li>`).join("")}
        ${(data.budget.railTickets || []).map((item) => `<li>${item.train} ${item.from}→${item.to}：${item.unitCny}元/人 × ${item.travelers}人</li>`).join("")}
      </ul>
    `;
  }

  function setupMobileSheetDrag() {
    const panel = document.querySelector(".panel");
    const grip = document.querySelector(".mobile-sheet-grip");
    if (!panel || !grip) return;
    const mobileQuery = window.matchMedia("(max-width: 780px)");
    const snapPoints = [24, 46, 78];
    let dragStartY = 0;
    let dragStartHeight = 46;
    let isDragging = false;

    function setSheetHeight(value) {
      const clamped = Math.max(snapPoints[0], Math.min(snapPoints[snapPoints.length - 1], value));
      panel.style.setProperty("--mobile-sheet-height", `${clamped}dvh`);
      panel.dataset.sheetHeight = String(Math.round(clamped));
    }

    function nearestSnap(value) {
      return snapPoints.reduce((nearest, point) => (
        Math.abs(point - value) < Math.abs(nearest - value) ? point : nearest
      ), snapPoints[0]);
    }

    function startDrag(clientY) {
      isDragging = true;
      dragStartY = clientY;
      dragStartHeight = Number(panel.dataset.sheetHeight || 46);
      panel.classList.add("dragging");
    }

    function updateDrag(clientY) {
      if (!isDragging) return;
      const deltaVh = ((dragStartY - clientY) / window.innerHeight) * 100;
      setSheetHeight(dragStartHeight + deltaVh);
    }

    function finishDrag() {
      if (!isDragging) return;
      isDragging = false;
      panel.classList.remove("dragging");
      const currentHeight = Number(panel.dataset.sheetHeight || dragStartHeight);
      setSheetHeight(nearestSnap(currentHeight));
    }

    grip.addEventListener("mousedown", (event) => {
      if (!mobileQuery.matches || isDragging) return;
      event.preventDefault();
      startDrag(event.clientY);
      const onMouseMove = (moveEvent) => updateDrag(moveEvent.clientY);
      const onMouseUp = () => {
        finishDrag();
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });

    grip.addEventListener("touchstart", (event) => {
      if (!mobileQuery.matches || isDragging) return;
      const touch = event.touches[0];
      if (!touch) return;
      startDrag(touch.clientY);
      const onTouchMove = (moveEvent) => {
        const nextTouch = moveEvent.touches[0];
        if (!nextTouch) return;
        moveEvent.preventDefault();
        updateDrag(nextTouch.clientY);
      };
      const onTouchEnd = () => {
        finishDrag();
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
      };
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchcancel", onTouchEnd);
    }, { passive: true });

    mobileQuery.addEventListener?.("change", () => {
      if (mobileQuery.matches) {
        setSheetHeight(Number(panel.dataset.sheetHeight || 46));
      } else {
        panel.style.removeProperty("--mobile-sheet-height");
      }
    });
    setSheetHeight(46);
  }

  function toPosition(poi) {
    return [poi.lng, poi.lat];
  }

  function segmentPositions(segment) {
    return [toPosition(segment.fromPoi), toPosition(segment.toPoi)];
  }

  function routeMidpoint(path) {
    return path[Math.max(0, Math.floor((path.length - 1) / 2))] || path[0];
  }

  function popupHtml(poi) {
    const rating = poi.rating ? `评分 ${poi.rating}` : "评分待查";
    return `<div class="popup-title">${poi.name}</div><div class="popup-meta">${rating}<br>${poi.openTime || "开放时间待查"}<br>${poi.note}</div>`;
  }

  function addOverlay(day, overlay) {
    const overlays = dayOverlays.get(day) || [];
    overlays.push(overlay);
    dayOverlays.set(day, overlays);
  }

  function pathFromSteps(steps) {
    const path = [];
    for (const step of steps || []) {
      const points = step.path || [];
      for (const point of points) {
        if (Array.isArray(point)) {
          path.push(point);
        } else if (typeof point?.getLng === "function") {
          path.push([point.getLng(), point.getLat()]);
        } else if (typeof point?.lng === "number" && typeof point?.lat === "number") {
          path.push([point.lng, point.lat]);
        }
      }
    }
    return path;
  }

  function transitPathFromPlan(plan) {
    const path = [];
    for (const segment of plan?.segments || []) {
      path.push(...pathFromSteps(segment.walking?.steps || []));
      if (Array.isArray(segment.transit?.path)) {
        path.push(...segment.transit.path.map((point) => (
          typeof point?.getLng === "function" ? [point.getLng(), point.getLat()] : point
        )));
      }
    }
    return path;
  }

  function createRouteLabel(position, recommended, order, color) {
    return new AMap.Marker({
      position,
      content: `<div class="route-label"><span style="border-color:${color}">${order}→${order + 1} ${recommended.label}</span></div>`,
      anchor: "center",
      offset: new AMap.Pixel(0, 0),
      zIndex: 120,
    });
  }

  function createRoutePolyline(path, color, segment) {
    return new AMap.Polyline({
      path,
      strokeColor: color,
      strokeWeight: segment.luggage ? 8 : 7,
      strokeOpacity: 0.84,
      strokeStyle: segment.recommended.geometry === "rail" ? "dashed" : "solid",
      strokeDasharray: [10, 8],
      lineJoin: "round",
      lineCap: "round",
      showDir: true,
      zIndex: 50,
    });
  }

  function planAmapRoute(segment, polyline, label) {
    const recommended = segment.recommended || utils.getRecommendedTransport(segment);
    if (!["driving", "walking"].includes(recommended.geometry)) return;
    window.__AMAP_ROUTE_STATUS.planned += 1;
    const [start, end] = segmentPositions(segment);
    const planner = recommended.geometry === "walking"
      ? new AMap.Walking()
      : new AMap.Driving({ policy: AMap.DrivingPolicy.LEAST_TIME, showTraffic: true });

    planner.search(start, end, (status, result) => {
      if (status !== "complete") {
        window.__AMAP_ROUTE_STATUS.failed += 1;
        return;
      }
      const route = result.routes?.[0];
      const path = pathFromSteps(route?.steps || []);
      if (path.length < 2) {
        window.__AMAP_ROUTE_STATUS.failed += 1;
        return;
      }
      polyline.setPath(path);
      label.setPosition(routeMidpoint(path));
      window.__AMAP_ROUTE_STATUS.completed += 1;
    });
  }

  function addRouteSegment(segment, color, order) {
    if (!segment.fromPoi || !segment.toPoi) return;
    const fallbackPath = segmentPositions(segment);
    const recommended = segment.recommended || utils.getRecommendedTransport(segment);
    const polyline = createRoutePolyline(fallbackPath, color, segment);
    const label = createRouteLabel(routeMidpoint(fallbackPath), recommended, order, color);
    map.add([polyline, label]);
    window.__AMAP_ROUTE_STATUS.directional += 1;
    addOverlay(segment.day, polyline);
    addOverlay(segment.day, label);
    planAmapRoute(segment, polyline, label);
  }

  for (const poi of data.pois.filter((item) => item.core)) {
    const marker = new AMap.Marker({
      position: toPosition(poi),
      title: poi.name,
      anchor: "bottom-center",
    });
    marker.on("click", () => {
      infoWindow.setContent(popupHtml(poi));
      infoWindow.open(map, toPosition(poi));
    });
    map.add(marker);
    markerById.set(poi.id, marker);
  }

  function fitAll() {
    map.setFitView(Array.from(markerById.values()), false, [36, 36, 36, 36]);
  }

  document.getElementById("overview-button").addEventListener("click", fitAll);

  const dayTabs = document.getElementById("day-tabs");
  const dayList = document.getElementById("day-list");

  function transportSummary(segment) {
    if (!segment) {
      return `<div class="poi-next-empty">当天最后一站，无下一段交通。</div>`;
    }
    const recommended = segment.recommended || utils.getRecommendedTransport(segment);
    const parts = [];
    if (segment.transport.rail) parts.push(segment.transport.rail);
    if (segment.transport.shuttle) parts.push(segment.transport.shuttle);
    if (segment.transport.drivingKm) parts.push(`驾车约 ${segment.transport.drivingKm} km / ${segment.transport.drivingMin} 分钟`);
    if (segment.transport.walkingM) parts.push(`步行约 ${segment.transport.walkingM} m / ${segment.transport.walkingMin} 分钟`);
    if (segment.transport.unitCny) parts.push(`约 ${segment.transport.unitCny} 元/人`);
    if (segment.luggage) parts.push("带行李段");
    return `
      <div class="poi-next-time">${recommended.label}</div>
      <div class="poi-next-target">去下一站：${segment.toPoi.name}</div>
      <div class="poi-next-options">${parts.join("｜") || "交通待查"}</div>
      <div class="poi-next-note">${segment.transport.note}</div>
    `;
  }

  function poiCardHtml(poi, nextSegment, order) {
    const hasNext = Boolean(nextSegment);
    return `
      <article class="poi-card ${nextSegment?.luggage ? "luggage-segment" : ""}">
        <div class="poi-card-main">
          <span class="poi-index">${order}</span>
          <button class="poi-focus-button" type="button" data-poi="${poi.id}">${poi.name}</button>
          <button class="poi-route-toggle" type="button" aria-expanded="false">${hasNext ? "交通" : "结束"}</button>
        </div>
        <div class="poi-route-detail">${transportSummary(nextSegment)}</div>
      </article>
    `;
  }

  data.days.forEach((day, index) => {
    const color = colors[index % colors.length];
    const tab = document.createElement("button");
    tab.className = "day-tab active";
    tab.type = "button";
    tab.textContent = `Day ${day.day}`;
    tab.dataset.day = String(day.day);
    dayTabs.appendChild(tab);

    const dayPois = day.poiIds.map((id) => utils.getPoiById(data, id)).filter(Boolean);
    const daySegments = routeSegments.filter((segment) => segment.day === day.day);

    dayPois.forEach((poi) => {
      const circle = new AMap.CircleMarker({
        center: toPosition(poi),
        radius: 8,
        strokeColor: color,
        strokeWeight: 2,
        strokeOpacity: 1,
        fillColor: color,
        fillOpacity: 0.25,
        zIndex: 80,
      });
      map.add(circle);
      addOverlay(day.day, circle);
    });
    daySegments.forEach((segment, segmentIndex) => addRouteSegment(segment, color, segmentIndex + 1));

    const card = document.createElement("article");
    card.className = "day-card";
    card.innerHTML = `
      <strong>Day ${day.day}｜${day.date}｜${day.base}</strong>
      <div>${day.theme}</div>
      <div>${day.load}</div>
      <ol class="schedule-list">${day.schedule.map((item) => `<li>${item}</li>`).join("")}</ol>
      <div class="poi-card-list">
        ${dayPois.map((poi, poiIndex) => {
          const nextSegment = daySegments.find((segment) => segment.from === poi.id);
          return poiCardHtml(poi, nextSegment, poiIndex + 1);
        }).join("")}
      </div>
    `;
    dayList.appendChild(card);
  });

  dayTabs.addEventListener("click", (event) => {
    const button = event.target.closest(".day-tab");
    if (!button) return;
    const day = Number(button.dataset.day);
    const overlays = dayOverlays.get(day) || [];
    if (button.classList.contains("active")) {
      map.remove(overlays);
      button.classList.remove("active");
    } else {
      map.add(overlays);
      button.classList.add("active");
    }
  });

  dayList.addEventListener("click", (event) => {
    const focusButton = event.target.closest(".poi-focus-button");
    if (focusButton) {
      const marker = markerById.get(focusButton.dataset.poi);
      if (!marker) return;
      const poi = utils.getPoiById(data, focusButton.dataset.poi);
      map.setZoomAndCenter(11, marker.getPosition());
      infoWindow.setContent(popupHtml(poi));
      infoWindow.open(map, marker.getPosition());
      return;
    }

    const toggleButton = event.target.closest(".poi-route-toggle");
    if (!toggleButton) return;
    const poiCard = toggleButton.closest(".poi-card");
    const isOpen = poiCard.classList.toggle("open");
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  });

  fitAll();
})();
