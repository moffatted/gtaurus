import { useState } from 'react';
import { useToolStore, type ToolType } from '../../stores/toolStore';

export function useWizardQuickAddTool() {
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDiameter, setNewToolDiameter] = useState(3.175);
  const [newToolNumber, setNewToolNumber] = useState(1);
  const [newToolType, setNewToolType] = useState<ToolType>('endmill');

  const handleQuickAddTool = () => {
    const { addTool } = useToolStore.getState();
    addTool({
      name: newToolName || `Tool ${newToolNumber}`,
      diameter: newToolDiameter,
      number: newToolNumber,
      type: newToolType,
      fluteCount: 2,
      material: 'Carbide',
    });

    setIsAddingTool(false);
    setNewToolName('');
  };

  return {
    isAddingTool,
    setIsAddingTool,
    newToolName,
    setNewToolName,
    newToolDiameter,
    setNewToolDiameter,
    newToolNumber,
    setNewToolNumber,
    newToolType,
    setNewToolType,
    handleQuickAddTool,
  };
}
