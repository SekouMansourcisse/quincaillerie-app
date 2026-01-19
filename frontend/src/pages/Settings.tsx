import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { useToast } from '../context/ToastContext';
import { useCompanySettings } from '../context/CompanySettingsContext';
import { CompanySettings, resetCompanySettings, exportSettings, importSettings } from '../services/companySettingsService';
import { Building2, Save, RotateCcw, Download, Upload, Mail, Phone, MapPin } from 'lucide-react';

const Settings: React.FC = () => {
    const toast = useToast();
    const { settings: currentSettings, updateSettings } = useCompanySettings();

    const [formData, setFormData] = useState<CompanySettings>(currentSettings);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(currentSettings);
    }, [currentSettings]);

    useEffect(() => {
        // Vérifier si le formulaire a été modifié
        const changed =
            formData.name !== currentSettings.name ||
            formData.address !== currentSettings.address ||
            formData.phone !== currentSettings.phone ||
            formData.email !== currentSettings.email;
        setHasChanges(changed);
    }, [formData, currentSettings]);

    const handleChange = (field: keyof CompanySettings, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        // Validation
        if (!formData.name.trim()) {
            toast.error('Le nom de l\'entreprise est requis');
            return;
        }
        if (!formData.address.trim()) {
            toast.error('L\'adresse est requise');
            return;
        }
        if (!formData.phone.trim()) {
            toast.error('Le numéro de téléphone est requis');
            return;
        }
        if (!formData.email.trim()) {
            toast.error('L\'email est requis');
            return;
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error('Format d\'email invalide');
            return;
        }

        setIsSaving(true);
        try {
            updateSettings(formData);
            toast.success('Paramètres sauvegardés avec succès');
            setHasChanges(false);
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde des paramètres');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Êtes-vous sûr de vouloir réinitialiser aux valeurs par défaut ?')) {
            try {
                resetCompanySettings();
                window.location.reload(); // Recharger pour appliquer les changements
            } catch (error) {
                toast.error('Erreur lors de la réinitialisation');
            }
        }
    };

    const handleExport = () => {
        try {
            const json = exportSettings();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'parametres-entreprise.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Paramètres exportés avec succès');
        } catch (error) {
            toast.error('Erreur lors de l\'export');
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const imported = importSettings(text);
                setFormData(imported);
                toast.success('Paramètres importés avec succès');
            } catch (error: any) {
                toast.error(error.message || 'Erreur lors de l\'import');
            }
        };
        input.click();
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'entreprise</h1>
                        <p className="text-gray-600">Configurez les informations affichées sur vos factures</p>
                    </div>
                    <Building2 className="text-blue-600" size={40} />
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                        <strong>💡 Astuce:</strong> Ces informations apparaîtront sur toutes vos factures imprimées et exportées en PDF.
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    {/* Nom de l'entreprise */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Building2 className="inline mr-2" size={16} />
                            Nom de l'entreprise *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Quincaillerie Moderne"
                            required
                        />
                    </div>

                    {/* Adresse */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin className="inline mr-2" size={16} />
                            Adresse complète *
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Rue du Commerce, Bamako, Mali"
                            required
                        />
                    </div>

                    {/* Téléphone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone className="inline mr-2" size={16} />
                            Numéro de téléphone *
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: +223 XX XX XX XX"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail className="inline mr-2" size={16} />
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: contact@quincaillerie.com"
                            required
                        />
                    </div>

                    {/* Actions principales */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${hasChanges && !isSaving
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <Save size={20} />
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                        </button>
                    </div>
                </div>

                {/* Actions avancées */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions avancées</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Download size={18} />
                            Exporter
                        </button>
                        <button
                            onClick={handleImport}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Upload size={18} />
                            Importer
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                        >
                            <RotateCcw size={18} />
                            Réinitialiser
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Exportez vos paramètres pour les sauvegarder ou les transférer vers un autre appareil.
                    </p>
                </div>

                {/* Prévisualisation */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Prévisualisation de la facture</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                        <div className="max-w-md">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">{formData.name || 'Nom de l\'entreprise'}</h2>
                            <p className="text-gray-600">{formData.address || 'Adresse'}</p>
                            <p className="text-gray-600">Tél: {formData.phone || 'Téléphone'}</p>
                            <p className="text-gray-600">{formData.email || 'Email'}</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Aperçu de l'en-tête qui apparaîtra sur vos factures
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
