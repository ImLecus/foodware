-- Historia 000: autenticación real y sesiones de servidor.
--
-- Las contraseñas se guardan como hash scrypt con salt. Las sesiones usan un
-- token opaco; en la base solo se almacena su SHA-256.

ALTER TABLE usuarios ADD COLUMN password_hash TEXT;

CREATE TABLE IF NOT EXISTS sesiones (
  token_hash TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creada_en TEXT NOT NULL DEFAULT (datetime('now')),
  ultima_actividad TEXT NOT NULL DEFAULT (datetime('now')),
  expira_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sesiones_por_usuario ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS sesiones_por_expiracion ON sesiones(expira_en);
