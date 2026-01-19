import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompanySettings, getCompanySettings, saveCompanySettings as saveSettings } from '../services/companySettingsService';

interface CompanySettingsContextType {
    settings: CompanySettings;
    updateSettings: (settings: CompanySettings) => void;
    isLoading: boolean;
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined);

export const CompanySettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<CompanySettings>(() => getCompanySettings());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Charger les paramètres au démarrage
        const loadedSettings = getCompanySettings();
        setSettings(loadedSettings);
    }, []);

    const updateSettings = (newSettings: CompanySettings) => {
        setIsLoading(true);
        try {
            saveSettings(newSettings);
            setSettings(newSettings);
        } catch (error) {
            console.error('Erreur lors de la mise à jour des paramètres:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CompanySettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
            {children}
        </CompanySettingsContext.Provider>
    );
};

export const useCompanySettings = (): CompanySettingsContextType => {
    const context = useContext(CompanySettingsContext);
    if (context === undefined) {
        throw new Error('useCompanySettings must be used within a CompanySettingsProvider');
    }
    return context;
};
