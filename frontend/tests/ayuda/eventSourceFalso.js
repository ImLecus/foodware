/** EventSource mínimo que permite emitir eventos desde las pruebas. */
export class EventSourceFalso {
  static instancias = [];

  constructor(url) {
    this.url = url;
    this.oyentes = new Map();
    this.cerrada = false;
    EventSourceFalso.instancias.push(this);
  }

  addEventListener(nombre, handler) {
    const lista = this.oyentes.get(nombre) ?? [];
    lista.push(handler);
    this.oyentes.set(nombre, lista);
  }

  removeEventListener(nombre, handler) {
    const lista = this.oyentes.get(nombre) ?? [];
    this.oyentes.set(
      nombre,
      lista.filter((oyente) => oyente !== handler),
    );
  }

  close() {
    this.cerrada = true;
  }

  emitir(nombre, datos) {
    for (const handler of this.oyentes.get(nombre) ?? []) {
      handler({ data: JSON.stringify(datos) });
    }
  }
}
