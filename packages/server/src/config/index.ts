import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    name: process.env.DB_NAME || 'uniforum',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'uniforum_jwt_secret'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'uniforum_jwt_refresh_secret'),
    accessTokenExpiry: '2h',
    refreshTokenExpiry: '7d',
  },
  port: parseInt(process.env.PORT || '3000'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
