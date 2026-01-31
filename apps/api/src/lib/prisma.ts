import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma';

const connectionString = process.env.DATABASE_URL;

// Configura o pool com limites para evitar "too many clients"
// max: máximo de conexões no pool
// min: mínimo de conexões mantidas
// idleTimeoutMillis: tempo para fechar conexões ociosas
const pool = new Pool({
  connectionString,
  max: 15, // Máximo de 15 conexões simultâneas (reduzido para evitar "too many clients")
  min: 2, // Mantém pelo menos 2 conexões abertas
  idleTimeoutMillis: 20000, // Fecha conexões ociosas após 20s (mais agressivo)
  connectionTimeoutMillis: 5000, // Timeout de 5s para obter conexão
  allowExitOnIdle: true, // Permite fechar conexões quando não há uso
});

// Trata erros do pool
pool.on('error', () => {
  // Erro inesperado no pool do PostgreSQL
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});