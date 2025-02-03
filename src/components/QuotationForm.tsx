import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';

type RawMaterial = {
  id: string;
  name: string;
  unit: string;
  cost: number;
};

type QuotationFormData = {
  product_name: string;
  product_type: string;
  validity_days: number;
  margin_percentage: number;
};

export function QuotationForm({ onSuccess }: { onSuccess: () => void }) {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<{
    id: string;
    percentage: number;
  }[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<QuotationFormData>();

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    const { data } = await supabase
      .from('raw_materials')
      .select('*')
      .order('name');
    setMaterials(data || []);
  }

  const addMaterial = () => {
    setSelectedMaterials([...selectedMaterials, { id: '', percentage: 0 }]);
  };

  const updateMaterial = (index: number, field: 'id' | 'percentage', value: string | number) => {
    const newMaterials = [...selectedMaterials];
    newMaterials[index] = {
      ...newMaterials[index],
      [field]: value
    };
    setSelectedMaterials(newMaterials);
  };

  const calculateTotalCost = () => {
    return selectedMaterials.reduce((total, selected) => {
      const material = materials.find(m => m.id === selected.id);
      if (material) {
        return total + (material.cost * selected.percentage / 100);
      }
      return total;
    }, 0);
  };

  const generatePDF = (quotationData: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Cotización', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Número: ${quotationData.quote_number}`, 20, 40);
    doc.text(`Producto: ${quotationData.product_name}`, 20, 50);
    doc.text(`Tipo: ${quotationData.product_type}`, 20, 60);
    doc.text(`Costo Total: $${quotationData.total_cost.toFixed(2)}`, 20, 70);
    doc.text(`Precio de Venta: $${quotationData.sale_price.toFixed(2)}`, 20, 80);
    doc.text(`Margen: ${quotationData.margin_percentage}%`, 20, 90);
    
    doc.save(`cotizacion-${quotationData.quote_number}.pdf`);
  };

  const onSubmit = async (data: QuotationFormData) => {
    try {
      const totalPercentage = selectedMaterials.reduce((sum, m) => sum + m.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('La suma de los porcentajes debe ser 100%');
      }

      const totalCost = calculateTotalCost();
      const marginMultiplier = 1 / (1 - data.margin_percentage / 100);
      const salePrice = totalCost * marginMultiplier;

      const quoteNumber = `COT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: quotation, error } = await supabase
        .from('quotations')
        .insert([{
          quote_number: quoteNumber,
          product_name: data.product_name,
          product_type: data.product_type,
          validity_days: data.validity_days,
          total_cost: totalCost,
          sale_price: salePrice,
          profit_margin: salePrice - totalCost,
          margin_percentage: data.margin_percentage
        }])
        .select()
        .single();

      if (error) throw error;

      // Insert quotation materials
      const materialsToInsert = selectedMaterials.map(selected => ({
        quotation_id: quotation.id,
        raw_material_id: selected.id,
        percentage: selected.percentage,
        cost: materials.find(m => m.id === selected.id)?.cost || 0
      }));

      const { error: materialsError } = await supabase
        .from('quotation_materials')
        .insert(materialsToInsert);

      if (materialsError) throw materialsError;

      generatePDF(quotation);
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar la cotización');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre del Producto
          <input
            type="text"
            {...register('product_name', { required: 'El nombre es requerido' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>
        {errors.product_name && (
          <p className="mt-1 text-sm text-red-600">{errors.product_name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo de Producto
          <select
            {...register('product_type', { required: 'El tipo es requerido' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleccione un tipo</option>
            <option value="Tipo A">Tipo A</option>
            <option value="Tipo B">Tipo B</option>
            <option value="Tipo C">Tipo C</option>
          </select>
        </label>
        {errors.product_type && (
          <p className="mt-1 text-sm text-red-600">{errors.product_type.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Días de Validez
          <input
            type="number"
            {...register('validity_days', {
              required: 'Los días de validez son requeridos',
              min: { value: 1, message: 'Debe ser al menos 1 día' }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>
        {errors.validity_days && (
          <p className="mt-1 text-sm text-red-600">{errors.validity_days.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Margen de Ganancia (%)
          <input
            type="number"
            step="0.1"
            {...register('margin_percentage', {
              required: 'El margen es requerido',
              min: { value: 0, message: 'El margen debe ser positivo' },
              max: { value: 100, message: 'El margen no puede ser mayor a 100%' }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </label>
        {errors.margin_percentage && (
          <p className="mt-1 text-sm text-red-600">{errors.margin_percentage.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Materias Primas</h3>
          <button
            type="button"
            onClick={addMaterial}
            className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
          >
            Agregar Material
          </button>
        </div>

        {selectedMaterials.map((selected, index) => (
          <div key={index} className="flex gap-4">
            <select
              value={selected.id}
              onChange={(e) => updateMaterial(index, 'id', e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleccione un material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.unit}) - ${material.cost}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.1"
              value={selected.percentage}
              onChange={(e) => updateMaterial(index, 'percentage', parseFloat(e.target.value))}
              className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Porcentaje"
            />
          </div>
        ))}

        <div className="text-right text-sm text-gray-600">
          Suma de porcentajes: {selectedMaterials.reduce((sum, m) => sum + m.percentage, 0)}%
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Crear Cotización
      </button>
    </form>
  );
}