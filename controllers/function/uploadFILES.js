const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('../cloudinaryClient');

class Files {
    static async uploadImagesFromFolder(folderPath, baseFolder = '') {
        try {
            const files = await fs.readdir(folderPath, { withFileTypes: true });
            for (const file of files) {
                const filePath = path.join(folderPath, file.name);
                if (file.isDirectory()) {
                    // Se for um diretório, chama a função recursivamente
                    await Files.uploadImagesFromFolder(filePath, path.join(baseFolder, file.name));
                } else if (['.jpg', '.jpeg', '.png', '.gif', 'webp', 'ico'].includes(path.extname(file.name).toLowerCase())) {
                    // Se for uma imagem, faz o upload
                    const relativePath = path.relative(baseFolder, filePath);
                    const publicId = `${relativePath.replace(/\\/g, '/')}`.replace(/\.[^/.]+$/, "");
                    const result = await cloudinary.uploader.upload(filePath, {
                        public_id: publicId,
                        folder: 'assets'
                    });
                    console.log(`Imagem ${file.name} carregada com sucesso. URL: ${result.secure_url}`);
                }
            }
        } catch (error) {
            console.error(`Erro ao processar a pasta ${folderPath}:`, error);
            throw error; // Propaga o erro para ser tratado no nível superior
        }
    }

    static async uploadAllImages(baseImagePath) {
        try {
            await Files.uploadImagesFromFolder(baseImagePath, baseImagePath);
            console.log('Todos os uploads concluídos');
            return true; // Indica sucesso
        } catch (error) {
            console.error('Erro ao fazer upload de todas as imagens:', error);
            return false; // Indica falha
        }
    }
	

	static async uploadImage(imagePath, id, options = {}) {
		try {
			const uploadOptions = {
				public_id: id,
				...options
			};
			const result = await cloudinary.uploader.upload(imagePath, uploadOptions);
			return result.secure_url;
		} catch (error) {
			console.error('Erro ao fazer upload da imagem:', error);
			throw error;
		}
	}

	static async getOptimizedUrl(publicId) {
		return cloudinary.url(publicId, {
			fetch_format: 'auto',
			quality: 'auto'
		});
	}	
}

module.exports = Files;