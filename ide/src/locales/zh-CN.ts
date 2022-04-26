export default {
  // action
  at: {
    agree: '同意',
    clone: '克隆',
    collide: '碰撞检测',
    dance: '跳舞',
    detect: '检测',
    die: '消失',
    do: '执行',
    delayExecute: '延迟',
    close: '关闭',
    else: '否则',
    equal: '判断',
    findUnit: '查找对象',
    gesture: '手势检测',
    get: '获取',
    headShake: '摇头',
    idle: '空闲',
    if: '如果',
    ifElse: '如果',
    jump: '跳跃',
    then: '那么',
    loop: '循环',
    loopUntill: '循环直到',
    move: '移动',
    open: '打开',
    playSound: '播放音效',
    stopSound: '停止音效',
    repeat: '重复',
    run: '跑步',
    say: '说话',
    scale: '缩放',
    set: '设置',
    sneakPose: '潜行',
    start: '开始',
    stop: '停止',
    thumbsUp: '点赞',
    time: '当前时间',
    to3D: '转3D坐标',
    turn: '转向',
    valueFromEvent: '从事件中获取值',
    walk: '走路',
    walkJump: '走路跳跃',
    wave: '挥手',
    while: '循环',
    math: {
      add: '加',
      div: '除',
      equal: '判断',
      greaterThen: '大于',
      greaterThenOrEqual: '大于等于',
      lessThen: '小于',
      lessThenOrEqual: '小于等于',
      mul: '乘',
      mod: '取余',
      not: '取反',
      sub: '减',
      random: '随机',
    },
    var: {
      new: '新建变量',
    },
  },
  // event
  ev: {
    change: '有变化',
    clone: '克隆',
    collide: '碰撞检测',
    gesture: '监测到手势',
    frame: '每帧',
    pose: '监测到姿势',
    say: '人有说话',
    start: '开始',
    stop: '停止',
  },
  // name
  nm: {
    all: '全部',
    ambient: '环境光',
    box: '盒子',
    bulb: '灯泡',
    camera: '相机',
    cube: '立方体',
    chick: 'EGG',
    cloth: '布料',
    death: '死亡',
    default: '默认',
    device: '设备',
    egg: 'EGG',
    five: '手掌',
    fist: '拳头',
    frame: '帧',
    gesture: '手势',
    global: '全局',
    ground: '地面',
    image: '图片',
    joystick: '摇杆',
    light: '光源',
    logic: '逻辑',
    material: '材质',
    math: '数学',
    millisecond: '毫秒',
    name: '名称',
    plane: '平面',
    pose: '姿势',
    position: '位置',
    punch: '拳击',
    readonly: '不可编辑',
    rotation: '旋转',
    second: '秒',
    scene: '场景',
    screen: '屏幕',
    skeleton: '骨骼',
    speech: '语音',
    sphere: '球体',
    spot: '点光源',
    storage: '存储',
    test: '测试',
    text: '文本',
    texture: '纹理',
    time: '时间',
    times: '次',
    timer: '计时器',
    type: '类型',
    value: '值',
    variable: '变量',
    victory: 'V字形',
    unit: '对象',
    wind: '风',
    rubik: '魔方',
  },
  // property
  pr: {
    unit: {
      color: '颜色',
      material: '材质',
      name: '名称',
      mass: '质量',
      velocity: '速度',
      force: '外力',
      friction: '摩擦系数',
      restitution: '恢复系数',
      position: '位置',
      power: '功率',
      rotation: '方向',
      radius: '半径',
      visible: '是否可见',
      distance: '距离',
      width: '宽度',
      height: '高度',
      depth: '深度',
      ground: {
        material: '材质',
      },
      light: {
        on: '开关',
        color: '颜色',
        intensity: '强度',
        position: '位置',
      },
      sky: {
        color: '天空颜色',
      },
      spot: {
        on: '开关',
        color: '颜色',
        intensity: '强度',
        position: '位置',
      },
      ambient: {
        on: '开关',
        color: '颜色',
      },
      wind: {
        force: '风力',
      },
      widthSegments: '宽度分段',
      heightSegments: '高度分段',
      scale: '缩放',
    },
    texture: {
      offset: '偏移',
      repeat: '重复',
      center: '中心',
      mapping: '映射',
      wrapS: 'S方向',
      wrapT: 'T方向',
      magFilter: '放大过滤',
      minFilter: '缩小过滤',
      format: '格式',
      type: '类型',
      anisotropy: '各向异性',
      encoding: '编码',
    },
    material: {
      name: '材质',
    },
  },
  // sentence
  se: {
    and: '和',
    from: '从',
    milliseconds: '毫秒',
    placeHolder: '可拖放$0到此',
    same: '相同',
    to: '到',
    tois: '为',
    valueof: '的值',
    logic: {
      else: '否则',
      then: '那么',
      times: '次',
    },
    // symbol
    math: {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '==': '==',
      '>': '>',
      '>=': '>=',
      '<': '<',
      '<=': '<=',
      '!': '!',
      '%': '%',
    },
  },
  // state
  st: {
    running: '跑步',
    sadPose: '悲伤',
    sitting: '坐下',
    standing: '站立',
    tPose: 'T字型',
    walking: '走路',
  },
  // type
  ty: {
    data: {
      boolean: '布尔值',
      number: '数字',
      string: '字符串',
      time: '时间',
      color: '颜色',
      vec2: '二维坐标',
      vec3: '三维坐标',
      json: 'JSON',
      octets: '二进制',
      stream: '流',
      texture: '纹理',
      material: '材质',
      unit: '对象',
      unknown: '未知',
    },
    material: {
      linebasic: '线材质',
      linedashed: '虚线材质',
      basic: '基础材质',
      depth: '深度材质',
      distance: '距离材质',
      lambert: '拉米特材质',
      matcap: 'Matcap材质',
      normal: '法线材质',
      phong: 'Phong材质',
      physical: '物理材质',
      standard: '标准材质',
      toon: 'Toon材质',
      points: '点材质',
      shader: '着色器材质',
      shadow: '阴影材质',
      sprite: '精灵材质',
    },
  },
  g: {
    zh: '中文',
    en: '英文',
  },
};
