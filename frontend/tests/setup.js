import '@testing-library/jest-dom/vitest';

if (!window.matchMedia) {
  window.matchMedia = (consulta) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!window.scrollTo) {
  window.scrollTo = () => {};
}

// Node 26 puede exponer un localStorage experimental sin almacén en jsdom.
try {
  window.localStorage.setItem('__foodware_test__', '1');
  window.localStorage.removeItem('__foodware_test__');
} catch {
  const almacen = new Map();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (clave) => almacen.get(clave) ?? null,
      setItem: (clave, valor) => almacen.set(clave, String(valor)),
      removeItem: (clave) => almacen.delete(clave),
      clear: () => almacen.clear(),
    },
  });
}
