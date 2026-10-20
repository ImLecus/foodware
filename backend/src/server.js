import { createApp } from './app.js';
import { config } from './config.js';
import { createDb } from './db/index.js';

const db = createDb(config.dbPath);
const app = createApp(db);

const servidor = app.listen(config.port, () => {
  console.log(`Foodware API escuchando en http://localhost:${config.port}`);
});

function cerrar(senal) {
  console.log(`Recibida ${senal}; cerrando servidor...`);
  servidor.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => cerrar('SIGINT'));
process.on('SIGTERM', () => cerrar('SIGTERM'));
