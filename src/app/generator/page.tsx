'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DocumentService } from '@/lib/documentService';
import { FileText, Shield, ArrowLeft } from 'lucide-react';

export default function GeneratorPage() {
  const [mentionsFields, setMentionsFields] = useState<string[]>([]);
  const [politiqueFields, setPolitiqueFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const extractFields = async () => {
      try {
        const [mentions, politique] = await Promise.all([
          DocumentService.extractFieldsFromTemplate('/mentions_legale.docx'),
          DocumentService.extractFieldsFromTemplate('/politique_de_confidentialite.docx')
        ]);
        
        setMentionsFields(mentions);
        setPolitiqueFields(politique);
      } catch (error) {
        console.error('Erreur lors de l\'extraction des champs:', error);
      } finally {
        setLoading(false);
      }
    };

    extractFields();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyse des templates en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Générateur de Documents</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mentions Légales */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold">Mentions Légales</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              Champs détectés dans votre template :
            </p>
            
            <div className="bg-gray-50 rounded p-4 mb-4">
              <div className="flex flex-wrap gap-2">
                {mentionsFields.map((field, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {field}
                  </span>
                ))}
              </div>
            </div>
            
            <Link 
              href="/generator/mentions-legales"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors inline-block text-center"
            >
              Générer le Document
            </Link>
          </div>

          {/* Politique de Confidentialité */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold">Politique de Confidentialité</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              Champs détectés dans votre template :
            </p>
            
            <div className="bg-gray-50 rounded p-4 mb-4">
              <div className="flex flex-wrap gap-2">
                {politiqueFields.map((field, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {field}
                  </span>
                ))}
              </div>
            </div>
            
            <Link 
              href="/generator/politique-confidentialite"
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors inline-block text-center"
            >
              Générer le Document
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
