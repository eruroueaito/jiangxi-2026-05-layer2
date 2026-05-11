/**
 * 模块名称：Layer 3 trip data
 * 职责描述：提供重构后的江西南昌演唱会与三清山半天+半天行程数据
 * 输入/输出：无输入；输出 tripData 给浏览器全局变量和 Node.js 测试
 * 依赖关系：无外部依赖
 * 注意事项：高铁票价/余票来自 12306 MCP 2026-05-10 查询；酒店、班车、索道需出发前刷新
 */

const tripData = {
  layer: 3,
  title: "江西四日演唱会与三清山 Layer 3",
  subtitle: "2026-05-21 18:00抵达南昌｜2026-05-22南昌国际体育中心演唱会｜2026-05-23上午去三清山｜2026-05-24下午高铁返常州｜原东线已删除",
  arrival: {
    stationId: "nanchang-west-station",
    time: "2026-05-21 18:00",
    note: "未另给到达站时按南昌西站处理；如实际到南昌站或机场，只需替换首段到酒店交通。",
  },
  departure: {
    stationId: "changzhou-north-station",
    time: "2026-05-24 下午",
    note: "直达G1378上饶16:31-常州北20:25当前无票；可靠备选为13:53上饶经芜湖到常州18:22。",
  },
  fixedHotelIds: {
    nanchang: "nanchang-hanting-xuefu-east",
    sanqingshanSuggested: "sanqingshan-hanting-jinsha",
  },
  budgetRules: {
    travelers: 2,
    taxiCnyPerKm: 3,
    maxNonEssentialTaxiMin: 60,
    taxiPricingNote: "仍按用户指定变量3元/公里估算市内打车；演唱会散场可能溢价，实际以平台为准。",
    hotelPricingNote: "酒店价为中端连锁/山脚住宿规划占位，锁单前需刷新。",
  },
  budget: {
    currency: "CNY",
    notes: [
      "三清山金沙索道按景区内交通计入总预算：东部索道上行70元/人次、下行55元/人次，半天+半天各一次上下山，按500元/2人估算；景区大门票仍需按官方平台另行刷新。",
      "预算不含出发地到江西的大交通，只含本行程内南昌到上饶、上饶返常州、当地接驳和酒店。",
      "景区门票、索道票未计入总预算，因三清山价格/套票/预约平台可能变化，需出发前按官方刷新。",
      "上饶返常州按直达G1378二等座票面价估算；若买联程备选，总价约300元/人。",
    ],
    hotelNights: [
      { city: "南昌", base: "汉庭南昌红谷滩学府大道东地铁站店", date: "2026-05-21", nights: 1, unitCny: 260, source: "中端连锁估算，需平台刷新" },
      { city: "南昌", base: "汉庭南昌红谷滩学府大道东地铁站店", date: "2026-05-22", nights: 1, unitCny: 260, source: "演唱会夜可能上涨，需提前锁房" },
      { city: "三清山", base: "金沙索道口附近中端住宿", date: "2026-05-23", nights: 1, unitCny: 300, source: "山脚住宿估算，需平台刷新" },
    ],
    railTickets: [
      { day: 3, train: "G1344", from: "南昌西", to: "上饶", unitCny: 113, travelers: 2, source: "12306 MCP 2026-05-23精确查询：08:52-09:47，二等座有票" },
      { day: 4, train: "G1378", from: "上饶", to: "常州北", unitCny: 332, travelers: 2, source: "12306 MCP 2026-05-24精确查询：16:31-20:25，当前二等座无票，需候补/刷新" },
    ],
  },
  luggagePolicy: {
    mode: "drop-store-first",
    rules: [
      "5月21日18:00抵达后直接去南昌酒店，不再安排景点。",
      "5月22日演唱会在南昌国际体育中心，白天只安排轻量南昌内容，避免演唱会前疲劳。",
      "5月23日上午带行李从南昌西高铁到上饶，再公共接驳到三清山脚，下午走三清山第一段半日线。",
      "5月24日上午不带箱上山，行李留酒店；中午前后下山取行李，按返程车次去上饶站。",
    ],
  },
  assumptions: [
    "到达点暂按南昌西站；如果实际为南昌站或昌北机场，首日晚间交通需要替换。",
    "南昌酒店继续沿用此前确认的汉庭南昌红谷滩学府大道东地铁站店。",
    "原东线城市行程已完全删除。",
    "三清山按半天+半天拆分：5月23日下午完成金沙索道上站、巨蟒出山、女神峰；5月24日上午按天气和返程票决定是否补阳光海岸/西海岸。",
    "5月24上饶到常州北直达G1378当前无二等座，建议候补；如要确保有票，改用13:53经芜湖到常州的联程方案。",
  ],
  railChecks: {
    source: "12306 MCP",
    checkedAt: "2026-05-10",
    stationCodes: {
      "南昌西": "NXG",
      "南昌东": "NUG",
      "南昌": "NCG",
      "上饶": "SRG",
      "常州": "CZH",
      "常州北": "ESH",
      "芜湖": "WHH",
    },
    items: [
      {
        id: "day3-nanchang-west-shangrao",
        title: "Day 3 南昌 -> 上饶",
        targetDate: "2026-05-23",
        recommendation: "主推G1344南昌西08:52-上饶09:47，二等座113元，有票；从酒店去南昌西相对顺路，能在中午前到上饶接三清山班车。",
        candidates: [
          { train: "G1344", depart: "08:52", arrive: "09:47", duration: "00:55", secondSeat: "113元", status: "有票", note: "主推，站点与酒店方向匹配" },
          { train: "G2760", depart: "09:02", arrive: "10:16", duration: "01:14", secondSeat: "113元", status: "有票", note: "备选，晚29分钟到上饶" },
          { train: "G1382", depart: "07:32", arrive: "08:46", duration: "01:14", secondSeat: "115元", status: "有票", note: "从南昌站出发，太早且离酒店更绕" },
        ],
      },
      {
        id: "day4-shangrao-changzhou",
        title: "Day 4 上饶 -> 常州",
        targetDate: "2026-05-24",
        recommendation: "直达G1378上饶16:31-常州北20:25最符合下午返程和上午三清山半日，但当前二等座无票，需候补/刷新。",
        candidates: [
          { train: "G1378", depart: "16:31", arrive: "20:25", duration: "03:54", secondSeat: "332元", status: "无票", note: "直达常州北，最适合保留上午三清山" },
          { train: "G1528+G7086", depart: "13:53", arrive: "18:22", duration: "04:29", secondSeat: "约300元", status: "二等座有票", note: "上饶->芜湖->常州，同站换乘39分钟，可靠备选但会压缩上午三清山" },
          { train: "G3332", depart: "17:28", arrive: "21:09", duration: "03:41", secondSeat: "276元", status: "二等座无票/无座有票", note: "到武进，不到常州北，且无座不推荐" },
        ],
      },
    ],
  },
  layer3: [
    {
      id: "sanqingshan-layer3",
      poiId: "sanqingshan-jinsha-lower",
      title: "三清山半天+半天精细路线",
      sourceNotes: [
        "高德 POI 校验：金沙索道上/下站、女神峰、巨蟒出山、阳光海岸、西海岸均有可定位点。",
        "索道时间、票务和山上通行受天气/客流影响，出发前需按景区公告和酒店前台刷新。",
      ],
      entrance: {
        recommended: "金沙索道",
        reason: "酒店靠近金沙索道，半天+半天拆分时东上东下最稳。",
        avoid: "外双溪索道会增加跨入口和取行李复杂度，不作为主线。",
      },
      ticketAndCableway: {
        refreshRequired: true,
        officialSource: "三清山旅游网索道收费标准及夏日索道运营时间提醒，2026-05-11访问。",
        eastCablewayDurationMin: 10,
        eastCablewayFare: { upCny: 70, downCny: 55, roundTripCny: 125, source: "三清山东部金沙索道公开收费标准" },
        operatingHours: {
          summer: "6:30-17:30；夏日提醒口径为非周末7:30-17:30、周末7:00-17:30或按客流调整",
          winterWeekend: "7:00-17:00",
          phone: "0793-2407256",
        },
        queueRule: "旅游高峰期间，即使线上/线下已购票，也可能需要现场取号、叫号后排队乘坐索道入园。",
        planningWindow: "5月23日下午先完成核心近线；5月24上午只在返程车次允许时补远线。",
        planningCost: "索道作为交通预算计入；景区大门票和优惠/套票以官方平台当日为准，未并入总预算。",
        lastDownRule: "若买13:53联程，10:45前开始下山；若候补到16:31直达，12:30前开始下山。",
      },
      routeOptions: [
        {
          id: "day3-afternoon-core",
          name: "5月23日下午核心线",
          minutes: 210,
          steps: ["金沙索道下站", "金沙索道上站", "巨蟒出山", "女神峰/东方女神", "原路回金沙索道下山"],
          useWhen: "到三清山脚已是中午后，先拿下最核心、最不绕的标志性景观。",
        },
        {
          id: "day4-morning-extension",
          name: "5月24上午延展线",
          minutes: 240,
          steps: ["金沙索道上站", "阳光海岸", "西海岸视野段", "回金沙索道下山", "酒店取行李去上饶站"],
          useWhen: "天气清楚且拿到16:31直达或更晚可接受车次时执行。",
        },
        {
          id: "ticket-risk-fallback",
          name: "返程票压缩线",
          minutes: 150,
          steps: ["只补巨蟒出山/女神峰附近短线", "不进西海岸远段", "10:45-11:15下山", "赶13:53联程返常州"],
          useWhen: "G1378无票，只能买13:53上饶-芜湖-常州联程时执行。",
        },
      ],
      photoCheckpoints: [
        "巨蟒出山：5月23日下午第一优先级。",
        "女神峰/东方女神：与巨蟒出山相邻，适合第一天下午完成。",
        "阳光海岸：5月24上午天气好再补。",
        "西海岸：只有拿到较晚返程票并且山上能见度好才进入。",
      ],
      supplies: [
        "5月23下午轻装上山，带水、雨衣、防晒和充电宝。",
        "5月24行李留酒店，返程前必须预留取行李和接驳时间。",
      ],
      risks: [
        "G1378直达当前无票，若候补失败必须压缩5月24上午。",
        "索道排队超过45分钟时，5月24不进西海岸远段。",
        "雷雨大雾时只保留近线，不为拍照硬走远栈道。",
      ],
    },
  ],
  mustSeePoiIds: ["nanchang-international-sports-center", "sanqingshan-jinsha-lower"],
  pois: [
    { id: "nanchang-west-station", name: "南昌西站", city: "南昌", type: "station", lng: 115.792938, lat: 28.622886, core: true, openTime: "到达 18:00", rating: null, note: "本版暂按抵达南昌西站处理。" },
    { id: "nanchang-hanting-xuefu-east", name: "汉庭酒店(南昌红谷滩学府大道东地铁站店)", city: "南昌", type: "hotel", lng: 115.839866, lat: 28.658605, core: true, openTime: "固定住宿", rating: 4.7, note: "沿用此前确认的南昌酒店。" },
    { id: "nanchang-vientiane", name: "南昌万象城/赣江南岸", city: "南昌", type: "rest-food", lng: 115.8385, lat: 28.6558, core: true, openTime: "商场营业时间以当日为准", rating: null, note: "21日晚到达后只做晚餐补给。" },
    { id: "jiangxi-museum", name: "江西省博物馆", city: "南昌", type: "museum", lng: 115.881823, lat: 28.7059, core: true, openTime: "周二至周日09:00-17:00，16:00停止入馆", rating: 4.9, note: "22日白天轻量文化内容，可按预约情况保留或删除。" },
    { id: "tengwang-pavilion", name: "滕王阁/老城午餐区", city: "南昌", type: "landmark-food", lng: 115.88111, lat: 28.681387, core: true, openTime: "08:00-22:00", rating: 4.0, note: "省博后顺路午餐和短停，不安排重体力。" },
    { id: "nanchang-international-sports-center", name: "南昌国际体育中心", city: "南昌", type: "concert", lng: 115.819889, lat: 28.620951, core: true, openTime: "演唱会夜以票面为准", rating: 4.9, note: "22日晚演唱会场馆，地址三清山大道333号。" },
    { id: "shangrao-station", name: "上饶站", city: "上饶", type: "station", lng: 118.006797, lat: 28.490464, core: true, openTime: "高铁/接驳枢纽", rating: 4.6, note: "南昌到三清山、三清山返常州的铁路节点。" },
    { id: "sanqingshan-hanting-jinsha", name: "汉庭酒店(上饶三清山金沙索道店)", city: "上饶三清山", type: "hotel", lng: 118.100321, lat: 28.918452, core: true, openTime: "推荐住宿基地", rating: 4.6, note: "靠近金沙索道，适合半天+半天拆分。" },
    { id: "sanqingshan-jinsha-lower", name: "三清山金沙索道下站", city: "上饶三清山", type: "mountain-gate", lng: 118.093508, lat: 28.923283, core: true, openTime: "索道以当日公告为准", rating: 4.3, note: "东部金沙入口。" },
    { id: "sanqingshan-jinsha-upper", name: "三清山金沙索道上站", city: "上饶三清山", type: "cableway", lng: 118.076082, lat: 28.907096, core: true, openTime: "索道以当日公告为准", rating: 4.3, note: "上站后进入山上核心路线。" },
    { id: "sanqingshan-python", name: "三清山巨蟒出山", city: "上饶三清山", type: "photo-spot", lng: 118.069954, lat: 28.905746, core: true, openTime: "07:00-17:30，需当日刷新", rating: 4.2, note: "三清山标志性峰体，23日下午优先。" },
    { id: "sanqingshan-goddess", name: "三清山女神峰/东方女神", city: "上饶三清山", type: "photo-spot", lng: 118.071571, lat: 28.905645, core: true, openTime: "旺季时间需当日刷新", rating: 4.0, note: "与巨蟒出山相邻，适合第一天下午完成。" },
    { id: "sanqingshan-sunshine-coast", name: "三清山阳光海岸", city: "上饶三清山", type: "skywalk", lng: 118.073365, lat: 28.906546, core: true, openTime: "08:00-16:30，需当日刷新", rating: 4.1, note: "24日上午天气好且车票允许时补。" },
    { id: "sanqingshan-west-coast", name: "三清山西海岸景区", city: "上饶三清山", type: "skywalk", lng: 118.06025, lat: 28.904391, core: true, openTime: "旺季时间需当日刷新", rating: 4.2, note: "远段，只在较晚返程票+好天气时进入。" },
    { id: "changzhou-north-station", name: "常州北站", city: "常州", type: "station", lng: 119.954787, lat: 31.853407, core: true, openTime: "24小时", rating: null, note: "直达G1378目标到达站；若买联程则到常州站。" },
  ],
  days: [
    {
      day: 1,
      date: "2026-05-21",
      weekday: "Thu",
      base: "南昌固定酒店",
      theme: "18:00抵达南昌，只做入住和补给",
      load: "约2,000-4,000步；不安排景点",
      poiIds: ["nanchang-west-station", "nanchang-hanting-xuefu-east", "nanchang-vientiane"],
      schedule: [
        "18:00 抵达南昌，暂按南昌西站。",
        "18:30-19:10 打车到汉庭学府大道东店，办理入住。",
        "19:30-21:00 万象城/赣江南岸晚餐补给，早点休息。",
      ],
    },
    {
      day: 2,
      date: "2026-05-22",
      weekday: "Fri",
      base: "南昌固定酒店",
      theme: "白天轻量南昌，晚上南昌国际体育中心演唱会",
      load: "约8,000-11,000步；18:00后留给演唱会",
      poiIds: ["nanchang-hanting-xuefu-east", "jiangxi-museum", "tengwang-pavilion", "nanchang-international-sports-center", "nanchang-hanting-xuefu-east"],
      schedule: [
        "上午睡到自然醒，保留体力。",
        "10:00-12:00 江西省博物馆；若预约失败则改商场/咖啡休息。",
        "12:20-15:00 滕王阁附近午餐和短停，不拉满景点。",
        "15:30-17:20 回酒店休息、换装、充电。",
        "17:30-18:00 出发去南昌国际体育中心；散场后打车/地铁回酒店。",
      ],
    },
    {
      day: 3,
      date: "2026-05-23",
      weekday: "Sat",
      base: "三清山金沙索道口",
      theme: "上午南昌到上饶，下午三清山核心半日",
      load: "约8,000-11,000步；跨城+半日山上核心线",
      poiIds: ["nanchang-hanting-xuefu-east", "nanchang-west-station", "shangrao-station", "sanqingshan-hanting-jinsha", "sanqingshan-jinsha-lower", "sanqingshan-jinsha-upper", "sanqingshan-python", "sanqingshan-goddess", "sanqingshan-jinsha-upper", "sanqingshan-jinsha-lower", "sanqingshan-hanting-jinsha"],
      schedule: [
        "07:45 酒店退房，打车去南昌西站。",
        "08:52-09:47 G1344 南昌西到上饶，二等座113元，12306当前有票。",
        "10:20-12:00 上饶站接公共班车/接驳到三清山金沙索道口，先到酒店寄存/入住。",
        "13:30-16:40 金沙索道上山，完成巨蟒出山、女神峰/东方女神核心半日线。",
        "17:00 下山回酒店，晚餐和休息。",
      ],
    },
    {
      day: 4,
      date: "2026-05-24",
      weekday: "Sun",
      base: "上饶返常州",
      theme: "上午三清山第二个半天，下午高铁返常州",
      load: "约6,000-10,000步；按车票切换远近线",
      poiIds: ["sanqingshan-hanting-jinsha", "sanqingshan-jinsha-lower", "sanqingshan-jinsha-upper", "sanqingshan-sunshine-coast", "sanqingshan-west-coast", "sanqingshan-jinsha-upper", "sanqingshan-jinsha-lower", "sanqingshan-hanting-jinsha", "shangrao-station", "changzhou-north-station"],
      schedule: [
        "07:15 到金沙索道下站，行李留酒店。",
        "07:45-10:45 若买13:53联程，只走近线/短补；不进西海岸远段。",
        "07:45-12:20 若候补到16:31直达G1378，可补阳光海岸+西海岸视野段。",
        "按车票倒推下山：13:53联程需约11:30前离开三清山脚；16:31直达可约14:00前离开。",
        "返程方案A：G1378 上饶16:31-常州北20:25，当前无票需候补。",
        "返程方案B：G1528+G7086 上饶13:53-芜湖-常州18:22，二等座有票，压缩上午三清山。",
      ],
    },
  ],
  dailySegments: [
    { day: 1, from: "nanchang-west-station", to: "nanchang-hanting-xuefu-east", luggage: true, transport: { drivingKm: 8.0, drivingMin: 17, note: "18:00抵达后直接去酒店。" } },
    { day: 1, from: "nanchang-hanting-xuefu-east", to: "nanchang-vientiane", transport: { walkingM: 480, walkingMin: 8, note: "晚餐补给，步行即可。" } },
    { day: 2, from: "nanchang-hanting-xuefu-east", to: "jiangxi-museum", transport: { drivingKm: 8.5, drivingMin: 16, note: "白天轻量文化内容。" } },
    { day: 2, from: "jiangxi-museum", to: "tengwang-pavilion", transport: { drivingKm: 4.3, drivingMin: 12, note: "省博后直接去滕王阁附近午餐，不回头。" } },
    { day: 2, from: "tengwang-pavilion", to: "nanchang-international-sports-center", transport: { drivingKm: 9.8, drivingMin: 24, note: "可先回酒店休息；地图用直连表达演唱会转场。" } },
    { day: 2, from: "nanchang-international-sports-center", to: "nanchang-hanting-xuefu-east", transport: { drivingKm: 5.2, drivingMin: 16, note: "散场后打车/地铁回酒店，预留排队和溢价。" } },
    { day: 3, from: "nanchang-hanting-xuefu-east", to: "nanchang-west-station", luggage: true, transport: { drivingKm: 8.0, drivingMin: 17, note: "退房后带行李去南昌西站。" } },
    { day: 3, from: "nanchang-west-station", to: "shangrao-station", luggage: true, transport: { rail: "G1344 南昌西08:52 -> 上饶09:47，历时55分钟，二等座113元/人，有票。", railMin: 55, note: "12306 MCP 2026-05-23精确查询。" } },
    { day: 3, from: "shangrao-station", to: "sanqingshan-hanting-jinsha", luggage: true, transport: { shuttle: "上饶站旁汽车东站/客运点到三清山旅游班车或公共接驳，按27元/人估算。", shuttleMin: 95, unitCny: 27, note: "先到酒店寄存/入住，再上山。" } },
    { day: 3, from: "sanqingshan-hanting-jinsha", to: "sanqingshan-jinsha-lower", transport: { drivingKm: 1.2, drivingMin: 4, walkingM: 1200, walkingMin: 18, note: "下午上山前节省体力可短打车。" } },
    { day: 3, from: "sanqingshan-jinsha-lower", to: "sanqingshan-jinsha-upper", transport: { cableway: "金沙索道上行，公开票价70元/人次；票务、取号和排队以当日公告为准。", cablewayMin: 10, unitCny: 70, note: "地图用直连表示索道。" } },
    { day: 3, from: "sanqingshan-jinsha-upper", to: "sanqingshan-python", transport: { walkingM: 700, walkingMin: 25, note: "先完成标志性峰体。" } },
    { day: 3, from: "sanqingshan-python", to: "sanqingshan-goddess", transport: { walkingM: 350, walkingMin: 12, note: "相邻核心点。" } },
    { day: 3, from: "sanqingshan-goddess", to: "sanqingshan-jinsha-upper", transport: { walkingM: 850, walkingMin: 35, note: "第一天下午不走远线，回索道下山。" } },
    { day: 3, from: "sanqingshan-jinsha-upper", to: "sanqingshan-jinsha-lower", transport: { cableway: "金沙索道下行，公开票价55元/人次；注意末班、取号和排队。", cablewayMin: 10, unitCny: 55, note: "下山回酒店。" } },
    { day: 3, from: "sanqingshan-jinsha-lower", to: "sanqingshan-hanting-jinsha", transport: { drivingKm: 1.2, drivingMin: 4, walkingM: 1200, walkingMin: 18, note: "回酒店休息。" } },
    { day: 4, from: "sanqingshan-hanting-jinsha", to: "sanqingshan-jinsha-lower", transport: { drivingKm: 1.2, drivingMin: 4, walkingM: 1200, walkingMin: 18, note: "行李留酒店，轻装上山。" } },
    { day: 4, from: "sanqingshan-jinsha-lower", to: "sanqingshan-jinsha-upper", transport: { cableway: "金沙索道上行，第二个半天再次上山，按70元/人次估算。", cablewayMin: 10, unitCny: 70, note: "按返程票决定走远近线。" } },
    { day: 4, from: "sanqingshan-jinsha-upper", to: "sanqingshan-sunshine-coast", transport: { walkingM: 1100, walkingMin: 45, note: "天气好且返程票允许时保留。" } },
    { day: 4, from: "sanqingshan-sunshine-coast", to: "sanqingshan-west-coast", transport: { walkingM: 1800, walkingMin: 70, note: "远线，13:53联程时删除。" } },
    { day: 4, from: "sanqingshan-west-coast", to: "sanqingshan-jinsha-upper", transport: { walkingM: 2200, walkingMin: 85, note: "若时间不足，必须提前折返。" } },
    { day: 4, from: "sanqingshan-jinsha-upper", to: "sanqingshan-jinsha-lower", transport: { cableway: "金沙索道下行，第二个半天返回，按55元/人次估算。", cablewayMin: 10, unitCny: 55, note: "下山取行李。" } },
    { day: 4, from: "sanqingshan-jinsha-lower", to: "sanqingshan-hanting-jinsha", transport: { drivingKm: 1.2, drivingMin: 4, walkingM: 1200, walkingMin: 18, note: "回酒店取行李。" } },
    { day: 4, from: "sanqingshan-hanting-jinsha", to: "shangrao-station", luggage: true, transport: { shuttle: "三清山脚到上饶站公共班车/接驳，按27元/人估算。", shuttleMin: 95, unitCny: 27, note: "按返程票倒推发车时间。" } },
    { day: 4, from: "shangrao-station", to: "changzhou-north-station", luggage: true, transport: { rail: "G1378 上饶16:31 -> 常州北20:25，历时3小时54分，二等座332元/人，当前无票需候补；可靠备选为13:53经芜湖到常州。", railMin: 234, note: "12306 MCP 2026-05-24精确查询。" } },
  ],
};

if (typeof module !== "undefined") {
  module.exports = { tripData };
}

if (typeof window !== "undefined") {
  window.TRIP_DATA = tripData;
}
