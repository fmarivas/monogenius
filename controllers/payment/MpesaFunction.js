require('dotenv').config();

const axios = require('axios');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const base64 = require('js-base64').Base64;

const forge = require('node-forge');
const NodeRSA = require('node-rsa');

function getBearerToken(apiKey, publicKey) {
    try {
        // Decodificar a chave pública de base64
        const publicKeyBuffer = Buffer.from(publicKey, 'base64');
        
        // Gerar a chave pública
        const publicKeyObject = crypto.createPublicKey({
            key: publicKeyBuffer,
            format: 'der',
            type: 'spki'
        });

        // Encriptar a API key
        const encryptedApiKey = crypto.publicEncrypt(
            {
                key: publicKeyObject,
                padding: crypto.constants.RSA_PKCS1_PADDING
            },
            Buffer.from(apiKey)
        );

        // Retornar o resultado em base64
        return encryptedApiKey.toString('base64');
    } catch (e) {
        console.error('Erro ao gerar o Bearer Token:', e.message);
        return null;
    }
}

const mpesaB2CPayment = async (customerMSISDN, amount) => {
    const apiContext = {
        apiKey: process.env.MPESA_API_KEY,
        publicKey: process.env.MPESA_PUBLIC_KEY,
        host: process.env.MPESA_API_HOST,
        port: 18352,
        path: '/ipg/v1x/c2bPayment/singleStage/',
        origin: process.env.MPESA_ORIGIN,
        serviceProviderCode: process.env.MPESA_SERVICE_PROVIDER_CODE
    };

	const bearerToken = getBearerToken(apiContext.apiKey, apiContext.publicKey);

    if (!bearerToken) {
        return {
            success: false,
            error: 'Falha ao gerar o Bearer Token',
            statusCode: 500
        };
    }

    const requestData = {
        input_TransactionReference: `T12344C`,
        input_CustomerMSISDN: customerMSISDN,
        input_Amount: amount.toString(),
        input_ThirdPartyReference: `9MS9MA`,
        input_ServiceProviderCode: apiContext.serviceProviderCode
    };

    try {
        const response = await axios({
            method: 'post',
            url: `https://${apiContext.host}:${apiContext.port}${apiContext.path}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MPESA_TOKEN}`,
                'Origin': apiContext.origin
            },
            data: requestData,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // Apenas para ambiente de sandbox
            })
        });

        return {
            success: true,
            data: response.data,
            statusCode: response.status
        };
    } catch (error) {
        console.error('Erro detalhado:', error.response ? error.response.data : error.message);
        return {
            success: false,
            error: error.response ? error.response.data : error.message,
            statusCode: error.response ? error.response.status : 500
        };
    }
};

module.exports = mpesaB2CPayment;
