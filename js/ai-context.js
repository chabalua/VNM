function aiParseStoredJSON(storageKey, fallback) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || 'null') || fallback;
  } catch (e) {
    return fallback;
  }
}

function aiStripText(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function aiReadProducts() {
  if (typeof SP !== 'undefined' && Array.isArray(SP) && SP.length) return SP;
  return aiParseStoredJSON(LS_KEYS.SP, []);
}

function aiReadPromotions() {
  if (typeof kmProgs !== 'undefined' && Array.isArray(kmProgs) && kmProgs.length) return kmProgs;
  return aiParseStoredJSON(LS_KEYS.KM, []);
}

function aiFormatMoney(value) {
  var num = Number(value || 0);
  if (!isFinite(num) || num <= 0) return '?';
  return num.toLocaleString('vi-VN') + 'đ';
}

function aiBuildProductMap(products) {
  var map = {};
  (products || []).forEach(function(product) {
    if (product && product.ma) map[product.ma] = product;
  });
  return map;
}

function aiBuildMatchedProducts(question, products) {
  var list = Array.isArray(products) ? products.slice() : [];
  var tokens = aiTokenizeQuestion(question);
  list.sort(function(a, b) {
    return aiScoreProduct(b, tokens, question) - aiScoreProduct(a, tokens, question);
  });
  return list.filter(function(product, index) {
    if (index < 12) return true;
    return aiScoreProduct(product, tokens, question) > 0;
  }).slice(0, 12);
}

function aiBuildMatchedCodes(products) {
  var codes = {};
  (products || []).forEach(function(product) {
    if (product && product.ma) codes[product.ma] = true;
  });
  return codes;
}

function aiTokenizeQuestion(question) {
  return aiStripText(question).split(/[^a-z0-9]+/).filter(function(token) { return token.length >= 2; });
}

function aiScoreProduct(product, tokens, rawQuestion) {
  var score = 0;
  var haystack = aiStripText((product && product.ma) + ' ' + (product && product.ten) + ' ' + (product && product.phanLoai) + ' ' + (product && product.nhom));
  var raw = aiStripText(rawQuestion);
  if (raw && product && product.ma && aiStripText(product.ma) === raw.replace(/\s+/g, '')) score += 100;
  tokens.forEach(function(token) {
    if (product && product.ma && aiStripText(product.ma).indexOf(token) >= 0) score += 20;
    if (haystack.indexOf(token) >= 0) score += 8;
  });
  return score;
}

function aiScorePromotion(promo, tokens, rawQuestion) {
  var score = promo && promo.active === false ? -1000 : 1;
  var haystack = aiStripText((promo && promo.name) + ' ' + (promo && promo.nhoms) + ' ' + ((promo && promo.spMas || []).join(' ')));
  var raw = aiStripText(rawQuestion);
  (promo && promo.spMas || []).forEach(function(code) {
    if (code && aiStripText(code) === raw.replace(/\s+/g, '')) score += 80;
  });
  tokens.forEach(function(token) {
    if (haystack.indexOf(token) >= 0) score += 8;
  });
  return score;
}

function aiScorePromotionWithCodes(promo, tokens, rawQuestion, matchedCodes) {
  var score = aiScorePromotion(promo, tokens, rawQuestion);
  (promo && promo.spMas || []).forEach(function(code) {
    if (matchedCodes && matchedCodes[code]) score += 25;
  });
  return score;
}

function aiFormatBonusProduct(productMap, ma) {
  if (!ma || ma === 'same') return 'cùng loại';
  var product = productMap[ma];
  return ma + (product && product.ten ? ' - ' + product.ten : '');
}

function aiFormatPromotionSummary(promo, productMap) {
  if (!promo) return '';
  var target = Array.isArray(promo.spMas) && promo.spMas.length ? ' | áp mã: ' + promo.spMas.slice(0, 4).join(', ') + (promo.spMas.length > 4 ? ' +' + (promo.spMas.length - 4) : '') : '';
  if (promo.type === 'bonus') {
    return promo.name + ' | bonus | mua ' + (promo.bX || '?') + ' ' + (promo.bUnit || '') + ' tặng ' + (promo.bY || '?') + ' ' + aiFormatBonusProduct(productMap, promo.bMa) + target;
  }
  if (promo.type === 'fixed') {
    return promo.name + ' | fixed | CK ' + (promo.ck || '?') + '%' + target;
  }
  if (promo.type === 'tier_qty') {
    return promo.name + ' | tier_qty | ' + ((promo.tiers || []).length) + ' mức theo SL' + target;
  }
  if (promo.type === 'tier_money') {
    return promo.name + ' | tier_money | ' + ((promo.tiers || []).length) + ' mức theo tiền' + target;
  }
  if (promo.type === 'order_money') {
    return promo.name + ' | order_money | ' + ((promo.tiers || []).length) + ' mức CK đơn';
  }
  if (promo.type === 'order_bonus') {
    return promo.name + ' | order_bonus | ' + ((promo.tiers || []).length) + ' mức quà đơn';
  }
  return promo.name + ' | ' + (promo.type || 'unknown') + target;
}

function buildAIProductContext(question, products) {
  var top = aiBuildMatchedProducts(question, products);
  if (!top.length) return 'SAN_PHAM:\n- Khong tim thay san pham phu hop trong cache.';
  return 'SAN_PHAM:\n' + top.map(function(product) {
    return '- ' + product.ma + ' | ' + product.ten + ' | nhom ' + (product.nhom || '?') + ' | ' + aiFormatMoney(product.giaNYLon) + '/lon | ' + aiFormatMoney(product.giaNYThung) + '/thung' + (product.phanLoai ? ' | ' + product.phanLoai : '');
  }).join('\n');
}

function buildAIPromotionContext(question, promotions, productMap, matchedProducts) {
  var list = Array.isArray(promotions) ? promotions.filter(function(promo) { return promo && promo.active !== false; }) : [];
  var tokens = aiTokenizeQuestion(question);
  var matchedCodes = aiBuildMatchedCodes(matchedProducts);
  list.sort(function(a, b) {
    return aiScorePromotionWithCodes(b, tokens, question, matchedCodes) - aiScorePromotionWithCodes(a, tokens, question, matchedCodes);
  });
  var top = list.filter(function(promo, index) {
    if (index < 18) return true;
    return aiScorePromotionWithCodes(promo, tokens, question, matchedCodes) > 1;
  }).slice(0, 18);
  if (!top.length) return 'KHUYEN_MAI:\n- Khong tim thay CTKM phu hop trong cache.';
  return 'KHUYEN_MAI:\n' + top.map(function(promo) {
    return '- ' + aiFormatPromotionSummary(promo, productMap);
  }).join('\n');
}

function buildAIQuickQAContext(question) {
  var products = aiReadProducts();
  var promotions = aiReadPromotions();
  var productMap = aiBuildProductMap(products);
  var matchedProducts = aiBuildMatchedProducts(question, products);
  var header = 'NGUON_DU_LIEU: cache local cua VNM Order. Neu khong thay thong tin thi phai noi ro khong co trong du lieu hien tai.';
  return [
    header,
    buildAIProductContext(question, matchedProducts),
    buildAIPromotionContext(question, promotions, productMap, matchedProducts)
  ].join('\n\n');
}

function buildAIProductOnlyContext(question) {
  var products = aiReadProducts();
  var header = 'NGUON_DU_LIEU: chi su dung du lieu san pham trong cache local cua VNM Order.';
  return [
    header,
    buildAIProductContext(question, products)
  ].join('\n\n');
}

function buildAIPromotionOnlyContext(question) {
  var products = aiReadProducts();
  var promotions = aiReadPromotions();
  var productMap = aiBuildProductMap(products);
  var matchedProducts = aiBuildMatchedProducts(question, products);
  var header = 'NGUON_DU_LIEU: chi su dung du lieu CTKM trong cache local cua VNM Order.';
  return [
    header,
    buildAIPromotionContext(question, promotions, productMap, matchedProducts)
  ].join('\n\n');
}

window.buildAIProductContext = buildAIProductContext;
window.buildAIPromotionContext = buildAIPromotionContext;
window.buildAIQuickQAContext = buildAIQuickQAContext;
window.buildAIProductOnlyContext = buildAIProductOnlyContext;
window.buildAIPromotionOnlyContext = buildAIPromotionOnlyContext;