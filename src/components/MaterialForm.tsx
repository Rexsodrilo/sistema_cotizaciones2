import React from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';

type MaterialFormData = {
  name: string;
  unit: string;
  cost: number;
};

export function MaterialForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaterialFormData>();

  const onSubmit = async (data: MaterialFormData) => {
    try {
      const { error } = await supabase
        .from('raw_materials')
        .insert([{
          name: data.name,
          unit: data.unit,
          cost: data.cost
        }]);

      if (error) throw error;

      reset();
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la materia prima');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre
          <input
            type="text"
            {...register('name', { required: 'El nombre es requerido' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Unidad
          <select
            {...register('unit', { required: 'La unidad es requerida' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleccione una unidad</option>
            <option value="Pulgadas">Pulgadas</option>
            <option value="Centímetros">Centímetros</option>
            <option value="Litros">Litros</option>
            <option value="Estándar">Estándar</option>
          </select>
        </label>
        {errors.unit && (
          <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Costo
          <input
            type="number"
            step="0.01"
            {...register('cost', {
              required: 'El costo es requerido',
              min: { value: 0, message: 'El costo debe ser mayor a 0' }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>
        {errors.cost && (
          <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Guardar Materia Prima
      </button>
    </form>
  );
}