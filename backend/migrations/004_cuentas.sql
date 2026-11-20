-- Historia 006: modo de división de la cuenta --------------------------------
-- La tabla `cuentas` se creó en 001_init.sql; aquí solo se añade el modo de
-- división que exige data-model.md (unico | iguales | por_consumo).
ALTER TABLE cuentas ADD COLUMN modo_division TEXT
  CHECK (modo_division IN ('unico', 'iguales', 'por_consumo'));
