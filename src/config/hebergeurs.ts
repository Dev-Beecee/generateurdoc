export interface HebergeurInfo {
    nom: string;
    adresse: string;
    site: string;
  }
  
  export const HEBERGEURS: Record<string, HebergeurInfo> = {
    'ovh': {
      nom: 'OVH',
      adresse: '2 rue Kellermann, 59100 Roubaix, France',
      site: 'https://www.ovh.com'
    },
    'planet-hoster': {
      nom: 'PlanetHoster',
      adresse: '4416 Louis B. Mayer, Laval, QC H7P 0G1, Canada',
      site: 'https://www.planethoster.com'
    },
    'ionos': {
      nom: 'IONOS',
      adresse: 'Montabaur, Allemagne',
      site: 'https://www.ionos.fr'
    },
    'hostinger': {
      nom: 'Hostinger',
      adresse: '61 Lordou Vironos Street, 6023 Larnaca, Chypre',
      site: 'https://www.hostinger.fr'
    },
    'autre': {
      nom: 'Autre',
      adresse: '',
      site: ''
    }
  };
  
  export function getHebergeurByNom(nom: string): HebergeurInfo | null {
    const hebergeur = Object.values(HEBERGEURS).find(h => h.nom === nom);
    return hebergeur || null;
  }
  
  export function getHebergeurOptions(): string[] {
    return Object.values(HEBERGEURS).map(h => h.nom);
  }


