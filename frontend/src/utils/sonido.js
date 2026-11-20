/**
 * Señal sonora de la vista de sala (historia 005).
 *
 * Usa la Web Audio API para generar un pitido corto sin depender de ficheros
 * de audio. Si el navegador no la soporta, la señal visual sigue funcionando.
 */
export const CLAVE_SONIDO_SILENCIADO = 'foodware.sala.sonidoSilenciado';

let contexto;

export function leerSilenciado() {
  try {
    return window.localStorage.getItem(CLAVE_SONIDO_SILENCIADO) === 'true';
  } catch {
    return false;
  }
}

export function guardarSilenciado(silenciado) {
  try {
    window.localStorage.setItem(CLAVE_SONIDO_SILENCIADO, silenciado ? 'true' : 'false');
  } catch {
    // El almacenamiento puede no estar disponible (modo privado, permisos…).
  }
}

export function reproducirPitido() {
  const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctor) return;

  try {
    contexto ??= new Ctor();
    if (contexto.state === 'suspended') {
      void contexto.resume();
    }

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();
    const ahora = contexto.currentTime;

    oscilador.type = 'sine';
    oscilador.frequency.value = 880;
    ganancia.gain.setValueAtTime(0.0001, ahora);
    ganancia.gain.exponentialRampToValueAtTime(0.35, ahora + 0.02);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.45);

    oscilador.connect(ganancia).connect(contexto.destination);
    oscilador.start(ahora);
    oscilador.stop(ahora + 0.45);
  } catch {
    // Sin audio disponible: la señal visual sigue siendo suficiente.
  }
}
