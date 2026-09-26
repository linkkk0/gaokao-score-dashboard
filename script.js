const chartConfig = {
  total: {
    label: '总成绩',
    subtitle: '每场考试的总分变化趋势',
    getValue: (item) => item.total
  },
  chinese: {
    label: '语文',
    subtitle: '语文成绩变化趋势',
    getValue: (item) => item.scores.chinese
  },
  math: {
    label: '数学',
    subtitle: '数学成绩变化趋势',
    getValue: (item) => item.scores.math
  },
  english: {
    label: '英语',
    subtitle: '英语成绩变化趋势',
    getValue: (item) => item.scores.english
  },
  physics: {
    label: '物理',
    subtitle: '物理成绩变化趋势',
    getValue: (item) => item.scores.physics
  },
  chemistry: {
    label: '化学',
    subtitle: '化学成绩变化趋势',
    getValue: (item) => item.scores.chemistry
  },
  biology: {
    label: '生物',
    subtitle: '生物成绩变化趋势',
    getValue: (item) => item.scores.biology
  }
};

const subjectNames = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  biology: '生物'
};

const SVG_NS = 'http://www.w3.org/2000/svg';

const state = {
  exams: [],
  activeKey: 'total',
  activeIndex: null,
  tooltip: null,
  resizeFrame: null
};

const $ = (selector) => document.querySelector(selector);

async function loadData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('data.json 加载失败');
    const payload = await response.json();
    const data = Array.isArray(payload) ? payload : payload.exams;

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('成绩数据为空');
    }

    state.exams = data
      .map(normalizeExam)
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));

    updateSummary();
    renderChart();
  } catch (error) {
    console.error(error);
    state.exams = [];
    $('#chartEmpty').hidden = false;
  }
}

function normalizeExam(item) {
  if (!item || !item.date || !item.exam || !item.scores) return null;

  const scoreKeys = Object.keys(subjectNames);
  const scores = {};
  for (const key of scoreKeys) {
    const value = Number(item.scores[key]);
    scores[key] = Number.isFinite(value) ? value : 0;
  }

  const total = Number.isFinite(Number(item.total))
    ? Number(item.total)
    : scoreKeys.reduce((sum, key) => sum + scores[key], 0);

  return {
    date: item.date,
    exam: item.exam,
    scores,
    total
  };
}

function updateSummary() {
  $('#examCount').textContent = state.exams.length;
  $('#latestScore').textContent = state.exams[state.exams.length - 1]?.total ?? '—';
}

function setActiveTab(key) {
  state.activeKey = key;
  state.activeIndex = null;

  document.querySelectorAll('.tab').forEach((button) => {
    const active = button.dataset.key === key;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  if (state.tooltip) state.tooltip.remove();
  state.tooltip = null;
  renderChart();
}

function renderChart() {
  const svg = $('#scoreChart');
  const wrap = $('#chartWrap');
  const empty = $('#chartEmpty');
  const config = chartConfig[state.activeKey];

  if (!svg || !wrap || !config) return;
  if (!state.exams.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  $('#chartTitle').textContent = config.label;
  $('#chartSubtitle').textContent = config.subtitle;

  const rect = wrap.getBoundingClientRect();
  const width = Math.max(rect.width - 36, 540);
  const height = Math.max(rect.height - 24, 320);
  const margin = {
    top: 26,
    right: window.innerWidth <= 760 ? 22 : 40,
    bottom: 62,
    left: window.innerWidth <= 760 ? 46 : 54
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.replaceChildren();

  const values = state.exams.map(config.getValue);
  const { min, max, ticks } = niceScale(values);
  $('#rangeNote').textContent = `纵轴 ${formatScore(min)}–${formatScore(max)}`;

  drawGrid(svg, margin, plotWidth, plotHeight, ticks, min, max);
  drawDateLabels(svg, margin, plotWidth, plotHeight);

  const points = values.map((value, index) => ({
    x: margin.left + (state.exams.length === 1 ? plotWidth / 2 : (index / (state.exams.length - 1)) * plotWidth),
    y: margin.top + (1 - (value - min) / (max - min)) * plotHeight,
    value,
    index
  }));

  drawFill(svg, points, margin, plotHeight);
  drawLine(svg, points);
  drawPoints(svg, points, config);
}

function niceScale(values) {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(rawMax - rawMin, 1);
  const padding = span * 0.18;
  const lower = rawMin - padding;
  const upper = rawMax + padding;
  const targetTicks = 6;
  const roughStep = (upper - lower) / (targetTicks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;
  const multiplier = residual >= 7.5 ? 10 : residual >= 3.5 ? 5 : residual >= 1.5 ? 2 : 1;
  const step = multiplier * magnitude;
  const min = Math.floor(lower / step) * step;
  const max = Math.ceil(upper / step) * step;
  const ticks = [];

  for (let value = min; value <= max + step * 0.001; value += step) {
    ticks.push(Number(value.toFixed(8)));
  }

  if (ticks.length < 4) {
    return niceScaleWithTicks(rawMin, rawMax, 5);
  }

  return { min, max, ticks };
}

function niceScaleWithTicks(rawMin, rawMax, count) {
  const span = Math.max(rawMax - rawMin, 1);
  const step = span / Math.max(count - 1, 1);
  const min = rawMin - step;
  const max = rawMax + step;
  const ticks = Array.from({ length: count }, (_, i) => min + i * ((max - min) / (count - 1)));
  return { min, max, ticks };
}

function drawGrid(svg, margin, plotWidth, plotHeight, ticks, min, max) {
  ticks.forEach((tick) => {
    const y = margin.top + (1 - (tick - min) / (max - min)) * plotHeight;
    const line = svgEl('line', {
      x1: margin.left,
      x2: margin.left + plotWidth,
      y1: y,
      y2: y,
      class: 'grid-line'
    });
    svg.appendChild(line);

    const label = svgEl('text', {
      x: margin.left - 12,
      y: y + 4,
      'text-anchor': 'end',
      class: 'axis-label'
    });
    label.textContent = formatScore(tick);
    svg.appendChild(label);
  });
}

function drawDateLabels(svg, margin, plotWidth, plotHeight) {
  const maxLabels = window.innerWidth <= 760 ? 4 : 6;
  const step = Math.max(1, Math.ceil((state.exams.length - 1) / (maxLabels - 1)));
  const indices = [];

  for (let i = 0; i < state.exams.length; i += step) indices.push(i);
  if (indices[indices.length - 1] !== state.exams.length - 1) indices.push(state.exams.length - 1);

  indices.forEach((index) => {
    const x = margin.left + (state.exams.length === 1 ? plotWidth / 2 : (index / (state.exams.length - 1)) * plotWidth);
    const label = svgEl('text', {
      x,
      y: margin.top + plotHeight + 33,
      'text-anchor': index === 0 ? 'start' : index === state.exams.length - 1 ? 'end' : 'middle',
      class: 'date-label'
    });
    label.textContent = formatDate(state.exams[index].date);
    svg.appendChild(label);
  });
}

function drawFill(svg, points, margin, plotHeight) {
  const baseline = margin.top + plotHeight;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    + ` L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  svg.appendChild(svgEl('path', {
    d: path,
    class: 'chart-area-fill'
  }));
}

function drawLine(svg, points) {
  const d = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  svg.appendChild(svgEl('path', {
    d,
    class: 'chart-area'
  }));
}

function drawPoints(svg, points, config) {
  points.forEach((point) => {
    const group = svgEl('g', {
      class: 'point-group',
      tabindex: '0',
      role: 'button',
      'aria-label': `${state.exams[point.index].exam}，${config.label}${point.value}分`
    });

    const crosshair = svgEl('line', {
      x1: point.x,
      x2: point.x,
      y1: 26,
      y2: point.y,
      class: 'crosshair'
    });

    const halo = svgEl('circle', {
      cx: point.x,
      cy: point.y,
      r: 13,
      class: 'point-halo'
    });

    const dot = svgEl('circle', {
      cx: point.x,
      cy: point.y,
      r: 4.5,
      class: 'point-dot'
    });

    // 独立的点击/悬浮感应区域，避免必须精准指向圆心。
    const hit = svgEl('circle', {
      cx: point.x,
      cy: point.y,
      r: 20,
      class: 'point-hit'
    });

    group.append(crosshair, halo, dot, hit);
    svg.appendChild(group);

    group.addEventListener('pointerenter', () => showTooltip(point, group));
    group.addEventListener('pointerleave', hideTooltip);
    group.addEventListener('focus', () => showTooltip(point, group));
    group.addEventListener('blur', () => {
      if (!group.matches(':hover')) hideTooltip();
    });
  });
}

function showTooltip(point, group) {
  if (state.tooltip) state.tooltip.remove();

  const exam = state.exams[point.index];
  const wrapper = $('#chartWrap');
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';

  if (state.activeKey === 'total') {
    tooltip.innerHTML = `
      <div class="tooltip-title">${escapeHtml(formatDate(exam.date))}</div>
      <div class="tooltip-exam">${escapeHtml(exam.exam)}</div>
      <div class="tooltip-score">${formatScore(exam.total)}<small>总分</small></div>
      <div class="tooltip-grid">
        ${Object.entries(subjectNames).map(([key, label]) => `
          <div class="tooltip-subject"><span>${label}</span><strong>${formatScore(exam.scores[key])}</strong></div>
        `).join('')}
      </div>
    `;
  } else {
    const score = chartConfig[state.activeKey].getValue(exam);
    tooltip.innerHTML = `
      <div class="tooltip-title">${escapeHtml(formatDate(exam.date))}</div>
      <div class="tooltip-exam">${escapeHtml(exam.exam)}</div>
      <div class="tooltip-score">${formatScore(score)}<small>${chartConfig[state.activeKey].label}</small></div>
    `;
  }

  wrapper.appendChild(tooltip);
  state.tooltip = tooltip;
  state.activeIndex = point.index;

  // 使用节点自己的屏幕坐标，而不是手算 viewBox 比例，确保 preserveAspectRatio
  // 和不同窗口尺寸下弹窗始终与实际统计点精准对齐。
  const wrapRect = wrapper.getBoundingClientRect();
  const screenPoint = svgPointToScreen($('#scoreChart'), point.x, point.y);
  const x = screenPoint.x - wrapRect.left;
  const y = screenPoint.y - wrapRect.top;

  const horizontalPadding = 8;
  const tooltipWidth = tooltip.offsetWidth;
  const safeX = Math.max(
    tooltipWidth / 2 + horizontalPadding,
    Math.min(wrapRect.width - tooltipWidth / 2 - horizontalPadding, x)
  );

  // 默认从点的上方“冒出”；顶部空间不足时自动翻到点下方，避免被容器裁切。
  const preferAbove = y > tooltip.offsetHeight + 34;
  if (!preferAbove) tooltip.classList.add('is-below');

  tooltip.style.left = `${safeX}px`;
  tooltip.style.top = `${y}px`;

  // 强制下一帧进入可见状态，确保浏览器能执行冒出动画。
  requestAnimationFrame(() => tooltip.classList.add('is-visible'));

  document.querySelectorAll('.point-group').forEach((item, index) => {
    item.classList.toggle('is-active', index === point.index);
  });
}

function svgPointToScreen(svg, x, y) {
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  const ctm = svg.getScreenCTM();

  if (ctm) {
    const screen = point.matrixTransform(ctm);
    return { x: screen.x, y: screen.y };
  }

  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  return {
    x: rect.left + (x / vb.width) * rect.width,
    y: rect.top + (y / vb.height) * rect.height
  };
}

function hideTooltip() {
  if (document.activeElement?.closest('.point-group')) return;
  state.activeIndex = null;
  document.querySelectorAll('.point-group').forEach((group) => group.classList.remove('is-active'));
  if (state.tooltip) state.tooltip.remove();
  state.tooltip = null;
}

function svgEl(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatScore(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(1);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.key));
});

window.addEventListener('resize', () => {
  cancelAnimationFrame(state.resizeFrame);
  state.resizeFrame = requestAnimationFrame(renderChart);
});

loadData();
