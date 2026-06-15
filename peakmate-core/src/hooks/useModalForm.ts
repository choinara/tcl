import { useState, useCallback } from 'react';
import type React from 'react';

interface UseModalFormReturn<TEntity, TForm> {
  modalOpen: boolean;
  selected: TEntity | null;
  form: TForm;
  setForm: React.Dispatch<React.SetStateAction<TForm>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  refetchTrigger: number;
  openCreate: () => void;
  openEdit: (entity: TEntity, formData: TForm) => void;
  close: () => void;
  triggerRefetch: () => void;
  fieldHandler: (field: keyof TForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function useModalForm<TEntity, TForm>(emptyForm: TForm): UseModalFormReturn<TEntity, TForm> {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<TEntity | null>(null);
  const [form, setForm] = useState<TForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const openCreate = useCallback(() => {
    setSelected(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }, [emptyForm]);

  const openEdit = useCallback((entity: TEntity, formData: TForm) => {
    setSelected(entity);
    setForm(formData);
    setErrors({});
    setModalOpen(true);
  }, []);

  const close = useCallback(() => {
    setModalOpen(false);
    setSelected(null);
    setForm(emptyForm);
    setErrors({});
  }, [emptyForm]);

  const triggerRefetch = useCallback(() => {
    setRefetchTrigger(n => n + 1);
  }, []);

  const fieldHandler = useCallback(
    (field: keyof TForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field as string]: '' }));
      },
    [],
  );

  return { modalOpen, selected, form, setForm, saving, setSaving, errors, setErrors, refetchTrigger, openCreate, openEdit, close, triggerRefetch, fieldHandler };
}
