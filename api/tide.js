// Este arquivo deve estar em: /api/tide.js

// CRÍTICO: Domínio base da API da Stormglass e endpoint para extremos de maré
const STORMGLASS_BASE_URL = 'https://api.stormglass.io/v2/tide/extremes/point';

// Coordenadas fixas para Natal/RN (aproximadas)
const NATAL_LAT = -5.8487;
const NATAL_LNG = -35.2540;

// Handler principal para a Vercel Serverless Function
export default async function handler(req, res) {
    // Definir cabeçalhos para permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); 

    // Resposta rápida para requests OPTIONS (preflight CORS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const API_KEY = process.env.STORMGLASS_API_KEY; 

    if (!API_KEY) {
        console.error("ERRO: STORMGLASS_API_KEY não está configurada como Variável de Ambiente no Vercel.");
        return res.status(500).json({ error: 'Configuração Incompleta do Servidor.', details: 'Chave de API ausente.' });
    }

    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Parâmetros Ausentes.', details: 'Data (date) é obrigatória.' });
    }
    
    // CORREÇÃO DE FORMATO: Definir start/end no formato ISO 8601 (com tempo e UTC 'Z') para 24h completas.
    const startDateISO = `${date}T00:00:00Z`; 
    const endDateISO = `${date}T23:59:59Z`; 

    // Construir a URL final para a Stormglass API
    const finalUrl = new URL(STORMGLASS_BASE_URL);
    finalUrl.searchParams.append('lat', NATAL_LAT);
    finalUrl.searchParams.append('lng', NATAL_LNG);
    finalUrl.searchParams.append('start', startDateISO); 
    finalUrl.searchParams.append('end', endDateISO);
    
    // CORREÇÃO DE PARÂMETRO CRÍTICO: Mudar a base de referência (datum) de MSL para LAT (Lowest Astronomical Tide)
    // Isso garante que as alturas de maré sejam positivas, como nas tabelas de navegação.
    finalUrl.searchParams.append('datum', 'LAT');

    console.log(`DEBUG: Chamando API Stormglass: ${finalUrl.toString()}`);

    try {
        const apiResponse = await fetch(finalUrl.toString(), {
            headers: {
                'Authorization': API_KEY // Chave no cabeçalho
            }
        });
        
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json(); 
            
            console.error(`ERRO NA CHAMADA STORMGLASS (STATUS: ${apiResponse.status})`);
            console.error(`Corpo da Resposta Stormglass (para debug): ${JSON.stringify(errorBody)}`);

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

        const data = await apiResponse.json();
        
        console.log(`DEBUG: JSON de Sucesso Recebido da Stormglass: ${JSON.stringify(data)}`);
        
        return res.status(200).json(data);

    } catch (error) {
        console.error('Erro na requisição para a Stormglass API:', error);
        return res.status(500).json({ error: 'Falha na Conexão com o Servidor Externo.', details: error.message });
    }
}
