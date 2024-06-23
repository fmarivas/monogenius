const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth'); // Para arquivos DOCX
const WordExtractor = require('word-extractor');

class FileReaderPro {
  static async readFile(file) {
    const SUPPORTED_EXTENSIONS = ['.doc', '.docx', '.pdf', '.txt'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    const extension = path.extname(file.originalname).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      return { success: false, message: 'Extensão de arquivo não suportada.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, message: 'O arquivo excede o tamanho máximo permitido.' };
    }

    try {
      let content = '';

      switch (extension) {
        case '.txt':
          content = file.buffer.toString('utf-8');
          break;
        case '.pdf':
          const pdfData = await pdfParse(file.buffer);
          content = pdfData.text;
          break;
        case '.docx':
          const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
          content = docxResult.value;
          break;
        case '.doc':
          const extractor = new WordExtractor();
          const extracted = await extractor.extract(file.buffer);
          content = extracted.getBody();
		  break;
        default:
          return { success: false, message: 'Tipo de arquivo não suportado.' };
      }

      return { success: true, content };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Erro ao ler o arquivo.' };
    }
  }
}

module.exports = FileReaderPro;
