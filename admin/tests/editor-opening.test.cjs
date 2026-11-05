const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const render = source.slice(source.indexOf('    function renderGrid()'), source.indexOf('    // Drag & Drop Handlers'));
for (const width of [390, 855, 1440]) {
  let cards = [], opened = [];
  const container = {set innerHTML(v) { cards = []; }, appendChild(card) { cards.push(card); }};
  const context = {
    document: {getElementById: id => id === 'workspace-grid' ? container : {classList: {add() {}, remove() {}}}, createElement: () => ({events: {}, setAttribute() {}, addEventListener(k, fn) {this.events[k] = fn;}, focus() {}})},
    localData: {drone: [{file: 'Drone-001.JPG', desc: 'Coastal highway'}, {file: 'Drone-002.JPG', desc: 'Mountain ridge'}]},
    currentCategory: 'drone', currentGallerySearch: '', window: {}, activeEditIndex: null,
    matchMedia: () => ({matches: width >= 1100}), openEditDrawer: index => opened.push(index), closeEditDrawer() {},
    handleCardDragStart() {}, handleCardDragOver() {}, handleCardDrop() {}, handleCardDragEnd() {},
    resolveThumbPath: () => '', resolveOriginalPath: () => '', escapeHtml: s => s,
  };
  vm.createContext(context); vm.runInContext(render, context);
  context.renderGrid(); assert.equal(opened.length, 0, `No automatic opening at ${width}px`);
  cards[0].events.click(); assert.deepEqual(opened, [0]);
  opened = []; context.currentGallerySearch = 'mountain'; context.renderGrid();
  assert.equal(cards.length, 1); assert.equal(opened.length, 0, 'Filtering must not open the editor');
  cards[0].events.keydown({target: cards[0], key: 'Enter', preventDefault() {}});
  assert.deepEqual(opened, [1], 'Keyboard activation edits the selected photo');
}
console.log('Collection rendering and filtering stay closed; click and keyboard editing work at mobile, tablet and desktop widths.');
