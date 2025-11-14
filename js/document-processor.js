// Document Processing Module - Handles PDF and text extraction
export class DocumentProcessor {
  /**
   * Extract text from PDF file
   */
  async extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += '\n\n' + pageText;
    }
    
    return fullText.trim();
  }

  /**
   * Extract text from text file
   */
  async extractTextFromFile(file) {
    return await file.text();
  }

  /**
   * Extract text from file (auto-detect type)
   */
  async extractText(file) {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      return await this.extractTextFromPDF(file);
    } else {
      return await this.extractTextFromFile(file);
    }
  }
}

