import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, Image as ImageIcon, MoreVertical, Plus, Square } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Layer } from '../types';
import { uploadImage } from '../services/api';

export default function LayersPanel() {
  const { t } = useLanguage();
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    updateLayer,
    selectedLayerIds,
    setSelectedLayerIds,
    lastSelectionAnchorId,
    setSelectionAnchor,
    removeLayer,
    duplicateLayer,
    reorderLayersToOrder,
    addLayer,
    addBackgroundLayer,
  } = useProject();

  // Custom DnD state (mouse-based, smooth animations)
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragHoverIndex, setDragHoverIndex] = useState<number | null>(null);
  // Note: we don't need the initial clientY beyond computing offsets
  const [dragCurrentClientY, setDragCurrentClientY] = useState<number>(0);
  const [dragStartOffsetY, setDragStartOffsetY] = useState<number>(0);
  const [draggedItemHeight, setDraggedItemHeight] = useState<number>(0);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const itemRectsRef = useRef<Array<{ id: string; top: number; height: number }>>([]);
  
  // Refs to track current drag state in event handlers (closure problem fix)
  const dragStateRef = useRef({
    draggedLayerId: null as string | null,
    dragFromIndex: null as number | null,
    dragHoverIndex: null as number | null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const handleAddLayer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setIsUploading(true);
    
    for (const file of files) {
      try {
        const dataUrl = await uploadImage(file);
        addLayer(dataUrl, file.name.replace(/\.[^/.]+$/, ''));
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sorted for visual list
  const sortedLayers = useMemo(() => [...layers].sort((a, b) => b.zIndex - a.zIndex), [layers]);
  const currentOrder = sortedLayers.map(l => l.id);

  const startDrag = (e: React.MouseEvent, layerId: string) => {
    if (e.button !== 0) return; // left click only
    // Don't start drag on modifier-clicks used for selection
    if (e.shiftKey || e.ctrlKey || (e as any).metaKey) return;
    const target = e.target as HTMLElement;
    // Avoid starting drag from interactive controls
    if (target && target.closest('button, [role="button"], a, input, select, textarea')) {
      return;
    }
    
    e.preventDefault(); // Prevent any default behavior
    
    const container = listContainerRef.current;
    if (!container) return;

    const idx = currentOrder.findIndex(id => id === layerId);
    if (idx === -1) return;

    // Measure IMMEDIATELY before state changes
    const containerBox = container.getBoundingClientRect();
    
    // query all items and measure
    const nodes = Array.from(container.querySelectorAll('[data-layer-id]')) as HTMLElement[];
    const allRects = nodes.map((el) => ({
      id: el.dataset.layerId || '',
      top: el.getBoundingClientRect().top,
      height: el.getBoundingClientRect().height,
    }));
    
    // For hover detection, exclude the dragged item
    const rectsWithoutDragged = allRects.filter(rect => rect.id !== layerId);
    
    const thisRect = allRects.find(r => r.id === layerId);
    const offsetY = thisRect ? e.clientY - thisRect.top : 0;
    const itemHeight = thisRect ? thisRect.height : 0;

    // Set ALL state at once
    setDraggedLayerId(layerId);
    setDragFromIndex(idx);
    setDragHoverIndex(idx);
    setDragCurrentClientY(e.clientY);
    setContainerRect(containerBox);
    setDragStartOffsetY(offsetY);
    setDraggedItemHeight(itemHeight);
    itemRectsRef.current = rectsWithoutDragged;
    
    // Update refs for event handlers
    dragStateRef.current = {
      draggedLayerId: layerId,
      dragFromIndex: idx,
      dragHoverIndex: idx,
    };

    // Attach window listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp, { once: true });

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragStateRef.current.draggedLayerId) return; // Guard: eğer drag başlamamışsa çık
    
    setDragCurrentClientY(e.clientY);
    const container = listContainerRef.current;
    if (!container) return;

    // Auto-scroll: TAMAMEN DEVRE DIŞI küçük listelerde (≤4 katman)
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (sortedLayers.length > 4 && maxScroll > 0) {
      const box = container.getBoundingClientRect();
      const edge = 40; // daha büyük kenar bandı - sadece çok uçlara yaklaşınca scroll
      const step = 6; // daha yavaş scroll
      if (e.clientY <= box.top + edge && container.scrollTop > 0) {
        container.scrollTop = Math.max(0, container.scrollTop - step);
      } else if (e.clientY >= box.bottom - edge && container.scrollTop < maxScroll) {
        container.scrollTop = Math.min(maxScroll, container.scrollTop + step);
      }
    }

    // Re-measure items - sadece scroll varsa yeniden ölç
    if (sortedLayers.length > 4 && maxScroll > 0) {
      const nodes = Array.from(container.querySelectorAll('[data-layer-id]')) as HTMLElement[];
      const rects = nodes
        .map((el) => ({
          id: el.dataset.layerId || '',
          top: el.getBoundingClientRect().top,
          height: el.getBoundingClientRect().height,
        }))
        .filter(rect => rect.id !== dragStateRef.current.draggedLayerId); // Sürüklenen item'ı ÇIKAR
      itemRectsRef.current = rects;
    }

    if (!itemRectsRef.current.length) return;

    // IMPROVED: Daha kesin hover index hesaplama
    // Artık itemRectsRef sürüklenen item'ı içermiyor!
    let targetIndex = 0;
    let foundPosition = false;

    for (let i = 0; i < itemRectsRef.current.length; i++) {
      const rect = itemRectsRef.current[i];
      const rectMiddle = rect.top + rect.height / 2;
      
      if (e.clientY < rectMiddle) {
        targetIndex = i;
        foundPosition = true;
        break;
      }
    }

    // Hiçbir item'ın ortasından önce değilse, en alta yerleştir
    if (!foundPosition) {
      targetIndex = itemRectsRef.current.length;
    }
    
    if (targetIndex !== dragStateRef.current.dragHoverIndex) {
      setDragHoverIndex(targetIndex);
      dragStateRef.current.dragHoverIndex = targetIndex;
    }
  };

  const onMouseUp = () => {
    const draggedLayerId = dragStateRef.current.draggedLayerId;
    const dragFromIndex = dragStateRef.current.dragFromIndex;
    const dragHoverIndex = dragStateRef.current.dragHoverIndex;

    // Commit reorder if index changed
    if (
      draggedLayerId &&
      dragFromIndex !== null &&
      dragHoverIndex !== null &&
      dragHoverIndex !== dragFromIndex
    ) {
      const order = [...currentOrder];
      
      // CRITICAL: dragHoverIndex sürüklenen item çıkarılmış listedeki pozisyon
      // Önce sürüklenen item'ı çıkar
      const [moved] = order.splice(dragFromIndex, 1);
      // Sonra hedef pozisyona ekle (sınırları kontrol et)
      const targetIndex = Math.max(0, Math.min(dragHoverIndex, order.length));
      order.splice(targetIndex, 0, moved);
      
      reorderLayersToOrder(order);
    }

    // Cleanup
    setDraggedLayerId(null);
    setDragFromIndex(null);
    setDragHoverIndex(null);
    setDragCurrentClientY(0);
    setDragStartOffsetY(0);
    setDraggedItemHeight(0);
    setContainerRect(null);
    itemRectsRef.current = [];
    dragStateRef.current = {
      draggedLayerId: null,
      dragFromIndex: null,
      dragHoverIndex: null,
    };
    window.removeEventListener('mousemove', onMouseMove);
    document.body.style.userSelect = '';
  };

  // Compute transforms for smooth shifting
  const getItemStyle = (layerId: string, visualIndex: number): React.CSSProperties => {
    if (
      !draggedLayerId ||
      dragFromIndex === null ||
      dragHoverIndex === null ||
      !draggedItemHeight ||
      dragFromIndex === dragHoverIndex ||
      layerId === draggedLayerId // sürüklenen item'ın kendisi
    ) {
      return { transform: 'translateY(0)', transition: 'transform 150ms ease' };
    }

    const gap = 8; // matches space-y-2
    const shift = draggedItemHeight + gap;
    
    // dragHoverIndex: sürüklenen item çıkarılmış listedeki hedef pozisyon (0-based)
    // visualIndex: tam listedeki pozisyon (sürüklenen item dahil)
    // dragFromIndex: sürüklenen item'ın başlangıç pozisyonu (tam listede)
    
    if (dragFromIndex < dragHoverIndex) {
      // Aşağı sürükleme: dragFromIndex+1'den dragHoverIndex+1'e kadar olanlar yukarı
      if (visualIndex > dragFromIndex && visualIndex <= dragHoverIndex) {
        return { transform: `translateY(-${shift}px)`, transition: 'transform 150ms ease' };
      }
    } else {
      // Yukarı sürükleme: dragHoverIndex'ten dragFromIndex-1'e kadar olanlar aşağı
      if (visualIndex >= dragHoverIndex && visualIndex < dragFromIndex) {
        return { transform: `translateY(${shift}px)`, transition: 'transform 150ms ease' };
      }
    }
    
    return { transform: 'translateY(0)', transition: 'transform 150ms ease' };
  };

  const isDragging = !!draggedLayerId && dragFromIndex !== null;
  const overlayTop = useMemo(() => {
    if (!isDragging || !containerRect || !draggedItemHeight) return 0;
    // Calculate position relative to viewport
    const rawTop = dragCurrentClientY - dragStartOffsetY;
    // Clamp within container bounds
    const minTop = containerRect.top;
    const maxTop = containerRect.bottom - draggedItemHeight;
    return Math.max(minTop, Math.min(rawTop, maxTop));
  }, [isDragging, dragCurrentClientY, dragStartOffsetY, containerRect, draggedItemHeight]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#1A1A22] border-l border-gray-200 dark:border-gray-800">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddLayer}
        className="hidden"
      />

      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#A97FFF]" />
            {t('layers.title') || 'Layers'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 bg-gradient-to-r from-[#A97FFF] to-[#7C3AED] text-white text-xs font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-1.5"
              title="Add Image Layer"
            >
              <Plus className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Image'}
            </button>
            
            {/* Background Color Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
                title="Add Background Layer"
              >
                <Square className="w-4 h-4" />
                BG
              </button>
              
              {showColorPicker && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowColorPicker(false)}
                  />
                  
                  {/* Color Picker Popup */}
                  <div className="absolute right-0 top-full mt-2 p-4 bg-white dark:bg-[#1A1A22] border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl z-50 w-72">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-900 dark:text-white font-semibold">Background Color</div>
                      <button
                        onClick={() => setShowColorPicker(false)}
                        className="text-gray-500 hover:text-white hover:text-gray-900 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Color Presets */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 dark:text-gray-500 mb-2 font-medium">Solid Colors</div>
                      <div className="grid grid-cols-8 gap-2">
                        {['#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#424242', '#212121',
                          '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
                          '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40',
                          '#FF8A80', '#FF80AB', '#EA80FC', '#B388FF', '#8C9EFF', '#82B1FF', '#80D8FF', '#84FFFF'].map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              addBackgroundLayer(color);
                              setShowColorPicker(false);
                            }}
                            className="w-full aspect-square rounded-lg border-2 border-gray-600 border-gray-300 hover:scale-110 hover:border-[#A97FFF] transition-all duration-200 shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Gradient Presets */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 dark:text-gray-500 mb-2 font-medium">Gradients</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                          'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                          'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                          'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
                        ].map((gradient, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              // For now, extract first color from gradient
                              const colorMatch = gradient.match(/#[0-9a-f]{6}/i);
                              if (colorMatch) {
                                addBackgroundLayer(colorMatch[0]);
                              }
                              setShowColorPicker(false);
                            }}
                            className="w-full aspect-square rounded-lg border-2 border-gray-600 border-gray-300 hover:scale-110 hover:border-[#A97FFF] transition-all duration-200 shadow-sm"
                            style={{ background: gradient }}
                            title="Gradient"
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Custom Color Picker */}
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-500 mb-2 font-medium">Custom Color</div>
                      <input
                        type="color"
                        onChange={(e) => {
                          addBackgroundLayer(e.target.value);
                          setShowColorPicker(false);
                        }}
                        className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-600 border-gray-300"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
              {layers.length}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-500">
          {t('layers.subtitle') || 'Manage your image layers'}
        </p>
      </div>

      {/* Layers List */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 relative"
        style={{ isolation: 'isolate' }}
        onDragOver={(e) => {
          if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
          }
        }}
        onDrop={async (e) => {
          if (!e.dataTransfer) return;
          const files = Array.from(e.dataTransfer.files || []);
          if (files.length === 0) return;
          e.preventDefault();
          e.stopPropagation();
          for (const file of files) {
            // Accept only images up to 10MB
            if (!file.type.startsWith('image/')) continue;
            if (file.size > 10 * 1024 * 1024) continue;
            try {
              const dataUrl = await uploadImage(file);
              addLayer(dataUrl, file.name.replace(/\.[^/.]+$/, ''));
            } catch (error) {
              console.error('Error uploading dropped file:', error);
            }
          }
        }}
      >
        {sortedLayers.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500 text-sm">{t('layers.empty') || 'No layers yet'}</p>
            <p className="text-gray-600 text-xs mt-1">{t('layers.emptyHint') || 'Upload images to start'}</p>
          </div>
        ) : (
          sortedLayers.map((layer, idx) => {
            const beingDragged = isDragging && draggedLayerId === layer.id;
            const style = getItemStyle(layer.id, idx);
            const isSelected = selectedLayerIds.includes(layer.id);
            const orderIds = currentOrder; // top-to-bottom desc by zIndex
            const handleSelectClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              const ctrl = e.ctrlKey || (e as any).metaKey;
              const shift = e.shiftKey;
              // Ctrl/Cmd toggle
              if (ctrl) {
                const next = isSelected
                  ? selectedLayerIds.filter(id => id !== layer.id)
                  : [...selectedLayerIds, layer.id];
                setSelectedLayerIds(next);
                setActiveLayer(layer.id);
                return;
              }
              // Shift range selection (uses anchor if present)
              if (shift) {
                const anchor = lastSelectionAnchorId ?? selectedLayerIds[0] ?? layer.id;
                const a = orderIds.indexOf(anchor);
                const b = orderIds.indexOf(layer.id);
                if (a !== -1 && b !== -1) {
                  const [start, end] = a < b ? [a, b] : [b, a];
                  const range = orderIds.slice(start, end + 1);
                  setSelectedLayerIds(range);
                  setActiveLayer(layer.id);
                  setSelectionAnchor && setSelectionAnchor(anchor);
                  return;
                }
                // Fallback to single selection if indices not found
                setSelectedLayerIds([layer.id]);
                setActiveLayer(layer.id);
                setSelectionAnchor && setSelectionAnchor(layer.id);
                return;
              }
              // Normal click -> single selection and set anchor
              setSelectedLayerIds([layer.id]);
              setActiveLayer(layer.id);
              setSelectionAnchor && setSelectionAnchor(layer.id);
            };
            return (
              <div
                key={layer.id}
                data-layer-id={layer.id}
                style={{ ...style, visibility: beingDragged ? 'hidden' as const : 'visible' }}
                onMouseDown={(e) => {
                  // Don't start drag from interactive controls (buttons stopPropagation already)
                  if (layer.locked) return; // optional: prevent dragging locked layers
                  startDrag(e, layer.id);
                }}
              >
                <LayerItem
                  layer={layer}
                  isActive={layer.id === activeLayerId}
                  isSelected={isSelected}
                  onSelect={handleSelectClick}
                  onToggleVisibility={() => updateLayer(layer.id, { visible: !layer.visible })}
                  onToggleLock={() => updateLayer(layer.id, { locked: !layer.locked })}
                  onDuplicate={() => duplicateLayer(layer.id)}
                  onDelete={() => removeLayer(layer.id)}
                />
              </div>
            );
          })
        )}

        {/* Drag overlay ghost - Portal to prevent menu overflow */}
        {isDragging && draggedLayerId && containerRect && (
          <div
            className="fixed pointer-events-none"
            style={{ 
              top: overlayTop,
              left: containerRect.left + 8,
              width: containerRect.width - 16,
              zIndex: 9999
            }}
          >
            {(() => {
              const layer = sortedLayers.find(l => l.id === draggedLayerId);
              if (!layer) return null;
              return (
                <div className="opacity-90 shadow-2xl ring-2 ring-[#A97FFF] rounded-lg">
                  <LayerItem
                    layer={layer}
                    isActive={layer.id === activeLayerId}
                    isSelected={selectedLayerIds.includes(layer.id)}
                    onSelect={() => {}}
                    onToggleVisibility={() => {}}
                    onToggleLock={() => {}}
                    onDuplicate={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Footer - Layer Properties */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0C0C0F] space-y-3">
        {activeLayerId && layers.find(l => l.id === activeLayerId) ? (
          <>
            {/* Active Layer Info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t('layers.activeLayer') || 'Active Layer'}:</span>
              <span className="text-[#A97FFF] font-medium">
                {layers.find(l => l.id === activeLayerId)?.name}
              </span>
            </div>

            {/* Opacity Control */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <label>Opacity</label>
                <span className="text-[#A97FFF] font-medium">
                  {layers.find(l => l.id === activeLayerId)?.opacity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={layers.find(l => l.id === activeLayerId)?.opacity || 100}
                onChange={(e) => {
                  const layer = layers.find(l => l.id === activeLayerId);
                  if (layer && !layer.locked) {
                    updateLayer(activeLayerId, { opacity: Number(e.target.value) });
                  }
                }}
                className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #A97FFF 0%, #A97FFF ${layers.find(l => l.id === activeLayerId)?.opacity}%, #374151 ${layers.find(l => l.id === activeLayerId)?.opacity}%, #374151 100%)`
                }}
              />
            </div>

            {/* Blend Mode */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Blend Mode</label>
              <select
                value={layers.find(l => l.id === activeLayerId)?.blendMode || 'normal'}
                onChange={(e) => {
                  const layer = layers.find(l => l.id === activeLayerId);
                  if (layer && !layer.locked) {
                    updateLayer(activeLayerId, { blendMode: e.target.value as any });
                  }
                }}
                className="w-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 focus:border-[#A97FFF] focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
              </select>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{t('layers.activeLayer') || 'Active Layer'}:</span>
            <span className="text-gray-600">{t('layers.none') || 'None'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface LayerItemProps {
  layer: Layer;
  isActive: boolean;
  isSelected?: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function LayerItem({
  layer,
  isActive,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onDelete,
}: LayerItemProps) {
  const { updateLayer, liveTransforms } = useProject();
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const liveSize = isActive && liveTransforms.layerId === layer.id && liveTransforms.size
    ? liveTransforms.size
    : undefined;

  return (
    <div
      onClick={(e) => onSelect(e)}
      className={`group relative p-2 rounded-lg cursor-pointer transition-all ${
        (isSelected || isActive)
          ? 'bg-gradient-to-r from-[#A97FFF]/20 to-[#7C5DFF]/20 ring-2 ring-[#A97FFF]'
          : 'bg-white dark:bg-[#0C0C0F] hover:bg-gray-50 dark:hover:bg-[#242430]'
      } ${layer.locked ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-900 overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-700">
          {layer.type === 'background' && layer.backgroundColor ? (
            <div 
              className="w-full h-full" 
              style={{ 
                background: layer.backgroundColor,
                opacity: layer.opacity / 100 
              }}
            />
          ) : (
            <img
              src={layer.imageUrl}
              alt={layer.name}
              className="w-full h-full object-cover"
              style={{ opacity: layer.opacity / 100 }}
            />
          )}
        </div>

        {/* Layer Info */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                if (editName.trim()) {
                  updateLayer(layer.id, { name: editName.trim() });
                }
                setIsRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editName.trim()) {
                    updateLayer(layer.id, { name: editName.trim() });
                  }
                  setIsRenaming(false);
                } else if (e.key === 'Escape') {
                  setEditName(layer.name);
                  setIsRenaming(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-2 py-0.5 rounded border border-[#A97FFF] focus:outline-none"
            />
          ) : (
            <p 
              className={`text-sm font-medium truncate ${
                isActive ? 'text-[#A97FFF]' : 'text-gray-900 dark:text-white'
              }`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
              title="Double-click to rename"
            >
              {layer.name}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">
              {Math.round(liveSize?.width ?? layer.size.width)}x{Math.round(liveSize?.height ?? layer.size.height)}
            </span>
            <span className="text-xs text-gray-500">
              {layer.opacity}%
            </span>
            {layer.processingHistory.length > 0 && (
              <span className="text-xs text-[#A97FFF] font-medium">
                {layer.processingHistory.length} {layer.processingHistory.length === 1 ? 'edit' : 'edits'}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible ? (
              <Eye className="w-4 h-4 text-gray-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock();
            }}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={layer.locked ? 'Unlock layer' : 'Lock layer'}
          >
            {layer.locked ? (
              <Lock className="w-4 h-4 text-gray-400" />
            ) : (
              <Unlock className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Processing History Indicator */}
      {layer.processingHistory.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1 overflow-x-auto">
            {layer.processingHistory.slice(-3).map((step) => (
              <span
                key={step.id}
                className="text-[10px] px-2 py-0.5 bg-[#A97FFF]/20 text-[#A97FFF] rounded-full whitespace-nowrap"
                title={`${step.module} - ${new Date(step.timestamp).toLocaleString()}`}
              >
                {step.module}
              </span>
            ))}
            {layer.processingHistory.length > 3 && (
              <span className="text-[10px] text-gray-500">
                +{layer.processingHistory.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}





