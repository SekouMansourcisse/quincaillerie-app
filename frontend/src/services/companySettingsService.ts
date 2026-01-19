export interface CompanySettings {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
}

const STORAGE_KEY = 'company_settings';

export const defaultCompanySettings: CompanySettings = {
    name: 'Quincaillerie Moderne',
    address: 'Rue du Commerce, Bamako, Mali',
    phone: '+223 XX XX XX XX',
    email: 'contact@quincaillerie.com'
};

/**
 * Récupère les paramètres de l'entreprise depuis le LocalStorage
 */
export const getCompanySettings = (): CompanySettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Valider que toutes les propriétés requises sont présentes
            if (parsed.name && parsed.address && parsed.phone && parsed.email) {
                return parsed;
            }
        }
    } catch (error) {
        console.error('Erreur lors de la lecture des paramètres:', error);
    }
    return defaultCompanySettings;
};

/**
 * Sauvegarde les paramètres de l'entreprise dans le LocalStorage
 */
export const saveCompanySettings = (settings: CompanySettings): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres:', error);
        throw new Error('Impossible de sauvegarder les paramètres');
    }
};

/**
 * Réinitialise les paramètres aux valeurs par défaut
 */
export const resetCompanySettings = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Erreur lors de la réinitialisation des paramètres:', error);
        throw new Error('Impossible de réinitialiser les paramètres');
    }
};

/**
 * Exporte les paramètres en JSON pour sauvegarde
 */
export const exportSettings = (): string => {
    const settings = getCompanySettings();
    return JSON.stringify(settings, null, 2);
};

/**
 * Importe les paramètres depuis un JSON
 */
export const importSettings = (jsonString: string): CompanySettings => {
    try {
        const settings = JSON.parse(jsonString);
        if (!settings.name || !settings.address || !settings.phone || !settings.email) {
            throw new Error('Format de fichier invalide');
        }
        saveCompanySettings(settings);
        return settings;
    } catch (error) {
        throw new Error('Impossible d\'importer les paramètres. Vérifiez le format du fichier.');
    }
};

export const companySettingsService = {
    getCompanySettings,
    saveCompanySettings,
    resetCompanySettings,
    exportSettings,
    importSettings
};
