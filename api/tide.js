// Este arquivo deve estar em: /api/tide.js

import { URLSearchParams } from 'url';

// CRÍTICO: Domínio base da API da QWeather, usando o seu domínio customizado.
const QWEATHER_BASE_URL = 'https://ky33jp8fv5.re.qweatherapi.com/v7/ocean/tide';

// Handler principal para a Vercel Serverless Function
export default async function handler(req, res) {
    // Definir cabeçalhos para permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Resposta rápida para requests OPTIONS (preflight CORS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // A chave de API é lida de forma segura da Variável de Ambiente do Vercel
    const API_KEY = process.env.QWEATHER_API_KEY;

    if (!API_KEY) {
        console.error("ERRO: QWEATHER_API_KEY não está configurada como Variável de Ambiente no Vercel.");
        return res.status(500).json({ error: 'Configuração Incompleta do Servidor.', details: 'Chave de API ausente.' });
    }

    // Extrair location e date da query string do frontend
    const { location, date } = req.query;

    if (!location || !date) {
        return res.status(400).json({ error: 'Parâmetros Ausentes.', details: 'Localização (location) e Data (date) são obrigatórios.' });
    }
    
    // Construir a URL final para a QWeather API
    const finalUrl = new URL(QWEATHER_BASE_URL);
    finalUrl.searchParams.append('location', location);
    finalUrl.searchParams.append('date', date);
    finalUrl.searchParams.append('key', API_KEY); // Adiciona a chave de forma secreta

    console.log(`DEBUG: Chamando API QWeather: ${finalUrl.toString()}`);

    try {
        const apiResponse = await fetch(finalUrl.toString());
        
        // Se a resposta não for OK (ex: 400, 403), lemos o erro para diagnóstico
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            
            console.error(`ERRO NA CHAMADA QWEATHER (STATUS: ${apiResponse.status})`);
            console.error(`Corpo da Resposta QWeather (para debug): ${errorBody}`);

            // Envia o status e a mensagem de erro para o frontend
            return res.status(apiResponse.status).json({ 
                error: 'Erro na API QWeather. Verifique a chave e o domínio.', 
                status: apiResponse.status,
                details: errorBody 
            });
        }

        // Se a resposta for OK (200), retorna o JSON diretamente
        const data = await apiResponse.json();
        
        // NOVO: LOGA O CORPO DA RESPOSTA JSON ANTES DE ENVIAR AO FRONTEND
        console.log(`DEBUG: JSON de Sucesso Recebido da QWeather: ${JSON.stringify(data)}`);
        
        return res.status(200).json(data);

    } catch (error) {
        console.error('Erro na requisição para a QWeather API:', error);
        return res.status(500).json({ error: 'Falha na Conexão com o Servidor Externo.', details: error.message });
    }
}
