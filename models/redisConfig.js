require('dotenv').config();
const { createClient } = require('redis');

// Criação do cliente Redis com a URL de conexão das variáveis de ambiente
const redisClient = createClient({
  url: process.env.REDIS_URL
});

// Tratamento de erros do cliente Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Erro ao conectar ao Redis:', err);
  }
})();

module.exports = redisClient;
