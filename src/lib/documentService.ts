import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { DocumentField } from '../types/document';
import { HEBERGEURS, getHebergeurByNom, HebergeurInfo } from '../config/hebergeurs';

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
    data: Record<string, unknown>,
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
      
      // Traitement spécial pour l'hébergeur
      const processedData = this.processHebergeurData(data);
      
      const updatedXml = this.replaceVariablesInXml(documentXml, processedData);
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

  /**
   * Traite les données pour remplacer le nom de l'hébergeur par son adresse
   */
  private static processHebergeurData(data: Record<string, unknown>): Record<string, unknown> {
    const processedData = { ...data };
    
    // Chercher les champs hébergeur et les remplacer par l'adresse
    Object.keys(processedData).forEach(key => {
      if (key.toLowerCase().includes('hebergeur')) {
        const hebergeurNom = processedData[key] as string;
        const hebergeur = getHebergeurByNom(hebergeurNom);
        
        if (hebergeur && hebergeur.adresse) {
          processedData[key] = hebergeur.adresse;
        }
      }
    });
    
    return processedData;
  }
  
  private static replaceVariablesInXml(xml: string, data: Record<string, unknown>): string {
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
    return variables
      .filter(variable => {
        // Masquer les champs d'adresse d'hébergeur car ils sont gérés automatiquement
        const lowerVar = variable.toLowerCase();
        return !(lowerVar.includes('hebergeur') && lowerVar.includes('adresse'));
      })
      .map(variable => {
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
      
      // Configuration spéciale pour le champ hébergeur
      if (variable.toLowerCase().includes('hebergeur') && !variable.toLowerCase().includes('adresse')) {
        field.type = 'select';
        field.options = Object.values(HEBERGEURS).map(h => h.nom);
        field.placeholder = 'Sélectionnez votre hébergeur';
        field.label = 'Hébergeur';
      }
      
      return field;
    });
  }

  // Fonction statique pour obtenir les informations d'un hébergeur par nom
  static getHebergeurByNom(nom: string): HebergeurInfo | null {
    return getHebergeurByNom(nom);
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

