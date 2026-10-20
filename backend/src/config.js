export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? './data/foodware.db',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
