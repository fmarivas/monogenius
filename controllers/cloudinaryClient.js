require('dotenv').config()
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: 'hnieilcn5', 
    api_key: '871674386945397', 
    api_secret: process.env.CLOUDINARY_API_SECRET // Use uma variável de ambiente para o secret
});


module.exports = cloudinary