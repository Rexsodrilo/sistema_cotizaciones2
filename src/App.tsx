import React, { useState, useEffect } from 'react';
import { pb } from './lib/pocketbase';
import { Layers, FileText, LogOut, Plus, Users } from 'lucide-react';
import { MaterialForm } from './components/MaterialForm';
import { QuotationForm } from './components/QuotationForm';
import { LoginForm } from './components/auth/LoginForm';
import { UserManagement } from './components/auth/UserManagement';
import { useAuth } from './components/hooks/useAuth';
import { ensureAdminUser } from './lib/createAdminUser';
import type { RawMaterial, Quotation } from './lib/pocketbase';

function App() {
  const { user, loading, isAdmin } = useAuth();
  const [view, setView] = useState<'materials' | 'quotations' | 'users'>('quotations');
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Asegurar que el usuario admin existe al cargar la aplicación
    ensureAdminUser();
    
    if (user) {
      loadData();
    }
  }, [user, view]);

  const loadData = async () => {
    try {
      if (view === 'materials') {
        const records = await pb.collection('raw_materials').getFullList({
          sort: 'name',
          filter: `user = "${pb.authStore.model?.id}"`
        });
        setMaterials(records);
      } else if (view === 'quotations') {
        const records = await pb.collection('quotations').getFullList({
          sort: '-created',
          filter: `user = "${pb.authStore.model?.id}"`
        });
        setQuotations(records);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Sistema de Cotizaciones</h1>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                onClick={() => {
                  setView('materials');
                  setShowForm(false);
                }}
                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                  view === 'materials'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Layers className="mr-2 h-5 w-5" />
                Materias Primas
              </button>
              <button
                onClick={() => {
                  setView('quotations');
                  setShowForm(false);
                }}
                className={`ml-8 inline-flex items-center px-4 py-2 border-b-2 ${
                  view === 'quotations'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="mr-2 h-5 w-5" />
                Cotizaciones
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setView('users');
                    setShowForm(false);
                  }}
                  className={`ml-8 inline-flex items-center px-4 py-2 border-b-2 ${
                    view === 'users'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Usuarios
                </button>
              )}
            </div>
            <div className="flex items-center">
              {view !== 'users' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mr-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {view === 'materials' ? 'Nueva Materia Prima' : 'Nueva Cotización'}
                </button>
              )}
              <button
                onClick={() => pb.authStore.clear()}
                className="inline-flex items-center px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {view === 'users' ? (
          <UserManagement />
        ) : showForm ? (
          view === 'materials' ? (
            <MaterialForm onSuccess={() => {
              setShowForm(false);
              loadData();
            }} />
          ) : (
            <QuotationForm onSuccess={() => {
              setShowForm(false);
              loadData();
            }} />
          )
        ) : view === 'materials' ? (
          <div>
            <h2 className="text-lg font-semibold">Lista de Materias Primas</h2>
            {materials.length > 0 ? (
              <ul>
                {materials.map((material) => (
                  <li key={material.id}>{material.name}</li>
                ))}
              </ul>
            ) : (
              <p>No hay materiales registrados.</p>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold">Lista de Cotizaciones</h2>
            {quotations.length > 0 ? (
              <ul>
                {quotations.map((quotation) => (
                  <li key={quotation.id}>
                    {quotation.product_name} - ${quotation.total_cost}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay cotizaciones registradas.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;