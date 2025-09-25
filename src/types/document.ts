export interface DocumentField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // Pour les champs select
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  templatePath: string;
  fields: DocumentField[];
  outputFormat: 'docx' | 'pdf';
}

export interface FormData {
  [key: string]: string | string[] | boolean;
}