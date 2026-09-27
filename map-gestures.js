// One-finger zoom: tap, then hold the second tap and drag vertically.
function enableDoubleTapDragZoom(map) {
  const container = map.getContainer();
  const fingers = new Set();
  let tap = null;
  let previousTap = null;
  let gesture = null;
  let suppressClicksUntil = 0;

  function consume(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function finish(cancelled) {
    if (!gesture) return;
    const finished = gesture;
    gesture = null;
    if (!cancelled && !finished.moved) {
      map.setZoomAround(finished.anchor, finished.zoom + map.options.zoomDelta);
    }
    for (const handler of finished.handlers) handler.enable();
    suppressClicksUntil = performance.now() + 500;
    previousTap = null;
  }

  container.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    fingers.add(event.pointerId);
    if (fingers.size > 1) {
      previousTap = null;
      tap = null;
      // Once one-finger zoom starts, ignore extra fingers until release.
      // Ordinary two-finger gestures never enter this path.
      if (gesture) consume(event);
      return;
    }
    if (event.target.closest('.leaflet-control, .leaflet-marker-icon, a, button')) {
      previousTap = null;
      return;
    }
    const now = performance.now();
    const near = previousTap && Math.hypot(event.clientX - previousTap.x, event.clientY - previousTap.y) <= 30;
    if (near && now - previousTap.time <= 300) {
      const handlers = [map.dragging, map.touchZoom, map.doubleClickZoom, map.tapHold]
        .filter((handler) => handler?.enabled());
      handlers.forEach((handler) => handler.disable());
      map.stop();
      gesture = {
        pointerId: event.pointerId,
        y: event.clientY,
        zoom: map.getZoom(),
        anchor: map.containerPointToLatLng(map.mouseEventToContainerPoint(event)),
        moved: false,
        handlers,
      };
      tap = null;
      previousTap = null;
      consume(event);
    } else {
      previousTap = null;
      tap = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: now };
    }
  }, { capture: true, passive: false });

  document.addEventListener('pointermove', (event) => {
    if (tap?.pointerId === event.pointerId && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 10) tap = null;
    if (!gesture || event.pointerType !== 'touch') return;
    consume(event);
    if (gesture.pointerId !== event.pointerId) return;
    const delta = event.clientY - gesture.y;
    if (Math.abs(delta) > 8) gesture.moved = true;
    if (!gesture.moved) return;
    const zoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), gesture.zoom + delta / 100));
    map.setZoomAround(gesture.anchor, zoom, { animate: false });
  }, { capture: true, passive: false });

  function release(event) {
    if (event.pointerType !== 'touch') return;
    fingers.delete(event.pointerId);
    if (gesture) {
      consume(event);
      if (gesture.pointerId === event.pointerId) finish(event.type === 'pointercancel');
    } else if (tap?.pointerId === event.pointerId) {
      if (event.type === 'pointerup' && fingers.size === 0 && performance.now() - tap.time <= 250) {
        previousTap = { ...tap, time: performance.now() };
      }
    }
    tap = null;
  }
  document.addEventListener('pointerup', release, { capture: true, passive: false });
  document.addEventListener('pointercancel', release, { capture: true, passive: false });

  // Suppress compatibility touch/click events from the claimed gesture so
  // Leaflet and Safari cannot also pan, double-zoom, or open a context menu.
  for (const type of ['touchstart', 'touchmove', 'touchend', 'click', 'dblclick', 'contextmenu']) {
    container.addEventListener(type, (event) => {
      const compatibilityClick = ['click', 'dblclick', 'contextmenu'].includes(type);
      if (gesture || (compatibilityClick && performance.now() < suppressClicksUntil)) consume(event);
    }, { capture: true, passive: false });
  }
  window.addEventListener('blur', () => {
    finish(true);
    fingers.clear();
    tap = previousTap = null;
  });
}
