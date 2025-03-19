import { useState } from 'react';
import { OccurrenceType } from '@/components/OccurrenceTypeModal';

export function useOccurrenceType() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OccurrenceType | null>(null);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleSelect = (type: OccurrenceType) => {
    setSelectedType(type);
  };

  return {
    isOpen,
    selectedType,
    openModal,
    closeModal,
    handleSelect,
    setIsOpen,
  };
} 