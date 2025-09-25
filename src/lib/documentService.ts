import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
const JSZip = require('jszip');
import { DocumentField } from '../types/document';

export class DocumentService {
  /**
   * Extrait automatiquement les variables d'un fichier DOCX
   */
  static async extractFieldsFromTemplate(templatePath: string): Promise<string[]> {
    try {
      const response = await fetch(templatePath);
      const arrayBuffer = await response.arrayBuffer();
      
      const zip = new JSZip();
      const docxZip = await zip.loadAsync(arrayBuffer);
      
      const documentXml = await docxZip.file('word/document.xml')?.async('string');
      if (!documentXml) {
        throw new Error('Impossible de lire le contenu du document');
      }
      
      // Extraire toutes les variables {nom}, {email}, etc.
      const variableRegex = /\{([^}]+)\}/g;
      const variables = new Set<string>();
      let match;
      
      while ((match = variableRegex.exec(documentXml)) !== null) {
        variables.add(match[1]);
      }
      
      return Array.from(variables);
    } catch (error) {
      console.error('Erreur lors de l\'extraction des champs:', error);
      return [];
    }
  }
  
  /**
   * Génère un document DOCX à partir d'un template et de données
   */
  static async generateDocx(
    templatePath: string,
    data: Record<string, any>,
    outputFileName: string
  ): Promise<void> {
    try {
      const response = await fetch(templatePath);
      const arrayBuffer = await response.arrayBuffer();
      
      const zip = new JSZip();
      const docxZip = await zip.loadAsync(arrayBuffer);
      
      const documentXml = await docxZip.file('word/document.xml')?.async('string');
      if (!documentXml) {
        throw new Error('Impossible de lire le contenu du document');
      }
      
      const updatedXml = this.replaceVariablesInXml(documentXml, data);
      docxZip.file('word/document.xml', updatedXml);
      
      const newDocxBuffer = await docxZip.generateAsync({ type: 'arraybuffer' });
      
      const blob = new Blob([newDocxBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      saveAs(blob, outputFileName);
    } catch (error) {
      console.error('Erreur lors de la génération du document DOCX:', error);
      throw new Error('Impossible de générer le document DOCX');
    }
  }

  
  private static replaceVariablesInXml(xml: string, data: Record<string, any>): string {
    let result = xml;
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'string') {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, value);
      } else if (Array.isArray(value)) {
        const listValue = value.join(', ');
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, listValue);
      } else if (typeof value === 'boolean') {
        const boolValue = value ? 'Oui' : 'Non';
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, boolValue);
      }
    });
    
    return result;
  }
  
  /**
   * Génère automatiquement des champs de formulaire à partir des variables détectées
   */
  static generateFieldsFromVariables(variables: string[]): DocumentField[] {
    return variables.map(variable => {
      const field: DocumentField = {
        name: variable,
        label: this.formatFieldLabel(variable),
        type: this.guessFieldType(variable),
        required: false
      };
      
      // Ajouter des options pour certains champs
      if (variable.toLowerCase().includes('forme') || variable.toLowerCase().includes('type')) {
        field.type = 'select';
        field.options = ['SARL', 'SAS', 'EURL', 'Auto-entrepreneur', 'Association', 'Autre'];
      }
      
      return field;
    });
  }
  
  private static formatFieldLabel(variable: string): string {
    return variable
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
  
  private static guessFieldType(variable: string): 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'date' {
    const lowerVar = variable.toLowerCase();
    
    if (lowerVar.includes('email') || lowerVar.includes('mail')) {
      return 'email';
    }
    
    if (lowerVar.includes('adresse') || lowerVar.includes('description') || lowerVar.includes('commentaire')) {
      return 'textarea';
    }
    
    if (lowerVar.includes('date')) {
      return 'date';
    }
    
    if (lowerVar.includes('accepte') || lowerVar.includes('coche') || lowerVar.includes('oui') || lowerVar.includes('non')) {
      return 'checkbox';
    }
    
    return 'text';
  }
}

