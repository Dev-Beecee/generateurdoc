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
      
      // Remplacer les variables dans le XML
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

  
  private static replaceVariablesInXml(xml: string, data: Record<string, unknown>): string {
    let result = xml;
    
    // D'abord, identifier l'hébergeur sélectionné
    let selectedHebergeur: string | null = null;
    Object.keys(data).forEach(key => {
      if (key.toLowerCase().includes('hebergeur') && !key.toLowerCase().includes('adresse') && !key.toLowerCase().includes('site')) {
        selectedHebergeur = data[key] as string;
      }
    });

    const hebergeurInfo = selectedHebergeur ? getHebergeurByNom(selectedHebergeur) : null;
    
    // Remplacer les variables standard
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

    // Remplacer les variables d'hébergeur spéciales (même si elles ne sont pas dans le formulaire)
    if (hebergeurInfo) {
      // Variables possibles pour l'adresse de l'hébergeur
      const adresseVariants = [
        'adressehebergeur', 'hebergeuradresse', 'adresse_hebergeur', 
        'hebergeur_adresse', 'adresseHebergeur', 'hebergeurAdresse',
        'ADRESSEHEBERGEUR'
      ];
      
      adresseVariants.forEach(variant => {
        const regex = new RegExp(`\\{${variant}\\}`, 'gi');
        result = result.replace(regex, hebergeurInfo.adresse);
      });

      // Variables possibles pour le site de l'hébergeur
      const siteVariants = [
        'sitehebergeur', 'hebergeursite', 'site_hebergeur',
        'hebergeur_site', 'siteHebergeur', 'hebergeurSite'
      ];
      
      siteVariants.forEach(variant => {
        const regex = new RegExp(`\\{${variant}\\}`, 'gi');
        result = result.replace(regex, hebergeurInfo.site);
      });

      // Variables possibles pour le nom de l'hébergeur  
      const nomVariants = [
        'nomhebergeur', 'hebergeurnom', 'nom_hebergeur',
        'hebergeur_nom', 'nomHebergeur', 'hebergeurNom'
      ];
      
      nomVariants.forEach(variant => {
        const regex = new RegExp(`\\{${variant}\\}`, 'gi');
        result = result.replace(regex, hebergeurInfo.nom);
      });
    }
    
    return result;
  }
  
  /**
   * Génère automatiquement des champs de formulaire à partir des variables détectées
   */
  static generateFieldsFromVariables(variables: string[]): DocumentField[] {
    return variables
      .filter(variable => {
        // Masquer tous les champs d'hébergeur sauf le champ de sélection principal
        const lowerVar = variable.toLowerCase();
        
        // Garder seulement le champ principal "hebergeur" 
        if (lowerVar === 'hebergeur') {
          return true;
        }
        
        // Masquer toutes les autres variantes d'hébergeur (adresse, site, nom, etc.)
        const hebergeurVariants = [
          'adressehebergeur', 'hebergeuradresse', 'adresse_hebergeur', 'hebergeur_adresse',
          'adresseHebergeur', 'hebergeurAdresse', 'sitehebergeur', 'hebergeursite', 
          'site_hebergeur', 'hebergeur_site', 'siteHebergeur', 'hebergeurSite',
          'nomhebergeur', 'hebergeurnom', 'nom_hebergeur', 'hebergeur_nom',
          'nomHebergeur', 'hebergeurNom'
        ];
        
        return !hebergeurVariants.includes(lowerVar);
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
      
      // Configuration spéciale pour le champ hébergeur principal
      if (variable.toLowerCase() === 'hebergeur') {
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

