var AI_CHAT_STATE = {
  presetId: 'general',
  messages: [],
  isLoading: false,
  abortController: null
};

var AI_MAX_HISTORY_MESSAGES = 24;
var AI_CHAT_PRESETS = {
  general: {
    id: 'general',
    label: 'Tổng hợp',
    contextBuilder: 'buildAIQuickQAContext',
    systemPrompt: [
      'Ban la tro ly AI cho nhan vien ban hang Vinamilk dung app VNM Order.',
      'Chi duoc tra loi dua tren context duoc cung cap.',
      'Neu khong du thong tin, phai noi ro khong co trong du lieu hien tai.',
      'Tra loi bang tieng Viet ngan gon, uu tien ma SP, ten SP, gia lon/thung va ten CTKM.',
      'Neu cau hoi ve gia thi uu tien format: Ma SP, Ten SP, Gia lon, Gia thung.',
      'Neu cau hoi ve CTKM thi uu tien format: CTKM, Loai, Ap ma, Dieu kien chinh.',
      'Khong dung markdown, khong them dau **, khong viet dai dong.',
      'Khong tu suy dien chi tiet CTKM neu context chua du.'
    ].join(' ')
  },
  product: {
    id: 'product',
    label: 'Sản phẩm',
    contextBuilder: 'buildAIProductOnlyContext',
    systemPrompt: [
      'Ban la tro ly chuyen tra loi ve san pham trong VNM Order.',
      'Chi duoc tra loi dua tren context san pham duoc cung cap.',
      'Neu co ket qua, phai uu tien format tung dong ngan gon nhu sau:',
      'Ma SP: ...',
      'Ten: ...',
      'Nhom: ...',
      'Gia lon: ...',
      'Gia thung: ...',
      'Neu khong co thong tin thi phai noi ro khong co trong du lieu hien tai.',
      'Khong nhac CTKM neu cau hoi khong yeu cau.'
    ].join(' ')
  },
  promo: {
    id: 'promo',
    label: 'CTKM',
    contextBuilder: 'buildAIPromotionOnlyContext',
    systemPrompt: [
      'Ban la tro ly chuyen tra loi ve chuong trinh khuyen mai trong VNM Order.',
      'Chi duoc tra loi dua tren context CTKM duoc cung cap.',
      'Neu co ket qua, phai uu tien format tung muc ngan gon nhu sau:',
      'CTKM: ...',
      'Loai: ...',
      'Ap ma: ...',
      'Dieu kien: ...',
      'Neu khong co thong tin thi phai noi ro khong co trong du lieu hien tai.',
      'Khong bo sung gia san pham neu context khong co.'
    ].join(' ')
  }
};

function getAIPreset(presetId) {
  return AI_CHAT_PRESETS[presetId] || AI_CHAT_PRESETS.general;
}

function setAIChatPreset(presetId) {
  AI_CHAT_STATE.presetId = getAIPreset(presetId).id;
  saveAIChatHistory();
  return AI_CHAT_STATE.presetId;
}

function getAIChatState() {
  return AI_CHAT_STATE;
}

function loadAIChatHistory() {
  try {
    var stored = JSON.parse(localStorage.getItem(LS_KEYS.AI_CHAT) || 'null');
    if (stored && Array.isArray(stored.messages)) {
      AI_CHAT_STATE.messages = stored.messages.slice(-AI_MAX_HISTORY_MESSAGES);
      AI_CHAT_STATE.presetId = getAIPreset(stored.presetId).id;
    }
  } catch (e) {}
  return AI_CHAT_STATE.messages;
}

function saveAIChatHistory() {
  localStorage.setItem(LS_KEYS.AI_CHAT, JSON.stringify({
    presetId: AI_CHAT_STATE.presetId,
    messages: AI_CHAT_STATE.messages.slice(-AI_MAX_HISTORY_MESSAGES)
  }));
  if (window.lsCheckQuota) lsCheckQuota();
}

function clearAIChat() {
  AI_CHAT_STATE.messages = [];
  saveAIChatHistory();
}

function cancelAIMessage() {
  if (AI_CHAT_STATE.abortController) AI_CHAT_STATE.abortController.abort();
}

async function sendAIMessage(userMessage) {
  var text = String(userMessage || '').trim();
  if (!text) throw new Error('Nhập câu hỏi trước khi gửi');
  if (AI_CHAT_STATE.isLoading) throw new Error('AI đang xử lý câu hỏi trước');

  AI_CHAT_STATE.messages.push({ role: 'user', content: text, ts: Date.now() });
  saveAIChatHistory();

  AI_CHAT_STATE.isLoading = true;
  AI_CHAT_STATE.abortController = new AbortController();

  var preset = getAIPreset(AI_CHAT_STATE.presetId);
  var contextBuilder = window[preset.contextBuilder];
  if (typeof contextBuilder !== 'function') throw new Error('Thiếu context builder cho preset ' + preset.label);
  var context = contextBuilder(text);
  var apiMessages = [{ role: 'system', content: preset.systemPrompt + '\n\n' + context }]
    .concat(AI_CHAT_STATE.messages.slice(-12).map(function(message) {
      return { role: message.role, content: message.content };
    }));

  try {
    var response = await callAI(apiMessages, {
      signal: AI_CHAT_STATE.abortController.signal,
      temperature: 0.2,
      maxTokens: 700
    });
    AI_CHAT_STATE.messages.push({ role: 'assistant', content: response, ts: Date.now() });
    saveAIChatHistory();
    return response;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error('Đã hủy yêu cầu AI');
    }
    throw err;
  } finally {
    AI_CHAT_STATE.isLoading = false;
    AI_CHAT_STATE.abortController = null;
  }
}

loadAIChatHistory();

window.getAIChatState = getAIChatState;
window.getAIPreset = getAIPreset;
window.setAIChatPreset = setAIChatPreset;
window.AI_CHAT_PRESETS = AI_CHAT_PRESETS;
window.loadAIChatHistory = loadAIChatHistory;
window.saveAIChatHistory = saveAIChatHistory;
window.clearAIChat = clearAIChat;
window.cancelAIMessage = cancelAIMessage;
window.sendAIMessage = sendAIMessage;