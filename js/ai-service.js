var AI_PROVIDER_PRESETS = {
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  openai: {
    id: 'openai',
    label: 'OpenAI-compatible',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    baseURL: '',
    model: '',
    authHeader: 'Authorization',
    authPrefix: 'Bearer'
  }
};

function isAIMockMode() {
  return localStorage.getItem('vnm_ai_mock') === '1';
}

function setAIMockMode(enabled) {
  if (enabled) localStorage.setItem('vnm_ai_mock', '1');
  else localStorage.removeItem('vnm_ai_mock');
  return isAIMockMode();
}

function aiClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function aiMakeProfileId() {
  return 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function aiGetPreset(presetId) {
  return AI_PROVIDER_PRESETS[presetId] || AI_PROVIDER_PRESETS.custom;
}

function aiNormalizeProfile(profile, index) {
  var preset = aiGetPreset(profile && profile.provider);
  var key = profile && profile.apiKey ? String(profile.apiKey).trim() : '';
  return {
    id: profile && profile.id ? String(profile.id) : aiMakeProfileId(),
    name: profile && profile.name ? String(profile.name).trim() : (preset.label + ' ' + String((index || 0) + 1)),
    provider: preset.id,
    baseURL: profile && profile.baseURL != null ? String(profile.baseURL).trim() : preset.baseURL,
    model: profile && profile.model != null ? String(profile.model).trim() : preset.model,
    authHeader: profile && profile.authHeader != null ? String(profile.authHeader).trim() : preset.authHeader,
    authPrefix: profile && profile.authPrefix != null ? String(profile.authPrefix).trim() : preset.authPrefix,
    apiKey: key
  };
}

function aiGetDefaultSettings() {
  var profile = aiNormalizeProfile({
    id: 'ai_default_deepseek',
    name: 'DeepSeek mặc định',
    provider: 'deepseek'
  }, 0);
  return {
    activeProfileId: profile.id,
    profiles: [profile]
  };
}

function aiNormalizeSettings(settings) {
  var raw = settings && typeof settings === 'object' ? settings : {};
  var profiles = Array.isArray(raw.profiles) ? raw.profiles.map(function(profile, index) {
    return aiNormalizeProfile(profile, index);
  }) : [];
  if (!profiles.length) {
    return aiGetDefaultSettings();
  }
  var activeProfileId = raw.activeProfileId;
  if (!profiles.some(function(profile) { return profile.id === activeProfileId; })) {
    activeProfileId = profiles[0].id;
  }
  return {
    activeProfileId: activeProfileId,
    profiles: profiles
  };
}

function getAISettings() {
  try {
    return aiNormalizeSettings(JSON.parse(localStorage.getItem(LS_KEYS.AI_SETTINGS) || 'null'));
  } catch (e) {
    return aiGetDefaultSettings();
  }
}

function saveAISettings(settings) {
  var normalized = aiNormalizeSettings(settings);
  localStorage.setItem(LS_KEYS.AI_SETTINGS, JSON.stringify(normalized));
  if (window.lsCheckQuota) lsCheckQuota();
  return normalized;
}

function getAIProfiles() {
  return getAISettings().profiles;
}

function getActiveAIProfile() {
  var settings = getAISettings();
  var profile = settings.profiles.find(function(item) { return item.id === settings.activeProfileId; });
  return profile || settings.profiles[0] || null;
}

function setActiveAIProfile(profileId) {
  var settings = getAISettings();
  if (settings.profiles.some(function(profile) { return profile.id === profileId; })) {
    settings.activeProfileId = profileId;
    saveAISettings(settings);
  }
  return getActiveAIProfile();
}

function createAIProfileFromPreset(presetId) {
  var settings = getAISettings();
  var preset = aiGetPreset(presetId);
  var profile = aiNormalizeProfile({
    id: aiMakeProfileId(),
    provider: preset.id,
    name: preset.label + ' ' + String(settings.profiles.length + 1),
    baseURL: preset.baseURL,
    model: preset.model,
    authHeader: preset.authHeader,
    authPrefix: preset.authPrefix,
    apiKey: ''
  }, settings.profiles.length);
  settings.profiles.push(profile);
  settings.activeProfileId = profile.id;
  saveAISettings(settings);
  return profile;
}

function upsertAIProfile(profileInput) {
  var settings = getAISettings();
  var profile = aiNormalizeProfile(profileInput, settings.profiles.length);
  var index = settings.profiles.findIndex(function(item) { return item.id === profile.id; });
  if (index >= 0) settings.profiles[index] = profile;
  else settings.profiles.push(profile);
  settings.activeProfileId = profile.id;
  saveAISettings(settings);
  return profile;
}

function deleteAIProfile(profileId) {
  var settings = getAISettings();
  if (settings.profiles.length <= 1) {
    throw new Error('Cần giữ lại ít nhất 1 profile AI');
  }
  settings.profiles = settings.profiles.filter(function(profile) { return profile.id !== profileId; });
  if (!settings.profiles.length) {
    settings = aiGetDefaultSettings();
  } else if (settings.activeProfileId === profileId) {
    settings.activeProfileId = settings.profiles[0].id;
  }
  saveAISettings(settings);
  return settings;
}

function maskAIKey(key) {
  var value = String(key || '').trim();
  if (!value) return '(chưa có key)';
  if (value.length <= 8) return value;
  return value.slice(0, 4) + '...' + value.slice(-4);
}

function getAIChatEndpoint(profile) {
  var baseURL = String(profile && profile.baseURL || '').trim();
  if (!baseURL) throw new Error('Thiếu base URL');
  if (/\/chat\/completions$/i.test(baseURL)) return baseURL;
  return baseURL.replace(/\/+$/, '') + '/chat/completions';
}

function aiBuildRequestHeaders(profile) {
  var headers = {
    'Content-Type': 'application/json'
  };
  var headerName = String(profile && profile.authHeader || '').trim();
  if (headerName) {
    headers[headerName] = profile.authPrefix ? String(profile.authPrefix).trim() + ' ' + profile.apiKey : profile.apiKey;
  }
  return headers;
}

async function aiCallProfile(profile, messages, options) {
  var settings = options || {};
  if (!profile) throw new Error('Chưa có profile AI');

  if (isAIMockMode()) {
    await new Promise(function(resolve) { setTimeout(resolve, 400); });
    return '[MOCK] Profile ' + profile.name + ' đang chạy giả lập. Tắt vnm_ai_mock để gọi API thật.';
  }

  if (!profile.apiKey) throw new Error('Profile hiện tại chưa có API key');
  if (!profile.model) throw new Error('Profile hiện tại chưa có model');

  var response = await fetch(getAIChatEndpoint(profile), {
    method: 'POST',
    headers: aiBuildRequestHeaders(profile),
    body: JSON.stringify({
      model: profile.model,
      messages: messages,
      temperature: settings.temperature == null ? 0.2 : settings.temperature,
      max_tokens: settings.maxTokens == null ? 700 : settings.maxTokens,
      stream: false
    }),
    signal: settings.signal
  });

  if (!response.ok) {
    var errorText = await response.text();
    throw new Error('AI API lỗi ' + response.status + ': ' + errorText);
  }

  var data = await response.json();
  var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error('AI trả về response không hợp lệ');
  return String(content).trim();
}

async function callAI(messages, options) {
  var profile = getActiveAIProfile();
  return aiCallProfile(profile, messages, options);
}

async function testAIConnection(profileId) {
  var profile = null;
  var profiles = getAIProfiles();
  if (profileId) {
    profile = profiles.find(function(item) { return item.id === profileId; }) || null;
  }
  if (!profile) profile = getActiveAIProfile();
  if (!profile) throw new Error('Không có profile để test');

  var startedAt = Date.now();
  var reply = await aiCallProfile(profile, [
    { role: 'system', content: 'Reply with exactly: OK' },
    { role: 'user', content: 'Ping' }
  ], {
    temperature: 0,
    maxTokens: 20
  });

  return {
    ok: true,
    profileName: profile.name,
    elapsedMs: Date.now() - startedAt,
    reply: reply
  };
}

window.AI_PROVIDER_PRESETS = AI_PROVIDER_PRESETS;
window.getAISettings = getAISettings;
window.saveAISettings = saveAISettings;
window.getAIProfiles = getAIProfiles;
window.getActiveAIProfile = getActiveAIProfile;
window.setActiveAIProfile = setActiveAIProfile;
window.createAIProfileFromPreset = createAIProfileFromPreset;
window.upsertAIProfile = upsertAIProfile;
window.deleteAIProfile = deleteAIProfile;
window.maskAIKey = maskAIKey;
window.aiGetPreset = aiGetPreset;
window.isAIMockMode = isAIMockMode;
window.setAIMockMode = setAIMockMode;
window.testAIConnection = testAIConnection;
window.callAI = callAI;