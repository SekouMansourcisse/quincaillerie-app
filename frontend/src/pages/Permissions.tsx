import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import { permissionService, Permission, RolesPermissionsResponse } from '../services/permissionService';
import { useToast } from '../context/ToastContext';
import { Shield, Check, X, Save, RefreshCw, Users, Lock } from 'lucide-react';
import Spinner from '../components/common/Spinner';

const Permissions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<RolesPermissionsResponse | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Record<string, number[]>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const result = await permissionService.getAllRolesPermissions();
      setData(result);
      setEditedPermissions(result.rolePermissions);
      setHasChanges(false);
    } catch (error) {
      console.error('Erreur lors du chargement des permissions:', error);
      toast.error('Impossible de charger les permissions');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (role: string, permissionId: number) => {
    if (role === 'admin') {
      toast.warning('Les permissions de l\'administrateur ne peuvent pas être modifiées');
      return;
    }

    setEditedPermissions(prev => {
      const rolePerms = prev[role] || [];
      const newPerms = rolePerms.includes(permissionId)
        ? rolePerms.filter(id => id !== permissionId)
        : [...rolePerms, permissionId];

      return { ...prev, [role]: newPerms };
    });
    setHasChanges(true);
  };

  const savePermissions = async (role: string) => {
    if (role === 'admin') return;

    try {
      setSaving(true);
      await permissionService.updateRolePermissions(role, editedPermissions[role] || []);
      toast.success(`Permissions du rôle "${getRoleLabel(role)}" mises à jour`);

      // Recharger pour synchroniser
      await loadPermissions();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des permissions');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      manager: 'Manager',
      employee: 'Employé'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      employee: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const groupPermissionsByModule = (permissions: Permission[]) => {
    return permissions.reduce((acc: Record<string, Permission[]>, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-8 text-gray-500">
          Impossible de charger les permissions
        </div>
      </Layout>
    );
  }

  const groupedPermissions = groupPermissionsByModule(data.permissions);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="text-primary-600" />
              Gestion des Permissions
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Configurez les permissions pour chaque rôle
            </p>
          </div>
          <button
            onClick={loadPermissions}
            className="btn btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* Légende des rôles */}
        <div className="card">
          <div className="flex flex-wrap gap-4">
            {data.roles.map(role => (
              <div key={role} className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(role)}`}>
                  {getRoleLabel(role)}
                </span>
                {role === 'admin' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">(toutes les permissions)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tableau des permissions */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Permission
                  </th>
                  {data.roles.map(role => (
                    <th key={role} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(role)}`}>
                          {getRoleLabel(role)}
                        </span>
                        {role !== 'admin' && (
                          <button
                            onClick={() => savePermissions(role)}
                            disabled={saving}
                            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <Save size={12} />
                            Sauvegarder
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(groupedPermissions).map(([module, permissions]) => (
                  <React.Fragment key={module}>
                    {/* Header du module */}
                    <tr className="bg-gray-100 dark:bg-gray-900">
                      <td
                        colSpan={data.roles.length + 1}
                        className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300"
                      >
                        <div className="flex items-center gap-2">
                          <Lock size={16} />
                          {module}
                        </div>
                      </td>
                    </tr>
                    {/* Permissions du module */}
                    {permissions.map(permission => (
                      <tr
                        key={permission.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {permission.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </p>
                            <code className="text-xs text-gray-400 dark:text-gray-500">
                              {permission.code}
                            </code>
                          </div>
                        </td>
                        {data.roles.map(role => {
                          const hasPermission = (editedPermissions[role] || []).includes(permission.id);
                          const isAdmin = role === 'admin';

                          return (
                            <td key={role} className="px-6 py-4 text-center">
                              <button
                                onClick={() => togglePermission(role, permission.id)}
                                disabled={isAdmin}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  hasPermission || isAdmin
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                } ${!isAdmin && 'hover:scale-110 cursor-pointer'} ${
                                  isAdmin && 'cursor-not-allowed opacity-75'
                                }`}
                                title={
                                  isAdmin
                                    ? 'Admin a toutes les permissions'
                                    : hasPermission
                                    ? 'Retirer la permission'
                                    : 'Ajouter la permission'
                                }
                              >
                                {hasPermission || isAdmin ? (
                                  <Check size={20} />
                                ) : (
                                  <X size={20} />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message d'aide */}
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Users className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Comment fonctionnent les permissions ?
              </h3>
              <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Administrateur</strong> : A accès à toutes les fonctionnalités (non modifiable)</li>
                <li>• <strong>Manager</strong> : Peut gérer les ventes, stocks et rapports</li>
                <li>• <strong>Employé</strong> : Accès limité aux opérations de base</li>
                <li>• Cliquez sur une case pour ajouter/retirer une permission</li>
                <li>• N'oubliez pas de sauvegarder après vos modifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Permissions;
