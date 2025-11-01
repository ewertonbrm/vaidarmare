// Este arquivo deve estar em: /api/tide.js

// CRÍTICO: Domínio base da API da Stormglass e endpoint para extremos de maré
const STORMGLASS_BASE_URL = 'https://api.stormglass.io/v2/tide/extremes/point';

// Coordenadas fixas para Natal/RN (aproximadas)
const NATAL_LAT = -5.795;
const NATAL_LNG = -35.210;

// Handler principal para a Vercel Serverless Function
export default async function handler(req, res) {
    // Definir cabeçalhos para permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); // Adicionar Authorization

    // Resposta rápida para requests OPTIONS (preflight CORS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // A chave de API é lida de forma segura da Variável de Ambiente do Vercel
    // OBS: Você mencionou a chave: 15854b62-b73b-11f0-a0d3-0242ac130003, mas é altamente recomendável 
    // que você a configure como uma Variável de Ambiente chamada STORMGLASS_API_KEY no Vercel.
    const API_KEY = process.env.STORMGLASS_API_KEY; 

    if (!API_KEY) {
        console.error("ERRO: STORMGLASS_API_KEY não está configurada como Variável de Ambiente no Vercel.");
        return res.status(500).json({ error: 'Configuração Incompleta do Servidor.', details: 'Chave de API ausente.' });
    }

    // Extrair apenas 'date' da query string do frontend (location/coordinates são fixas)
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Parâmetros Ausentes.', details: 'Data (date) é obrigatória.' });
    }
    
    // Stormglass usa parâmetros 'start' e 'end' no formato YYYY-MM-DD para 24h
    // Definimos 'start' como a data fornecida e 'end' como a mesma data
    const startDate = date; 
    const endDate = date; 

    // Construir a URL final para a Stormglass API
    const finalUrl = new URL(STORMGLASS_BASE_URL);
    finalUrl.searchParams.append('lat', NATAL_LAT);
    finalUrl.searchParams.append('lng', NATAL_LNG);
    finalUrl.searchParams.append('start', startDate); 
    finalUrl.searchParams.append('end', endDate);

    console.log(`DEBUG: Chamando API Stormglass: ${finalUrl.toString()}`);

    try {
        const apiResponse = await fetch(finalUrl.toString(), {
            headers: {
                'Authorization': API_KEY // Chave no cabeçalho
            }
        });
        
        // Se a resposta não for OK (ex: 400, 403, 429 - rate limit), lemos o erro
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json(); // Stormglass geralmente retorna JSON em caso de erro
            
            console.error(`ERRO NA CHAMADA STORMGLASS (STATUS: ${apiResponse.status})`);
            console.error(`Corpo da Resposta Stormglass (para debug): ${JSON.stringify(errorBody)}`);

            // Envia o status e a mensagem de erro para o frontend
            let errorMessage = `Erro na API Stormglass (Status: ${apiResponse.status}).`;
            if (apiResponse.status === 429) {
                errorMessage = 'ERRO STORMGLASS (429): Limite de Requisições (Rate Limit) Atingido.';
            } else if (apiResponse.status === 403) {
                 errorMessage = 'ERRO STORMGLASS (403): Chave Inválida ou Plano sem Acesso a Marés.';
            }

            return res.status(apiResponse.status).json({ 
                error: errorMessage, 
                status: apiResponse.status,
                details: errorBody 
            });
        }

        // Se a resposta for OK (200), retorna o JSON diretamente
        const data = await apiResponse.json();
        
        // LOGA O CORPO DA RESPOSTA JSON ANTES DE ENVIAR AO FRONTEND
        console.log(`DEBUG: JSON de Sucesso Recebido da Stormglass: ${JSON.stringify(data)}`);
        
        return res.status(200).json(data);

    } catch (error) {
        console.error('Erro na requisição para a Stormglass API:', error);
        return res.status(500).json({ error: 'Falha na Conexão com o Servidor Externo.', details: error.message });
    }
}
