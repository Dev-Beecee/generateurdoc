


'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { DocumentService } from '@/lib/documentService';
import { DocumentField, FormData } from '@/types/document';
import { ArrowLeft, Download, Shield } from 'lucide-react';

export default function PolitiqueConfidentialiteGenerator() {
  const [fields, setFields] = useState<DocumentField[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    const loadFields = async () => {
      try {
        const extractedFields = await DocumentService.extractFieldsFromTemplate('/politique_de_confidentialite.docx');
        const generatedFields = DocumentService.generateFieldsFromVariables(extractedFields);
        setFields(generatedFields);
      } catch (error) {
        console.error('Erreur lors du chargement des champs:', error);
        // Fallback avec des champs prédéfinis
        setFields([
          { name: 'nomSociete', label: 'Nom de la société', type: 'text', required: true },
          { name: 'adresse', label: 'Adresse', type: 'textarea', required: true },
          { name: 'email', label: 'Email de contact', type: 'email', required: true },
          { name: 'siteWeb', label: 'Site web', type: 'text' },
          { name: 'collecteDonnees', label: 'Types de données collectées', type: 'textarea' },
          { name: 'finaliteDonnees', label: 'Finalité de la collecte', type: 'textarea' },
          { name: 'dureeConservation', label: 'Durée de conservation', type: 'text' },
          { name: 'destinataires', label: 'Destinataires des données', type: 'textarea' },
          { name: 'droitsUtilisateur', label: 'Droits des utilisateurs', type: 'textarea' },
          { name: 'cookies', label: 'Utilisation de cookies', type: 'checkbox' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    try {
      const timestamp = Date.now();
      const outputFileName = `politique-confidentialite-${timestamp}.docx`;
      
      await DocumentService.generateDocx('/politique_de_confidentialite.docx', data, outputFileName);
      
      // Notification de succès
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
      notification.textContent = 'Document DOCX téléchargé avec succès !';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      
    } catch (error) {
      console.error('Erreur:', error);
      // Notification d'erreur
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
      notification.textContent = 'Erreur lors de la génération du document';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (field: DocumentField) => {
    const commonProps = {
      ...register(field.name, { required: field.required }),
      className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500",
      placeholder: field.placeholder || `Saisissez ${field.label.toLowerCase()}`
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={3} />;
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Sélectionnez une option</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            {...register(field.name)}
            type="checkbox"
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
        );

      default:
        return <input {...commonProps} type={field.type} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/generator" className="inline-flex items-center text-green-600 hover:text-green-800 mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour au générateur
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-6">
            <Shield className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Générateur de Politique de Confidentialité</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Remplissez les informations ci-dessous pour générer votre politique de confidentialité personnalisée.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'checkbox' ? (
                    <div className="flex items-center">
                      {renderField(field)}
                      <span className="ml-2 text-sm text-gray-600">{field.label}</span>
                    </div>
                  ) : (
                    renderField(field)
                  )}
                  
                  {errors[field.name] && (
                    <p className="mt-1 text-sm text-red-600">Ce champ est requis</p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Télécharger le Document DOCX
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}