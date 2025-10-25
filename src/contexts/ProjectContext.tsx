import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Layer, ProcessStep, Project, Canvas } from '../types';
import { logProject } from '../utils/debug';

interface ProjectContextType {
  // Project State
  project: Project;
  layers: Layer[];
  activeLayerId: string | null;
  // Multi-selection
  selectedLayerIds: string[];
  setSelectedLayerIds: (ids: string[]) => void;
  lastSelectionAnchorId?: string | null;
  setSelectionAnchor?: (id: string | null) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Layer Operations
  addLayer: (imageUrl: string, name?: string) => void;
  addLayerAt: (imageUrl: string, name: string | undefined, position: { x: number; y: number }) => void;
  addBackgroundLayer: (color: string, name?: string) => void;
  removeLayer: (layerId: string) => void;
  removeLayers: (layerIds: string[]) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  // Batch update multiple layers in a single history entry
  updateLayersBatch: (updates: Array<{ id: string; updates: Partial<Layer> }>) => void;
  // Update a layer without pushing to history (for live interactions like crop/drag previews)
  updateLayerNoHistory: (layerId: string, updates: Partial<Layer>) => void;
  setActiveLayer: (layerId: string | null) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  reorderLayersByZ: (fromIndex: number, toIndex: number) => void;
  reorderLayersToOrder: (orderIdsDesc: string[]) => void;
  duplicateLayer: (layerId: string) => string | null;
  
  // Processing History
  addProcessStep: (layerId: string, step: ProcessStep) => void;
  jumpToStep: (layerId: string, stepIndex: number) => void;
  clearLayerHistory: (layerId: string) => void;
  
  // Canvas Operations
  updateCanvas: (updates: Partial<Canvas>) => void;

  // Live UI-only transforms (no history)
  liveTransforms: { layerId: string | null; size?: { width: number; height: number }; position?: { x: number; y: number } };
  setLiveTransforms: (payload: { layerId: string; size?: { width: number; height: number }; position?: { x: number; y: number } }) => void;
  clearLiveTransforms: () => void;
  
  // Project Operations
  resetProject: () => void;
  loadProject: (project: Project) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Crop mode removed
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const createDefaultCanvas = (): Canvas => ({
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
});

const createDefaultProject = (): Project => ({
  id: `project-${Date.now()}`,
  name: 'Untitled Project',
  canvas: createDefaultCanvas(),
  layers: [],
  currentLayerId: null,
  history: [],
  historyIndex: -1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(createDefaultProject());
  const [historyStack, setHistoryStack] = useState<Project[]>([createDefaultProject()]);
  const [historyPointer, setHistoryPointer] = useState(0);
  const [liveTransforms, setLiveTransformsState] = useState<{ layerId: string | null; size?: { width: number; height: number }; position?: { x: number; y: number } }>({ layerId: null });
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [lastSelectionAnchorId, setLastSelectionAnchorId] = useState<string | null>(null);
  
  // Crop mode removed

  // Helper to save to history (pointer güncellemesiyle birlikte)
  const saveToHistory = useCallback((newProject: Project) => {
    setHistoryStack(prev => {
      // Eğer pointer ortada ise, sonrasını sil ve ekle
      let newStack = prev.slice(0, historyPointer + 1);
      newStack.push(newProject);
      
      // CRITICAL: Max 50 adım - Bellek sızıntısını önle
      const MAX_HISTORY_SIZE = 50;
      if (newStack.length > MAX_HISTORY_SIZE) {
        // En eski history'leri sil (stack'in başından)
        const overflow = newStack.length - MAX_HISTORY_SIZE;
        newStack = newStack.slice(overflow);
        // Pointer'ı da ayarla
        setHistoryPointer(MAX_HISTORY_SIZE - 1);
        return newStack;
      }
      
      setHistoryPointer(newStack.length - 1);
      return newStack;
    });
  }, [historyPointer]);

  // Add Layer
  const addLayer = useCallback((imageUrl: string, name?: string) => {
    // First, measure the actual image dimensions
    const img = new Image();
    img.onload = () => {
      setProject(prev => {
        // Determine a cascaded initial position so multiple uploads don't overlap
        const imageLayers = prev.layers.filter(l => l.type === 'image');
        const idx = imageLayers.length; // number of existing image layers
        const cascadeStep = 40;
        const maxOffset = 8 * cascadeStep; // cap the cascade
        const offset = Math.min(idx * cascadeStep, maxOffset);

        // Use actual image dimensions
        const actualWidth = img.naturalWidth;
        const actualHeight = img.naturalHeight;
        const area = actualWidth * actualHeight;
        
        // Calculate z-index: larger images (bigger area) get lower z-index (behind)
        // Count how many existing layers have LARGER area than this one
        const largerLayersCount = prev.layers.filter(l => {
          const layerArea = l.size.width * l.size.height;
          return layerArea > area;
        }).length;
        
        // z-index: if there are 0 larger layers, this gets z-index 0 (back)
        // if there are N larger layers, this gets z-index N (in front of them)
        const newZIndex = largerLayersCount;
        
        // Shift z-index of layers that are smaller or equal (they should be in front)
        const updatedLayers = prev.layers.map(l => {
          const layerArea = l.size.width * l.size.height;
          if (layerArea <= area) {
            // This layer is smaller or equal, move it forward
            return { ...l, zIndex: l.zIndex + 1 };
          }
          return l;
        });
        
        // Try to center roughly, fallback to small offset from top-left
        const canvasW = prev.canvas.width;
        const canvasH = prev.canvas.height;
        const baseX = Math.max(20, Math.floor((canvasW - actualWidth) / 2));
        const baseY = Math.max(20, Math.floor((canvasH - actualHeight) / 2));

        const newLayer: Layer = {
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: name || `Layer ${prev.layers.length + 1}`,
          type: 'image',
          imageUrl,
          originalImage: imageUrl,
          position: { x: baseX + offset, y: baseY + offset },
          size: { width: actualWidth, height: actualHeight }, // Actual image size
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          blendMode: 'normal',
          processingHistory: [],
          zIndex: newZIndex,
          createdAt: Date.now(),
        };

        const newProject = {
          ...prev,
          layers: [...updatedLayers, newLayer],
          currentLayerId: newLayer.id,
          updatedAt: Date.now(),
        };

        // Save to history using the computed project to ensure consistency
        saveToHistory(newProject);
        return newProject;
      });
    };
    
    img.onerror = () => {
      // Fallback to default dimensions if image fails to load
      setProject(prev => {
        const imageLayers = prev.layers.filter(l => l.type === 'image');
        const idx = imageLayers.length;
        const cascadeStep = 40;
        const maxOffset = 8 * cascadeStep;
        const offset = Math.min(idx * cascadeStep, maxOffset);

        const defaultWidth = 800;
        const defaultHeight = 600;
        const area = defaultWidth * defaultHeight;
        
        // Calculate z-index based on area (same logic as success case)
        const largerLayersCount = prev.layers.filter(l => {
          const layerArea = l.size.width * l.size.height;
          return layerArea > area;
        }).length;
        
        const newZIndex = largerLayersCount;
        
        // Shift z-index of smaller or equal layers
        const updatedLayers = prev.layers.map(l => {
          const layerArea = l.size.width * l.size.height;
          if (layerArea <= area) {
            return { ...l, zIndex: l.zIndex + 1 };
          }
          return l;
        });
        
        const canvasW = prev.canvas.width;
        const canvasH = prev.canvas.height;
        const baseX = Math.max(20, Math.floor((canvasW - defaultWidth) / 2));
        const baseY = Math.max(20, Math.floor((canvasH - defaultHeight) / 2));

        const newLayer: Layer = {
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: name || `Layer ${prev.layers.length + 1}`,
          type: 'image',
          imageUrl,
          originalImage: imageUrl,
          position: { x: baseX + offset, y: baseY + offset },
          size: { width: defaultWidth, height: defaultHeight },
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          blendMode: 'normal',
          processingHistory: [],
          zIndex: newZIndex,
          createdAt: Date.now(),
        };

        const newProject = {
          ...prev,
          layers: [...updatedLayers, newLayer],
          currentLayerId: newLayer.id,
          updatedAt: Date.now(),
        };

        saveToHistory(newProject);
        return newProject;
      });
    };
    
    img.src = imageUrl;
  }, [saveToHistory]);

  // Add Layer at specific position
  const addLayerAt = useCallback((imageUrl: string, name: string | undefined, position: { x: number; y: number }) => {
    const img = new Image();
    img.onload = () => {
      setProject(prev => {
        const area = (img.naturalWidth || img.width) * (img.naturalHeight || img.height);
        const largerLayersCount = prev.layers.filter(l => (l.size.width * l.size.height) > area).length;
        const newZIndex = largerLayersCount;
        const updatedLayers = prev.layers.map(l => {
          const layerArea = l.size.width * l.size.height;
          if (layerArea <= area) {
            return { ...l, zIndex: l.zIndex + 1 };
          }
          return l;
        });
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const newLayer: Layer = {
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: name || `Layer ${prev.layers.length + 1}`,
          type: 'image',
          imageUrl,
          originalImage: imageUrl,
          position: { x: Math.round(position.x), y: Math.round(position.y) },
          size: { width: w, height: h },
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          blendMode: 'normal',
          processingHistory: [],
          zIndex: newZIndex,
          createdAt: Date.now(),
        };
        const newProject = { ...prev, layers: [...updatedLayers, newLayer], currentLayerId: newLayer.id, updatedAt: Date.now() };
        saveToHistory(newProject);
        return newProject;
      });
    };
    img.onerror = () => {
      // Fallback with default size if image fails to load
      setProject(prev => {
        const defaultWidth = 512, defaultHeight = 512;
        const area = defaultWidth * defaultHeight;
        const largerLayersCount = prev.layers.filter(l => (l.size.width * l.size.height) > area).length;
        const newZIndex = largerLayersCount;
        const updatedLayers = prev.layers.map(l => {
          const layerArea = l.size.width * l.size.height;
          if (layerArea <= area) return { ...l, zIndex: l.zIndex + 1 };
          return l;
        });
        const newLayer: Layer = {
          id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: name || `Layer ${prev.layers.length + 1}`,
          type: 'image',
          imageUrl,
          originalImage: imageUrl,
          position: { x: Math.round(position.x), y: Math.round(position.y) },
          size: { width: defaultWidth, height: defaultHeight },
          rotation: 0,
          opacity: 100,
          visible: true,
          locked: false,
          blendMode: 'normal',
          processingHistory: [],
          zIndex: newZIndex,
          createdAt: Date.now(),
        };
        const newProject = { ...prev, layers: [...updatedLayers, newLayer], currentLayerId: newLayer.id, updatedAt: Date.now() };
        saveToHistory(newProject);
        return newProject;
      });
    };
    img.src = imageUrl;
  }, [saveToHistory]);

  // Add Background Layer
  const addBackgroundLayer = useCallback((color: string, name?: string) => {
    // Find minimum zIndex among background layers, or use -1 for first background
    const backgroundLayers = project.layers.filter(l => l.type === 'background');
    const minZIndex = backgroundLayers.length > 0 
      ? Math.min(...backgroundLayers.map(l => l.zIndex)) - 1
      : -1;

    const newLayer: Layer = {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Background ${backgroundLayers.length + 1}`,
      type: 'background',
      imageUrl: '', // No image for background layer
      originalImage: '',
      backgroundColor: color,
      position: { x: 0, y: 0 },
      size: { width: project.canvas.width, height: project.canvas.height },
      rotation: 0,
      opacity: 100,
      visible: true,
      locked: false,
      blendMode: 'normal',
      processingHistory: [],
      zIndex: minZIndex, // Always add new backgrounds below existing ones
      createdAt: Date.now(),
    };

    const newProject = {
      ...project,
      layers: [...project.layers, newLayer],
      currentLayerId: newLayer.id,
      updatedAt: Date.now(),
    };

    setProject(newProject);
    saveToHistory(newProject);
  }, [project, saveToHistory]);

  // Remove Layer
  const removeLayer = useCallback((layerId: string) => {
    const newLayers = project.layers.filter(l => l.id !== layerId);
    const newProject = {
      ...project,
      layers: newLayers,
      currentLayerId: project.currentLayerId === layerId 
        ? (newLayers[0]?.id || null)
        : project.currentLayerId,
      updatedAt: Date.now(),
    };

    setProject(newProject);
    saveToHistory(newProject);
  }, [project, saveToHistory]);

  // Remove multiple layers at once
  const removeLayers = useCallback((layerIds: string[]) => {
    const idsSet = new Set(layerIds);
    const newLayers = project.layers.filter(l => !idsSet.has(l.id));
    const newProject = {
      ...project,
      layers: newLayers,
      currentLayerId: idsSet.has(project.currentLayerId || '') 
        ? (newLayers[0]?.id || null)
        : project.currentLayerId,
      updatedAt: Date.now(),
    };

    setProject(newProject);
    saveToHistory(newProject);
  }, [project, saveToHistory]);

  // Update Layer
  const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    logProject.groupCollapsed('✏️ updateLayer');
    logProject.info('layerId', layerId, 'updates', updates);
    // Use functional updater to avoid stale project closures during rapid successive updates
    setProject(prev => {
      const newLayers = prev.layers.map(layer => (layer.id === layerId ? { ...layer, ...updates } : layer));
      const newProject = { ...prev, layers: newLayers, updatedAt: Date.now() };
      // Save to history after state reflects the new project snapshot
      setTimeout(() => {
        setProject(p => {
          // Ensure we push the exact object we computed for consistency in history
          saveToHistory(newProject);
          return p;
        });
      }, 0);
      logProject.groupEnd();
      return newProject;
    });
  }, [saveToHistory]);

  // Batch update multiple layers in one history entry
  const updateLayersBatch = useCallback((updates: Array<{ id: string; updates: Partial<Layer> }>) => {
    if (!updates || updates.length === 0) {
      console.warn('updateLayersBatch called with empty updates');
      return;
    }
    logProject.groupCollapsed('📦 updateLayersBatch');
    logProject.info('count', updates.length);
    setProject(prev => {
      const updateMap = new Map<string, Partial<Layer>>();
      updates.forEach(u => updateMap.set(u.id, { ...(updateMap.get(u.id) || {}), ...u.updates }));
      const newLayers = prev.layers.map(layer => (updateMap.has(layer.id) ? { ...layer, ...updateMap.get(layer.id)! } : layer));
      const newProject = { ...prev, layers: newLayers, updatedAt: Date.now() };
      // Single history entry for the whole batch
      setTimeout(() => {
        setProject(p => {
          saveToHistory(newProject);
          return p;
        });
      }, 0);
      logProject.groupEnd();
      return newProject;
    });
  }, [saveToHistory]);

  // Set Active Layer
  const setActiveLayer = useCallback((layerId: string | null) => {
    logProject.log('🎯 setActiveLayer', { layerId });
    setProject(prev => ({
      ...prev,
      currentLayerId: layerId,
    }));
  }, []);

  // Multi-selection helpers
  const addToSelection = useCallback((id: string) => {
    logProject.log('➕ addToSelection', { id });
    setSelectedLayerIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setActiveLayer(id);
    // If no anchor yet, set the first picked as anchor
    setLastSelectionAnchorId(prev => {
      const newAnchor = prev ?? id;
      return newAnchor;
    });
  }, [setActiveLayer, selectedLayerIds]);

  const removeFromSelection = useCallback((id: string) => {
    logProject.log('➖ removeFromSelection', { id });
    setSelectedLayerIds(prev => prev.filter(x => x !== id));
  }, []);

  const clearSelection = useCallback(() => {
    logProject.log('🧹 clearSelection');
    setSelectedLayerIds([]);
    setActiveLayer(null);
    setLastSelectionAnchorId(null);
  }, [setActiveLayer]);

  const selectAll = useCallback(() => {
    logProject.log('✅ selectAll');
    setSelectedLayerIds(project.layers.map(l => l.id));
    if (project.layers.length > 0) {
      const lastId = project.layers[project.layers.length - 1].id;
      setActiveLayer(lastId);
      setLastSelectionAnchorId(lastId);
    }
  }, [project.layers, setActiveLayer]);

  // Reorder Layers
  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    const newLayers = [...project.layers];
    const [removed] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, removed);

    // Update zIndex
    const reindexedLayers = newLayers.map((layer, index) => ({
      ...layer,
      zIndex: index,
    }));

    const newProject = {
      ...project,
      layers: reindexedLayers,
      updatedAt: Date.now(),
    };

    setProject(newProject);
    saveToHistory(newProject);
  }, [project, saveToHistory]);

  // Reorder by visual Z order (descending zIndex in UI)
  const reorderLayersByZ = useCallback((fromIndex: number, toIndex: number) => {
    // 1) Build descending z order array (UI order top->bottom)
    const desc = [...project.layers].sort((a, b) => b.zIndex - a.zIndex);
    const [moved] = desc.splice(fromIndex, 1);
    desc.splice(toIndex, 0, moved);

    // 2) Assign new zIndex so desc[0] has highest z (n-1), desc[n-1] has lowest (0)
    const n = desc.length;
    const zMap = new Map<string, number>();
    desc.forEach((l, i) => {
      zMap.set(l.id, n - 1 - i);
    });

    const reindexedLayers = project.layers.map(l => ({ ...l, zIndex: zMap.get(l.id) ?? l.zIndex }));
    const newProject = { ...project, layers: reindexedLayers, updatedAt: Date.now() };
    setProject(newProject);
    saveToHistory(newProject);
  }, [project, saveToHistory]);

  // Reorder to exact visual order (desc by zIndex) provided by the panel
  const reorderLayersToOrder = useCallback((orderIdsDesc: string[]) => {
    const n = orderIdsDesc.length;
    const zMap = new Map<string, number>();
    orderIdsDesc.forEach((id, i) => {
      zMap.set(id, n - 1 - i);
    });
    const reindexedLayers = project.layers.map(l => ({ ...l, zIndex: zMap.get(l.id) ?? l.zIndex }));
    const newProject = { ...project, layers: reindexedLayers, updatedAt: Date.now() };
    setProject(newProject);
    saveToHistory(newProject);
  }, [project, saveToHistory]);

  // Duplicate Layer
  const duplicateLayer = useCallback((layerId: string): string | null => {
    const layerToDuplicate = project.layers.find(l => l.id === layerId);
    if (!layerToDuplicate) return null;

    const newLayer: Layer = {
      ...layerToDuplicate,
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${layerToDuplicate.name} Copy`,
      position: {
        x: layerToDuplicate.position.x + 20,
        y: layerToDuplicate.position.y + 20,
      },
      zIndex: project.layers.length,
      createdAt: Date.now(),
    };

    const newProject = {
      ...project,
      layers: [...project.layers, newLayer],
      currentLayerId: newLayer.id,
      updatedAt: Date.now(),
    };

    setProject(newProject);
    saveToHistory(newProject);
    return newLayer.id;
  }, [project, saveToHistory]);

  // Add Process Step to Layer
  const addProcessStep = useCallback((layerId: string, step: ProcessStep) => {
    // Load output image to get its actual dimensions, then update layer accordingly
    const img = new Image();
    img.onload = () => {
      const newW = img.naturalWidth;
      const newH = img.naturalHeight;

      setProject(prev => {
        const newLayers = prev.layers.map(layer => {
          if (layer.id !== layerId) return layer;

          // Keep the layer center fixed while updating size to the new image dimensions
          const oldCenterX = layer.position.x + layer.size.width / 2;
          const oldCenterY = layer.position.y + layer.size.height / 2;
          const newPos = {
            x: Math.round(oldCenterX - newW / 2),
            y: Math.round(oldCenterY - newH / 2),
          };

          return {
            ...layer,
            imageUrl: step.outputImage,
            processingHistory: [...layer.processingHistory, step],
            size: { width: newW, height: newH },
            position: newPos,
            // Reset any crop baselines/state since the underlying bitmap changed
            cropRect: undefined,
            lastCropMeta: undefined,
            firstCropBaseline: undefined,
            baseCropRectLayer: undefined,
          };
        });

        const newProject = { ...prev, layers: newLayers, updatedAt: Date.now() };
        // Save to history after state update
        setTimeout(() => {
          setProject(p => { saveToHistory(p); return p; });
        }, 0);
        return newProject;
      });
    };
    img.onerror = () => {
      // If image fails to load, still record the step and update URL, but reset crop state
      setProject(prev => {
        const newLayers = prev.layers.map(layer => {
          if (layer.id !== layerId) return layer;
          return {
            ...layer,
            imageUrl: step.outputImage,
            processingHistory: [...layer.processingHistory, step],
            cropRect: undefined,
            lastCropMeta: undefined,
            firstCropBaseline: undefined,
            baseCropRectLayer: undefined,
          };
        });
        const newProject = { ...prev, layers: newLayers, updatedAt: Date.now() };
        setTimeout(() => {
          setProject(p => { saveToHistory(p); return p; });
        }, 0);
        return newProject;
      });
    };
    img.src = step.outputImage;
  }, [saveToHistory]);

  // Jump to specific step in history
  const jumpToStep = useCallback((layerId: string, stepIndex: number) => {
    const layer = project.layers.find(l => l.id === layerId);
    if (!layer || stepIndex >= layer.processingHistory.length) return;

    const targetStep = layer.processingHistory[stepIndex];

    // Load the target step image to sync dimensions and reset crop state
    const img = new Image();
    img.onload = () => {
      const newW = img.naturalWidth;
      const newH = img.naturalHeight;
      setProject(prev => {
        const newLayers = prev.layers.map(l => {
          if (l.id !== layerId) return l;
          const oldCenterX = l.position.x + l.size.width / 2;
          const oldCenterY = l.position.y + l.size.height / 2;
          const newPos = { x: Math.round(oldCenterX - newW / 2), y: Math.round(oldCenterY - newH / 2) };
          return {
            ...l,
            imageUrl: targetStep.outputImage,
            processingHistory: l.processingHistory.slice(0, stepIndex + 1),
            size: { width: newW, height: newH },
            position: newPos,
            cropRect: undefined,
            lastCropMeta: undefined,
            firstCropBaseline: undefined,
            baseCropRectLayer: undefined,
          };
        });
        const newProject = { ...prev, layers: newLayers, updatedAt: Date.now() };
        setTimeout(() => { setProject(p => { saveToHistory(p); return p; }); }, 0);
        return newProject;
      });
    };
    img.onerror = () => {
      setProject(prev => {
        const newLayers = prev.layers.map(l => {
          if (l.id !== layerId) return l;
          return {
            ...l,
            imageUrl: targetStep.outputImage,
            processingHistory: l.processingHistory.slice(0, stepIndex + 1),
            cropRect: undefined,
            lastCropMeta: undefined,
            firstCropBaseline: undefined,
            baseCropRectLayer: undefined,
          };
        });
        const newProject = { ...prev, layers: newLayers, updatedAt: Date.now() };
        setTimeout(() => { setProject(p => { saveToHistory(p); return p; }); }, 0);
        return newProject;
      });
    };
    img.src = targetStep.outputImage;
  }, [project, saveToHistory]);

  // Clear Layer History
  const clearLayerHistory = useCallback((layerId: string) => {
    const layer = project.layers.find(l => l.id === layerId);
    if (!layer) return;

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setProject(prev => {
        const newLayers = prev.layers.map(l => {
          if (l.id !== layerId) return l;
          const oldCenterX = l.position.x + l.size.width / 2;
          const oldCenterY = l.position.y + l.size.height / 2;
          const newPos = { x: Math.round(oldCenterX - w / 2), y: Math.round(oldCenterY - h / 2) };
          return {
            ...l,
            processingHistory: [],
            imageUrl: l.originalImage,
            size: { width: w, height: h },
            position: newPos,
            cropRect: undefined,
            lastCropMeta: undefined,
            firstCropBaseline: undefined,
            baseCropRectLayer: undefined,
          };
        });
        const newProject = { ...prev, layers: newLayers, updatedAt: Date.now() };
        setTimeout(() => { setProject(p => { saveToHistory(p); return p; }); }, 0);
        return newProject;
      });
    };
    img.onerror = () => {
      setProject(prev => {
        const newLayers = prev.layers.map(l => (l.id === layerId ? {
          ...l,
          processingHistory: [],
          imageUrl: l.originalImage,
          cropRect: undefined,
          lastCropMeta: undefined,
          firstCropBaseline: undefined,
          baseCropRectLayer: undefined,
        } : l));
        const newProject = { ...prev, layers: newLayers, updatedAt: Date.now() };
        setTimeout(() => { setProject(p => { saveToHistory(p); return p; }); }, 0);
        return newProject;
      });
    };
    img.src = layer.originalImage;
  }, [project, saveToHistory]);

  // Update Canvas
  const updateCanvas = useCallback((updates: Partial<Canvas>) => {
    const newProject = {
      ...project,
      canvas: { ...project.canvas, ...updates },
      updatedAt: Date.now(),
    };

    setProject(newProject);
    saveToHistory(newProject);
  }, [project, saveToHistory]);

  // Live transforms setters
  const setLiveTransforms = useCallback((payload: { layerId: string; size?: { width: number; height: number }; position?: { x: number; y: number } }) => {
    setLiveTransformsState({ ...payload });
  }, []);

  const clearLiveTransforms = useCallback(() => {
    setLiveTransformsState({ layerId: null });
  }, []);

  // Update Layer without saving to history (for live interactions like crop resize)
  const updateLayerNoHistory = useCallback((layerId: string, updates: Partial<Layer>) => {
    logProject.info('⚡ updateLayerNoHistory', { layerId, updates });
    setProject(prev => {
      const newLayers = prev.layers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      );
      return { ...prev, layers: newLayers, updatedAt: Date.now() };
    });
  }, []);

  // Reset Project
  const resetProject = useCallback(() => {
    const newProject = createDefaultProject();
    setProject(newProject);
    setHistoryStack([newProject]);
    setHistoryPointer(0);
  }, []);

  // Load Project
  const loadProject = useCallback((loadedProject: Project) => {
    setProject(loadedProject);
    setHistoryStack([loadedProject]);
    setHistoryPointer(0);
  }, []);

  // Undo
  const undo = useCallback(() => {
    logProject.groupCollapsed('↩️ undo');
    try {
      if (historyPointer > 0 && historyStack[historyPointer - 1]) {
        const newPointer = historyPointer - 1;
        const prevState = historyStack[newPointer];
        if (prevState && prevState.layers && Array.isArray(prevState.layers)) {
          setHistoryPointer(newPointer);
          setProject(prevState);
          // Undo sonrası geçici UI state'lerini sıfırla
          setSelectedLayerIds([]);
          setLastSelectionAnchorId(null);
          logProject.info('Undo OK', { newPointer });
        } else {
          console.error('Invalid history state at pointer:', newPointer);
        }
      }
    } catch (error) {
      console.error('Undo error:', error);
      setHistoryPointer(historyStack.length - 1);
      setProject(historyStack[historyStack.length - 1]);
      setSelectedLayerIds([]);
      setLastSelectionAnchorId(null);
    }
    logProject.groupEnd();
  }, [historyPointer, historyStack]);

  // Redo
  const redo = useCallback(() => {
    logProject.groupCollapsed('↪️ redo');
    try {
      if (historyPointer < historyStack.length - 1 && historyStack[historyPointer + 1]) {
        const newPointer = historyPointer + 1;
        const nextState = historyStack[newPointer];
        if (nextState && nextState.layers && Array.isArray(nextState.layers)) {
          setHistoryPointer(newPointer);
          setProject(nextState);
          // Redo sonrası geçici UI state'lerini sıfırla
          setSelectedLayerIds([]);
          setLastSelectionAnchorId(null);
          logProject.info('Redo OK', { newPointer });
        } else {
          console.error('Invalid history state at pointer:', newPointer);
        }
      }
    } catch (error) {
      console.error('Redo error:', error);
      setHistoryPointer(historyStack.length - 1);
      setProject(historyStack[historyStack.length - 1]);
      setSelectedLayerIds([]);
      setLastSelectionAnchorId(null);
    }
    logProject.groupEnd();
  }, [historyPointer, historyStack]);

  // Crop mode removed

  const value: ProjectContextType = {
    project,
    layers: project.layers,
    activeLayerId: project.currentLayerId,
    selectedLayerIds,
    setSelectedLayerIds,
  lastSelectionAnchorId,
  setSelectionAnchor: setLastSelectionAnchorId,
    addToSelection,
    removeFromSelection,
    clearSelection,
    selectAll,
    addLayer,
  addLayerAt,
    addBackgroundLayer,
    removeLayer,
    removeLayers,
    updateLayer,
  updateLayersBatch,
    updateLayerNoHistory,
    setActiveLayer,
    reorderLayers,
    reorderLayersByZ,
    reorderLayersToOrder,
    duplicateLayer,
    addProcessStep,
    jumpToStep,
    clearLayerHistory,
    updateCanvas,
    liveTransforms,
    setLiveTransforms,
    clearLiveTransforms,
    resetProject,
    loadProject,
    undo,
    redo,
    canUndo: historyPointer > 0,
    canRedo: historyPointer < historyStack.length - 1,
    // Crop mode removed
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
