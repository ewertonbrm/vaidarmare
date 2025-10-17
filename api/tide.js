// FUNÇÃO AGORA USA O 'FETCH' NATIVO DO NODE.JS 20.X
// Removida a linha 'import fetch from "node-fetch";'

export default async function handler(request, response) {
    // 1. Recebe os parâmetros do frontend (location e date)
    const { location, date } = request.query;

    if (!location || !date) {
        return response.status(400).json({ 
            code: '400', 
            message: 'Parâmetros location e date são obrigatórios.' 
        });
    }

    // 2. Obtém a chave da API de forma SEGURA através das Variáveis de Ambiente do Vercel
    const API_KEY = process.env.QWEATHER_API_KEY;

    if (!API_KEY) {
        // Retorna um erro específico se a variável não estiver configurada no Vercel
        console.error('ERRO: Variável QWEATHER_API_KEY não definida.');
        return response.status(500).json({ 
            code: '500', 
            message: 'Erro de Servidor: Chave de API (QWEATHER_API_KEY) não configurada nas variáveis de ambiente do Vercel.' 
        });
    }

    // 3. Constrói a URL para a QWeather (Usamos a API base oficial)
    const QWEATHER_URL = `https://api.qweather.com/v7/ocean/tide?location=${location}&date=${date}&key=${API_KEY}`;
    
    try {
        // 4. Faz a requisição à QWeather API usando fetch nativo
        const qweatherResponse = await fetch(QWEATHER_URL);
        
        // NOVO: Adiciona log detalhado em caso de erro HTTP (ex: 403) na chamada para QWeather
        if (!qweatherResponse.ok) {
            // Clona a resposta para poder ler o corpo (para debug) e ainda passá-la adiante
            const errorBodyText = await qweatherResponse.clone().text();
            console.error(`ERRO NA CHAMADA QWEATHER (STATUS: ${qweatherResponse.status})`);
            console.error('Corpo da Resposta QWeather (para debug):', errorBodyText);
        }

        // 5. Retorna o conteúdo (JSON) da QWeather diretamente para o frontend
        const data = await qweatherResponse.json();

        // Configura o cabeçalho CORS para permitir que o frontend acesse
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Content-Type', 'application/json');

        // Retorna o status original da QWeather (incluindo o 403)
        return response.status(qweatherResponse.status).json(data);

    } catch (error) {
        console.error('Erro na chamada da API QWeather:', error);
        return response.status(500).json({ 
            code: '500', 
            message: 'Falha interna ao se comunicar com a API QWeather.',
            details: error.message 
        });
    }
}
