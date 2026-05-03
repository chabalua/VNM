var _aiSettingsOpen = false;
var _aiDraftInput = '';
var _aiTestState = { status: '', tone: '' };

function aiCanSendWithoutKey(profile) {
  return !!(profile && profile.apiKey) || isAIMockMode();
}

function aiEscapeMultiline(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function aiRenderProfileOptions(activeId) {
  return getAIProfiles().map(function(profile) {
    return '<option value="' + escapeHtmlAttr(profile.id) + '"' + (profile.id === activeId ? ' selected' : '') + '>' + escapeHtml(profile.name) + '</option>';
  }).join('');
}

function aiRenderPresetChips(activePresetId) {
  return Object.keys(AI_CHAT_PRESETS).map(function(key) {
    var preset = AI_CHAT_PRESETS[key];
    return '<button class="ai-preset-chip' + (preset.id === activePresetId ? ' is-active' : '') + '" type="button" onclick="aiSelectPreset(\'' + escapeHtmlAttr(preset.id) + '\')">' + escapeHtml(preset.label) + '</button>';
  }).join('');
}

function aiRenderMessages(state) {
  if (!state.messages.length) {
    return '<div class="ai-empty-state">'
      + '<div class="ai-empty-badge">Quick Q&amp;A</div>'
      + '<div class="ai-empty-title">Hỏi nhanh về sản phẩm và CTKM</div>'
      + '<div class="ai-empty-copy">AI sẽ ưu tiên dữ liệu sản phẩm và CTKM đang có trong cache của app. Hãy bắt đầu với một mã SP, tên sản phẩm hoặc câu hỏi giá ngắn.</div>'
      + '<div class="ai-empty-suggestions">'
        + '<button class="ai-suggestion-chip" type="button" onclick="aiUseSuggestion(\'01SX05 co km gi?\')">01SX05 có KM gì?</button>'
        + '<button class="ai-suggestion-chip" type="button" onclick="aiUseSuggestion(\'gia sua khong duong 1 thung\')">Giá sữa không đường 1 thùng</button>'
        + '<button class="ai-suggestion-chip" type="button" onclick="aiUseSuggestion(\'nhom C co san pham nao\')">Nhóm C có sản phẩm nào?</button>'
      + '</div>'
      + '</div>';
  }
  return state.messages.map(function(message) {
    var roleLabel = message.role === 'user' ? 'Bạn' : 'AI';
    return '<div class="ai-msg ai-msg-' + message.role + '">'
      + '<div class="ai-msg-meta">' + roleLabel + '</div>'
      + '<div class="ai-msg-bubble">' + aiEscapeMultiline(message.content) + '</div>'
      + '</div>';
  }).join('');
}

function aiRenderSettingsPanel(profile) {
  if (!_aiSettingsOpen) return '';
  var current = profile || getActiveAIProfile() || {};
  var mockMode = isAIMockMode();
  return '<div class="ai-settings-panel">'
    + '<div class="ai-settings-top">'
      + '<div>'
        + '<div class="ai-settings-kicker">Kết nối AI</div>'
        + '<div class="ai-settings-title">Quản lý profile và endpoint</div>'
      + '</div>'
      + '<div class="ai-quick-actions">'
        + '<button class="ai-mini-btn" type="button" onclick="aiCreateProfile(\'deepseek\')">+ DeepSeek</button>'
        + '<button class="ai-mini-btn" type="button" onclick="aiCreateProfile(\'openai\')">+ OpenAI</button>'
        + '<button class="ai-mini-btn" type="button" onclick="aiCreateProfile(\'custom\')">+ Custom</button>'
      + '</div>'
    + '</div>'
    + '<div class="ai-settings-section">'
      + '<label class="ai-field"><span>Profile đang dùng</span><select id="ai-profile-select" onchange="aiSelectProfile(this.value)">' + aiRenderProfileOptions(current.id) + '</select></label>'
    + '</div>'
    + '<div class="ai-settings-section">'
      + '<div class="ai-form-grid">'
        + '<label class="ai-field"><span>Tên profile</span><input id="ai-profile-name" type="text" value="' + escapeHtmlAttr(current.name || '') + '" placeholder="VD: DeepSeek chính"></label>'
        + '<label class="ai-field"><span>Provider</span><select id="ai-profile-provider">'
          + '<option value="deepseek"' + (current.provider === 'deepseek' ? ' selected' : '') + '>DeepSeek</option>'
          + '<option value="openai"' + (current.provider === 'openai' ? ' selected' : '') + '>OpenAI-compatible</option>'
          + '<option value="custom"' + (current.provider === 'custom' ? ' selected' : '') + '>Custom</option>'
        + '</select><button class="ai-inline-btn" type="button" onclick="aiApplyProviderPreset()">Nạp preset</button></label>'
        + '<label class="ai-field ai-field-wide"><span>Base URL</span><input id="ai-profile-base" type="text" value="' + escapeHtmlAttr(current.baseURL || '') + '" placeholder="https://api.deepseek.com hoặc full /chat/completions"></label>'
        + '<label class="ai-field"><span>Model</span><input id="ai-profile-model" type="text" value="' + escapeHtmlAttr(current.model || '') + '" placeholder="deepseek-chat"></label>'
        + '<label class="ai-field"><span>Header auth</span><input id="ai-profile-header" type="text" value="' + escapeHtmlAttr(current.authHeader || '') + '" placeholder="Authorization hoặc X-API-Key"></label>'
        + '<label class="ai-field"><span>Prefix auth</span><input id="ai-profile-prefix" type="text" value="' + escapeHtmlAttr(current.authPrefix || '') + '" placeholder="Bearer, Token, hoặc để trống"></label>'
        + '<label class="ai-field ai-field-wide"><span>API key</span><input id="ai-profile-key" type="password" value="' + escapeHtmlAttr(current.apiKey || '') + '" placeholder="Dán API key riêng cho profile này"></label>'
      + '</div>'
    + '</div>'
    + '<div class="ai-settings-section ai-settings-section-soft">'
      + '<label class="ai-mock-toggle"><input id="ai-mock-toggle" type="checkbox" onchange="aiToggleMockMode(this.checked)"' + (mockMode ? ' checked' : '') + '> <span>Bật mock mode để test nhanh không cần key thật</span></label>'
      + '<div class="ai-settings-meta">Đang lưu riêng từng key theo profile. Key hiện tại: ' + escapeHtml(maskAIKey(current.apiKey || '')) + (mockMode ? ' · mock mode đang bật' : '') + '</div>'
    + '</div>'
    + '<div class="ai-settings-actions">'
      + '<button class="ai-action-btn primary" type="button" onclick="aiSaveActiveProfile()">Lưu profile</button>'
      + '<button class="ai-action-btn accent" type="button" onclick="aiRunConnectionTest()">Test kết nối</button>'
      + '<button class="ai-action-btn" type="button" onclick="aiDeleteActiveProfile()">Xóa profile</button>'
    + '</div>'
    + (_aiTestState.status ? '<div class="ai-test-result ' + escapeHtmlAttr(_aiTestState.tone || '') + '">' + escapeHtml(_aiTestState.status) + '</div>' : '')
    + '</div>';
}

function renderAITab() {
  var page = document.getElementById('page-ai');
  if (!page) return;
  var state = getAIChatState();
  var profile = getActiveAIProfile();
  var mockMode = isAIMockMode();
  var preset = getAIPreset(state.presetId);
  var statusText = mockMode ? 'Đang chạy mock mode' : (profile && profile.apiKey ? 'Đã sẵn sàng gọi API thật' : 'Thiếu API key cho profile hiện tại');
  page.innerHTML = '<div class="page-section-head compact">'
    + '<div><div class="page-kicker">AI quick answer</div><div class="page-title">Trợ lý AI</div></div>'
    + '<div class="ai-head-actions">'
      + '<button class="head-mini-btn" type="button" onclick="aiToggleSettingsPanel()">' + (_aiSettingsOpen ? 'Thu gọn' : 'Cấu hình') + '</button>'
      + '<button class="head-mini-btn" type="button" onclick="aiClearChatFromUI()">Chat mới</button>'
    + '</div>'
    + '</div>'
    + '<div class="ai-shell">'
      + '<div class="ai-hero-card">'
        + '<div class="ai-hero-copy">'
          + '<div class="ai-hero-title">Hỏi giá, nhóm hàng, CTKM ngay trong app</div>'
          + '<div class="ai-hero-sub">Trả lời ưu tiên theo dữ liệu cache hiện có của VNM Order và hạn chế bịa khi thiếu thông tin.</div>'
          + '<div class="ai-preset-row">' + aiRenderPresetChips(preset.id) + '</div>'
        + '</div>'
        + '<div class="ai-hero-status">'
          + '<div class="ai-status-pill' + (mockMode ? ' is-mock' : '') + '">' + escapeHtml(statusText) + '</div>'
            + '<div class="ai-profile-chip"><b>' + escapeHtml(profile ? profile.name : 'Chưa có profile') + '</b>' + (profile && profile.model ? '<span>' + escapeHtml(profile.model) + '</span>' : '') + '<span>Preset: ' + escapeHtml(preset.label) + '</span></div>'
        + '</div>'
      + '</div>'
      + aiRenderSettingsPanel(profile)
      + '<div id="ai-chat-list" class="ai-chat-list">' + aiRenderMessages(state) + (state.isLoading ? '<div class="ai-msg ai-msg-assistant"><div class="ai-msg-meta">AI</div><div class="ai-msg-bubble ai-msg-loading">Đang gọi AI...</div></div>' : '') + '</div>'
      + '<div class="ai-composer">'
        + '<div class="ai-input-bar">'
          + '<textarea id="ai-input" rows="3" placeholder="Hỏi về mã SP, giá, nhóm hàng hoặc CTKM...">' + escapeHtml(_aiDraftInput) + '</textarea>'
          + '<div class="ai-input-actions">'
            + '<button class="ai-send-btn" type="button" onclick="aiSendFromUI()"' + (state.isLoading ? ' disabled' : '') + '>Gửi</button>'
            + (state.isLoading ? '<button class="ai-ghost-btn" type="button" onclick="aiCancelFromUI()">Hủy</button>' : '')
          + '</div>'
        + '</div>'
        + '<div class="ai-composer-note">Enter để gửi, Shift+Enter để xuống dòng.</div>'
      + '</div>'
    + '</div>';

  var input = document.getElementById('ai-input');
  if (input) {
    input.addEventListener('input', function() {
      _aiDraftInput = input.value;
    });
    input.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        aiSendFromUI();
      }
    });
  }

  var list = document.getElementById('ai-chat-list');
  if (list) list.scrollTop = list.scrollHeight;
}

function aiToggleSettingsPanel() {
  _aiSettingsOpen = !_aiSettingsOpen;
  renderAITab();
}

function aiSelectPreset(presetId) {
  setAIChatPreset(presetId);
  renderAITab();
}

function aiSelectProfile(profileId) {
  setActiveAIProfile(profileId);
  renderAITab();
}

function aiApplyProviderPreset() {
  var provider = document.getElementById('ai-profile-provider').value;
  var preset = aiGetPreset(provider);
  document.getElementById('ai-profile-base').value = preset.baseURL || '';
  document.getElementById('ai-profile-model').value = preset.model || '';
  document.getElementById('ai-profile-header').value = preset.authHeader || '';
  document.getElementById('ai-profile-prefix').value = preset.authPrefix || '';
  showToast('Đã nạp preset ' + preset.label);
}

function aiToggleMockMode(enabled) {
  setAIMockMode(!!enabled);
  _aiTestState = { status: '', tone: '' };
  renderAITab();
  showToast(enabled ? 'Đã bật mock mode' : 'Đã tắt mock mode');
}

function aiCreateProfile(presetId) {
  var profile = createAIProfileFromPreset(presetId);
  _aiTestState = { status: '', tone: '' };
  _aiSettingsOpen = true;
  renderAITab();
  showToast('Đã tạo profile ' + profile.name);
}

function aiUseSuggestion(text) {
  _aiDraftInput = String(text || '');
  renderAITab();
  var input = document.getElementById('ai-input');
  if (input) input.focus();
}

function aiReadProfileForm() {
  var current = getActiveAIProfile() || {};
  return {
    id: current.id,
    name: document.getElementById('ai-profile-name').value,
    provider: document.getElementById('ai-profile-provider').value,
    baseURL: document.getElementById('ai-profile-base').value,
    model: document.getElementById('ai-profile-model').value,
    authHeader: document.getElementById('ai-profile-header').value,
    authPrefix: document.getElementById('ai-profile-prefix').value,
    apiKey: document.getElementById('ai-profile-key').value
  };
}

async function aiRunConnectionTest() {
  var current = getActiveAIProfile();
  if (!current) return;
  try {
    var draft = aiReadProfileForm();
    upsertAIProfile(draft);
    _aiTestState = { status: 'Đang test kết nối...', tone: '' };
    renderAITab();
    var result = await testAIConnection(draft.id);
    _aiTestState = {
      status: 'Kết nối OK: ' + result.profileName + ' · ' + result.elapsedMs + 'ms · reply: ' + result.reply,
      tone: 'ok'
    };
    renderAITab();
    showToast('Test kết nối thành công');
  } catch (err) {
    _aiTestState = {
      status: 'Test kết nối lỗi: ' + (err.message || 'Không rõ lỗi'),
      tone: 'err'
    };
    renderAITab();
    showToast(err.message || 'Test kết nối thất bại');
  }
}

function aiSaveActiveProfile() {
  var profile = aiReadProfileForm();
  if (!String(profile.name || '').trim()) {
    showToast('Nhập tên profile AI');
    return;
  }
  if (!String(profile.baseURL || '').trim()) {
    showToast('Nhập base URL');
    return;
  }
  if (!String(profile.model || '').trim()) {
    showToast('Nhập model');
    return;
  }
  upsertAIProfile(profile);
  _aiTestState = { status: '', tone: '' };
  showToast('✅ Đã lưu profile AI');
  renderAITab();
}

function aiDeleteActiveProfile() {
  var current = getActiveAIProfile();
  if (!current) return;
  if (!confirm('Xóa profile ' + current.name + '?')) return;
  try {
    deleteAIProfile(current.id);
    _aiTestState = { status: '', tone: '' };
    showToast('Đã xóa profile AI');
    renderAITab();
  } catch (err) {
    showToast(err.message || 'Không thể xóa profile');
  }
}

async function aiSendFromUI() {
  var profile = getActiveAIProfile();
  if (!aiCanSendWithoutKey(profile)) {
    _aiSettingsOpen = true;
    renderAITab();
    showToast('Nhập API key hoặc bật mock mode để test');
    return;
  }
  var text = String(_aiDraftInput || '').trim();
  if (!text) {
    showToast('Nhập câu hỏi trước khi gửi');
    return;
  }
  _aiDraftInput = '';
  var promise = sendAIMessage(text);
  renderAITab();
  try {
    await promise;
    renderAITab();
  } catch (err) {
    renderAITab();
    showToast(err.message || 'Lỗi gọi AI');
  }
}

function aiCancelFromUI() {
  cancelAIMessage();
}

function aiClearChatFromUI() {
  if (!getAIChatState().messages.length) return;
  if (!confirm('Xóa lịch sử chat AI hiện tại?')) return;
  clearAIChat();
  renderAITab();
}

window.renderAITab = renderAITab;
window.aiToggleSettingsPanel = aiToggleSettingsPanel;
window.aiSelectPreset = aiSelectPreset;
window.aiSelectProfile = aiSelectProfile;
window.aiApplyProviderPreset = aiApplyProviderPreset;
window.aiToggleMockMode = aiToggleMockMode;
window.aiUseSuggestion = aiUseSuggestion;
window.aiCreateProfile = aiCreateProfile;
window.aiRunConnectionTest = aiRunConnectionTest;
window.aiSaveActiveProfile = aiSaveActiveProfile;
window.aiDeleteActiveProfile = aiDeleteActiveProfile;
window.aiSendFromUI = aiSendFromUI;
window.aiCancelFromUI = aiCancelFromUI;
window.aiClearChatFromUI = aiClearChatFromUI;