const SUBJECTS = [
  ['chinese', '语文'],
  ['math', '数学'],
  ['english', '英语'],
  ['physics', '物理'],
  ['chemistry', '化学'],
  ['biology', '生物']
];

const state = {
  exams: [],
  editingIndex: null,
  search: ''
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function createEmptyExam() {
  return {
    date: '',
    exam: '',
    scores: Object.fromEntries(SUBJECTS.map(([key]) => [key, ''])),
    total: ''
  };
}

function normalizeExam(item) {
  if (!item || typeof item !== 'object') return null;
  const exam = String(item.exam ?? '').trim();
  const date = String(item.date ?? '').trim();
  if (!exam || !date) return null;

  const scores = {};
  for (const [key] of SUBJECTS) {
    const n = Number(item.scores?.[key]);
    scores[key] = Number.isFinite(n) ? n : 0;
  }

  const computed = SUBJECTS.reduce((sum, [key]) => sum + scores[key], 0);
  const totalNumber = Number(item.total);
  const total = Number.isFinite(totalNumber) ? totalNumber : computed;

  return { date, exam, scores, total };
}

function normalizePayload(payload) {
  const raw = Array.isArray(payload) ? payload : payload?.exams;
  if (!Array.isArray(raw)) throw new Error('JSON 中没有找到 exams 数组。');
  return raw.map(normalizeExam).filter(Boolean);
}

async function loadDefaultData() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('data.json 加载失败');
    const payload = await response.json();
    state.exams = normalizePayload(payload);
    setStatus(`已载入 data.json · ${state.exams.length} 场`);
  } catch (error) {
    console.warn(error);
    state.exams = [];
    setStatus('等待导入 JSON');
  }
  renderAll();
}

function setStatus(text) {
  $('#statusText').textContent = text;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function formatDate(date) {
  return String(date || '').replace(/-/g, '.');
}

function sortedIndexes() {
  return state.exams
    .map((exam, index) => ({ exam, index }))
    .sort((a, b) => {
      const dateCompare = a.exam.date.localeCompare(b.exam.date);
      return dateCompare || a.index - b.index;
    })
    .map(item => item.index);
}

function renderList() {
  const list = $('#recordList');
  const empty = $('#emptyList');
  const query = state.search.toLowerCase().trim();
  list.innerHTML = '';

  const indexes = sortedIndexes().filter(index => {
    if (!query) return true;
    return state.exams[index].exam.toLowerCase().includes(query);
  });

  empty.hidden = state.exams.length > 0;
  if (state.exams.length > 0 && indexes.length === 0) {
    list.innerHTML = '<div class="empty-state"><strong>没有匹配的考试</strong><span>换一个考试名称关键词试试。</span></div>';
    empty.hidden = true;
  }

  indexes.forEach(index => {
    const exam = state.exams[index];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `record-item${state.editingIndex === index ? ' active' : ''}`;
    button.innerHTML = `
      <div>
        <div class="record-name" title="${escapeHtml(exam.exam)}">${escapeHtml(exam.exam)}</div>
        <div class="record-date">${escapeHtml(formatDate(exam.date))}</div>
      </div>
      <div>
        <div class="record-total">${exam.total}</div>
        <small>总分</small>
      </div>
    `;
    button.addEventListener('click', () => beginEdit(index));
    list.appendChild(button);
  });

  $('#recordCount').textContent = `${state.exams.length} 场考试`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function renderForm() {
  const isEdit = state.editingIndex !== null;
  const exam = isEdit ? state.exams[state.editingIndex] : createEmptyExam();

  $('#formTitle').textContent = isEdit ? '编辑考试' : '添加考试';
  $('#deleteButton').hidden = !isEdit;
  $('#dateInput').value = exam.date || '';
  $('#examInput').value = exam.exam || '';
  SUBJECTS.forEach(([key]) => {
    const input = document.querySelector(`[data-score="${key}"]`);
    input.value = exam.scores[key] ?? '';
  });
  $('#totalInput').value = exam.total ?? '';
}

function renderAll() {
  renderList();
  renderForm();
}

function beginAdd() {
  state.editingIndex = null;
  renderAll();
  $('#dateInput').focus();
}

function beginEdit(index) {
  state.editingIndex = index;
  renderAll();
}

function recalculateTotal() {
  let total = 0;
  let valid = true;
  SUBJECTS.forEach(([key]) => {
    const value = Number(document.querySelector(`[data-score="${key}"]`).value);
    if (!Number.isFinite(value)) valid = false;
    total += Number.isFinite(value) ? value : 0;
  });
  if (valid) $('#totalInput').value = total;
}

function readForm() {
  const date = $('#dateInput').value.trim();
  const exam = $('#examInput').value.trim();
  if (!date) throw new Error('请填写考试日期。');
  if (!exam) throw new Error('请填写考试名称。');

  const scores = {};
  for (const [key, name] of SUBJECTS) {
    const raw = document.querySelector(`[data-score="${key}"]`).value.trim();
    if (raw === '') throw new Error(`请填写${name}成绩。`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name}成绩格式不正确。`);
    scores[key] = value;
  }

  const totalRaw = $('#totalInput').value.trim();
  if (totalRaw === '') throw new Error('请填写总成绩，或点击“自动计算”。');
  const total = Number(totalRaw);
  if (!Number.isFinite(total) || total < 0) throw new Error('总成绩格式不正确。');

  return { date, exam, scores, total };
}

function saveForm(event) {
  event.preventDefault();
  try {
    const exam = readForm();
    if (state.editingIndex === null) {
      state.exams.push(exam);
      state.editingIndex = state.exams.length - 1;
      showToast('考试记录已添加');
    } else {
      state.exams[state.editingIndex] = exam;
      showToast('考试记录已更新');
    }
    state.exams = normalizePayload({ exams: state.exams });
    setStatus(`已修改 · ${state.exams.length} 场`);
    renderAll();
  } catch (error) {
    showToast(error.message);
  }
}

function deleteCurrent() {
  if (state.editingIndex === null) return;
  const exam = state.exams[state.editingIndex];
  if (!window.confirm(`确定删除“${exam.exam}”吗？`)) return;
  state.exams.splice(state.editingIndex, 1);
  state.editingIndex = null;
  setStatus(`已删除 · ${state.exams.length} 场`);
  showToast('考试记录已删除');
  renderAll();
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      state.exams = normalizePayload(payload);
      state.editingIndex = null;
      setStatus(`已导入 ${file.name} · ${state.exams.length} 场`);
      showToast('JSON 导入成功');
      renderAll();
    } catch (error) {
      showToast(`导入失败：${error.message}`);
    }
    $('#importFile').value = '';
  };
  reader.readAsText(file, 'utf-8');
}

function exportJson() {
  const payload = JSON.stringify({ exams: state.exams }, null, 2);
  const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `data-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`已导出 · ${state.exams.length} 场`);
  showToast('JSON 已导出');
}

function resetForm() {
  renderForm();
  if (state.editingIndex === null) $('#examForm').reset();
}

$('#addButton').addEventListener('click', beginAdd);
$('#deleteButton').addEventListener('click', deleteCurrent);
$('#examForm').addEventListener('submit', saveForm);
$('#recalcButton').addEventListener('click', recalculateTotal);
$('#resetButton').addEventListener('click', resetForm);
$('#exportButton').addEventListener('click', exportJson);
$('#importFile').addEventListener('change', (event) => importJson(event.target.files[0]));
$('#searchInput').addEventListener('input', (event) => {
  state.search = event.target.value;
  renderList();
});

loadDefaultData();
