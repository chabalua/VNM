// Một lần test, không gắn vào suite. Mục đích: probe giá thực tế của 08HA31
// với data thật để xem engine trả gì.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp,
  parseInt, parseFloat, isNaN, setTimeout, clearTimeout,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  document: { getElementById: () => null, createElement: () => ({}), body: { appendChild() {}, removeChild() {} } },
  navigator: { clipboard: { writeText() { return Promise.resolve(); } } }
};
sandbox.window = sandbox; sandbox.global = sandbox; sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

function load(rel) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
  vm.runInContext(code, ctx, { filename: rel });
}
load('js/config.js');
load('js/cart.js');

const products = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'products.json'), 'utf8'));
const promos = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'promotions.json'), 'utf8'));

ctx.SP = products;
ctx.kmProgs = promos;
ctx.spFind = (ma) => products.find(p => p.ma === ma);
ctx.cart = {};

const ma = process.argv[2] || '08HA31';
const qT = parseInt(process.argv[3] || '0', 10);
const qL = parseInt(process.argv[4] || '129', 10);

const probe = vm.runInContext(`
(function(){
  var p = spFind('${ma}');
  if (!p) return { error: 'SP không tồn tại' };
  var ctx = buildOrderContextFromCart('${ma}');
  var applicable = (kmProgs || []).filter(function(prog){
    if (!prog.active) return false;
    if (!(prog.spMas || []).includes(p.ma)) return false;
    return true;
  });
  var km = calcKM(p, ${qT}, ${qL}, ctx);
  var totalLon = ${qT} * p.slThung + ${qL};
  var goc = p.giaNYLon * totalLon;
  return {
    sp: { ma: p.ma, ten: p.ten, giaNYLon: p.giaNYLon, slThung: p.slThung },
    qty: { qT: ${qT}, qL: ${qL}, totalLon: totalLon, goc: goc },
    applicable_count: applicable.length,
    applicable: applicable.map(function(x){ return { name: x.name, type: x.type, stackable: x.stackable, bX: x.bX, bY: x.bY }; }),
    km: { disc: km.disc, bonus: km.bonus, nhan: km.nhan, hopKM: km.hopKM, thungKM: km.thungKM, appliedPromos: km.appliedPromos, bonusItems: km.bonusItems, desc: km.desc },
    afterKM: goc - km.disc,
    expected_total_nhan: totalLon + km.bonus,
    hopKM_check: Math.round((goc - km.disc) / (totalLon + km.bonus))
  };
})()
`, ctx);

console.log(JSON.stringify(probe, null, 2));
