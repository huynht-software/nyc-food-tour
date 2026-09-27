const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  let now = 0;
  const surface = () => {
    const listeners = new Map();
    return {
      addEventListener(type, fn) { listeners.set(type, fn); },
      emit(type, props = {}) {
        const event = {
          type, pointerType: 'touch', pointerId: 1, clientX: 100, clientY: 100,
          target: { closest: () => false }, prevented: false, stopped: false,
          preventDefault() { this.prevented = true; },
          stopImmediatePropagation() { this.stopped = true; },
          ...props,
        };
        listeners.get(type)?.(event);
        return event;
      },
    };
  };
  const container = surface();
  const document = surface();
  const window = surface();
  const handler = (initial = true) => {
    let enabled = initial;
    return { enabled: () => enabled, enable: () => { enabled = true; }, disable: () => { enabled = false; } };
  };
  const calls = [];
  const map = {
    options: { zoomDelta: 1 }, dragging: handler(), touchZoom: handler(), doubleClickZoom: handler(), tapHold: handler(false),
    getContainer: () => container, stop() {}, getZoom: () => 12,
    getMinZoom: () => 3, getMaxZoom: () => 19,
    mouseEventToContainerPoint: (event) => ({ x: event.clientX, y: event.clientY }),
    containerPointToLatLng: (point) => point,
    setZoomAround: (anchor, zoom, options) => calls.push({ anchor, zoom, options }),
  };
  const context = { document, window, performance: { now: () => now } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../map-gestures.js'), 'utf8'), context);
  context.enableDoubleTapDragZoom(map);
  function firstTap() {
    container.emit('pointerdown');
    now += 50;
    document.emit('pointerup');
    now += 100;
  }
  return { container, document, window, map, calls, firstTap, advance: (ms) => { now += ms; } };
}

test('second tap drag zooms both directions around the original tap', () => {
  const s = setup();
  s.firstTap();
  assert(s.container.emit('pointerdown').prevented);
  assert(!s.map.dragging.enabled());
  s.document.emit('pointermove', { clientY: 200 });
  s.document.emit('pointermove', { clientY: 50 });
  assert.deepEqual(s.calls.map(x => x.zoom), [13, 11.5]);
  assert(s.calls.every(x => x.anchor.x === 100 && x.anchor.y === 100 && x.options.animate === false));
  s.document.emit('pointerup');
  assert(s.map.dragging.enabled() && s.map.touchZoom.enabled() && s.map.doubleClickZoom.enabled());
  assert(!s.map.tapHold.enabled(), 'Do not enable handlers that were disabled beforehand');
  assert.equal(s.calls.length, 2, 'Do not add a double-tap zoom after dragging');
  assert(s.container.emit('dblclick').prevented);
  assert(!s.container.emit('touchstart').prevented, 'Allow a fresh pinch immediately after release');
});

test('plain double tap still zooms one level, with jitter ignored', () => {
  const s = setup(); s.firstTap(); s.container.emit('pointerdown');
  s.document.emit('pointermove', { clientY: 104 });
  assert.equal(s.calls.length, 0);
  s.document.emit('pointerup');
  assert.equal(s.calls[0].zoom, 13);
  assert(s.container.emit('click').prevented);
  s.advance(501);
  assert(!s.container.emit('click').prevented);
});

test('single-finger pan, long presses, distant taps, and mouse remain native', () => {
  const s = setup();
  assert(!s.container.emit('pointerdown').prevented);
  assert(!s.document.emit('pointermove', { clientY: 150 }).prevented);
  s.document.emit('pointerup');
  assert(!s.container.emit('pointerdown').prevented);
  s.advance(500); s.document.emit('pointerup');
  assert(!s.container.emit('pointerdown').prevented);
  s.document.emit('pointerup'); s.advance(100);
  assert(!s.container.emit('pointerdown', { clientX: 300 }).prevented);
  assert(!s.container.emit('pointerdown', { pointerType: 'mouse' }).prevented);
  assert.equal(s.calls.length, 0);
});

test('ordinary pinch remains native and does not prime double-tap drag', () => {
  const s = setup(); s.container.emit('pointerdown');
  assert(!s.container.emit('pointerdown', { pointerId: 2 }).prevented);
  s.document.emit('pointerup', { pointerId: 2 }); s.document.emit('pointerup');
  assert(!s.container.emit('pointerdown').prevented);
  assert(s.map.touchZoom.enabled());
  assert.equal(s.calls.length, 0);
});

test('cancel and blur restore normal interaction without an extra zoom', () => {
  for (const type of ['pointercancel', 'blur']) {
    const s = setup(); s.firstTap(); s.container.emit('pointerdown');
    if (type === 'blur') s.window.emit(type); else s.document.emit(type);
    assert(s.map.dragging.enabled() && s.map.doubleClickZoom.enabled());
    assert.equal(s.calls.length, 0);
  }
});

test('zoom respects map limits and additional fingers cannot change its anchor', () => {
  const s = setup(); s.firstTap(); s.container.emit('pointerdown');
  assert(s.container.emit('pointerdown', { pointerId: 2 }).prevented);
  s.document.emit('pointermove', { pointerId: 2, clientY: 500 });
  assert.equal(s.calls.length, 0);
  s.document.emit('pointermove', { clientY: 3000 });
  s.document.emit('pointermove', { clientY: -3000 });
  assert.deepEqual(s.calls.map(x => x.zoom), [19, 3]);
});

test('controls and restaurant markers retain their tap behavior', () => {
  const s = setup(); s.firstTap();
  assert(!s.container.emit('pointerdown', { target: { closest: () => true } }).prevented);
  assert(s.map.dragging.enabled());
  assert.equal(s.calls.length, 0);
});
