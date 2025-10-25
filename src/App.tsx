import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import { useLanguage } from './contexts/LanguageContext';
import { useProject } from './contexts/ProjectContext';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';
import { Module, ProcessStep } from './types';
import { processImage, uploadImage } from './services/api';

export type Tool = 'select' | 'move' | 'crop' | 'rotate' | 'rectangle' | 'circle' | 'triangle' | 'line' | 'gradient' | 'bucket' | 'brush' | 'eraser' | 'text' | 'lasso' | 'rect-select' | 'ellipse-select' | 'magic-wand' | 'eyedropper' | 'upscale' | 'enhance';
import { supabase, getCurrentUser, getUserProfile, Profile, deductCredits, saveProcessingHistory, initializeSupabaseWarmup, stopSupabaseWarmup } from './services/supabase';

// Code splitting: Lazy load heavy components
const MultiFileDropZone = lazy(() => import('./components/MultiFileDropZone'));
const ChatPanel = lazy(() => import('./components/ChatPanel'));
const Console = lazy(() => import('./components/Console'));
const ImageComparer = lazy(() => import('./components/ImageComparer'));
const ControlPanel = lazy(() => import('./components/ControlPanel'));
const ConfirmDialog = lazy(() => import('./components/ConfirmDialog'));
const ExportDialog = lazy(() => import('./components/ExportDialog'));
const HistoryDrawer = lazy(() => import('./components/HistoryDrawer'));
const EdgeHandle = lazy(() => import('./components/EdgeHandle'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const ProfileModal = lazy(() => import('./components/ProfileModal'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
const MembershipPlans = lazy(() => import('./components/MembershipPlans'));
const LayersPanel = lazy(() => import('./components/LayersPanel'));
const ProcessingTimeline = lazy(() => import('./components/ProcessingTimeline'));
const CanvasRenderer = lazy(() => import('./components/CanvasRenderer'));
const ToolPanel = lazy(() => import('./components/ToolPanel'));
const AlignmentToolbar = lazy(() => import('./components/AlignmentToolbar'));


function App() {
  const { t } = useLanguage();

  // Konsol loglarını sadece production'da bastır
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    
    // Sadece production'da logları kapat
    if (!isDev) {
      const original = {
        log: console.log,
        info: console.info,
        debug: console.debug,
      };
      console.log = () => {};
      console.info = () => {};
      console.debug = () => {};
      // console.warn ve console.error'ı production'da bile bırak (kritik hatalar için)
      
      return () => {
        console.log = original.log;
        console.info = original.info;
        console.debug = original.debug;
      };
    }
  }, []);
  const { layers, activeLayerId, addProcessStep, undo, redo, canUndo, canRedo, removeLayer, duplicateLayer, setActiveLayer, updateLayer, selectedLayerIds, setSelectedLayerIds, updateLayersBatch } = useProject();
  const [activeModule, setActiveModule] = useState<Module>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [processingTime, setProcessingTime] = useState<number>();
  const [modelVersion, setModelVersion] = useState<string>();
  const [logs, setLogs] = useState<Array<{ timestamp: number; type: 'request' | 'response' | 'error'; data: any }>>([]);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [resultData, setResultData] = useState<{ status?: string; predictTime?: number; webUrl?: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  // Start in 'fit' to avoid showing compare UI without a valid result
  const [viewMode, setViewMode] = useState<'fit' | 'zoom' | 'compare'>('fit');
  
  // Tool panel states
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [, setLassoCycleIndex] = useState(0); // 0: lasso, 1: rect-select, 2: ellipse-select
  
  // Dialog state for module switching
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingModule, setPendingModule] = useState<Module>(null);
  
  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // showAuthModal removed - users must login via Panel
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMembershipPlans, setShowMembershipPlans] = useState(false);
  
  // Check if any modal is open
  const isAnyModalOpen = showHistoryModal || showSettingsModal || showProfileModal || showNotifications || showMembershipPlans;
  
  // User state - Real auth system with Supabase
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;
    
    // Start Supabase connection warmup to prevent cold starts
    initializeSupabaseWarmup();
    
    const initializeAuth = async () => {
      try {
        console.log('EditorWeb: Initializing auth (same-origin mode)...');
        
        // Since we're now under the same origin (/editor), session is shared via cookies
        // No need for URL token passing - just check existing session
        const user = await getCurrentUser();
        
        if (!mounted) return;
        
        if (user) {
          console.log('EditorWeb: User authenticated:', user.email);
          console.log('EditorWeb: User ID:', user.id);
          setUserId(user.id);
          setIsLoggedIn(true);
          
          // Fetch user profile
          const profile = await getUserProfile(user.id);
          console.log('EditorWeb: getUserProfile returned:', profile);
          
          if (profile && mounted) {
            setUserProfile(profile);
            setUserCredits(profile.credits);
            console.log('EditorWeb: User profile loaded:', {
              credits: profile.credits,
              full_name: profile.full_name,
              membership_tier: profile.membership_tier,
              created_at: profile.created_at
            });
          } else {
            console.log('EditorWeb: No profile found or component unmounted');
          }
        } else {
          // No user - show login prompt (don't auto-redirect to avoid loops)
          console.log('EditorWeb: No user session found');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('EditorWeb: Auth initialization error:', error);
        setIsLoggedIn(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('EditorWeb: Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        setIsLoggedIn(true);
        
        // Don't block on profile fetch
        getUserProfile(session.user.id).then(profile => {
          if (profile && mounted) {
            setUserProfile(profile);
            setUserCredits(profile.credits);
            console.log('EditorWeb: Profile loaded via auth state change');
          }
        }).catch(error => {
          console.error('EditorWeb: Error fetching profile on auth state change:', error);
        });
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserProfile(null);
        setUserCredits(0);
        setUserId(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      stopSupabaseWarmup();
    };
  }, []);
  
  // AI Chat Panel state
  const [isChatExpanded] = useState(true); // Can be toggled later
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Note: Drag & drop is now handled by Canvas and Layers panel individually (no global blockers)

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // Ctrl+Z - Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canUndo) {
          e.preventDefault();
          undo();
          setToast({ message: 'Undo', type: 'success' });
        }
        
        // Ctrl+Y or Ctrl+Shift+Z - Redo  
        if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
          if (canRedo) {
            e.preventDefault();
            redo();
            setToast({ message: 'Redo', type: 'success' });
          }
        }
      } catch (error) {
        console.error('Keyboard shortcut error:', error);
        setToast({ message: 'Action failed', type: 'error' });
      }

      // Tool shortcuts (Photoshop-like)
      const target = e.target as HTMLElement;
      const inText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (!inText) {
        // M -> Rect/Ellipse marquee select (cycle with Shift)
        if ((e.key === 'm' || e.key === 'M')) {
          e.preventDefault();
          if (e.shiftKey) {
            setActiveTool(prev => prev === 'ellipse-select' ? 'rect-select' : 'ellipse-select');
          } else {
            setActiveTool('rect-select');
          }
          return;
        }
        // L -> Lasso; Shift+L cycles lasso/rect/ellipse
        if ((e.key === 'l' || e.key === 'L')) {
          e.preventDefault();
          if (e.shiftKey) {
            setLassoCycleIndex(prev => {
              const next = (prev + 1) % 3;
              const tool = next === 0 ? 'lasso' : next === 1 ? 'rect-select' : 'ellipse-select';
              setActiveTool(tool as Tool);
              return next;
            });
          } else {
            setActiveTool('lasso');
            setLassoCycleIndex(0);
          }
          return;
        }
        // V -> Move tool
        if ((e.key === 'v' || e.key === 'V')) {
          e.preventDefault();
          setActiveTool('move');
          return;
        }
        // Ctrl+D -> Deselect all layer selections (pixel selection is handled in CanvasRenderer)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault();
          setSelectedLayerIds([]);
          setActiveLayer(null);
          return;
        }
      }
      // After undo/redo handling, gate other shortcuts when multi-selection is active
      if (selectedLayerIds.length >= 2) {
        const target = e.target as HTMLElement;
        const inText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (inText) return;

        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
          const selected = layers.filter(l => selectedLayerIds.includes(l.id));
          if (selected.length < 2) return; // safety
          switch (e.key) {
            case 'ArrowLeft': {
              e.preventDefault();
              const minX = Math.min(...selected.map(l => l.position.x));
              updateLayersBatch(selected.map(l => ({ id: l.id, updates: { position: { ...l.position, x: minX } } })));
              return;
            }
            case 'ArrowRight': {
              e.preventDefault();
              const maxX = Math.max(...selected.map(l => l.position.x + l.size.width));
              updateLayersBatch(selected.map(l => ({ id: l.id, updates: { position: { ...l.position, x: maxX - l.size.width } } })));
              return;
            }
            case 'ArrowUp': {
              e.preventDefault();
              const minY = Math.min(...selected.map(l => l.position.y));
              updateLayersBatch(selected.map(l => ({ id: l.id, updates: { position: { ...l.position, y: minY } } })));
              return;
            }
            case 'ArrowDown': {
              e.preventDefault();
              const maxY = Math.max(...selected.map(l => l.position.y + l.size.height));
              updateLayersBatch(selected.map(l => ({ id: l.id, updates: { position: { ...l.position, y: maxY - l.size.height } } })));
              return;
            }
            case 'c':
            case 'C': {
              e.preventDefault();
              const avgX = selected.reduce((sum, l) => sum + (l.position.x + l.size.width / 2), 0) / selected.length;
              updateLayersBatch(selected.map(l => ({ id: l.id, updates: { position: { ...l.position, x: avgX - l.size.width / 2 } } })));
              return;
            }
            case 'm':
            case 'M': {
              e.preventDefault();
              const avgY = selected.reduce((sum, l) => sum + (l.position.y + l.size.height / 2), 0) / selected.length;
              updateLayersBatch(selected.map(l => ({ id: l.id, updates: { position: { ...l.position, y: avgY - l.size.height / 2 } } })));
              return;
            }
          }
        }
        // Block non-alignment single-layer shortcuts while multi-selection is active
        return;
      }
      
      // Delete - Remove active layer
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeLayerId && layers.length > 0) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          removeLayer(activeLayerId);
          setToast({ message: 'Layer deleted', type: 'success' });
        }
      }
      
      // Ctrl+D - Duplicate layer
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && activeLayerId) {
        e.preventDefault();
        duplicateLayer(activeLayerId);
        setToast({ message: 'Layer duplicated', type: 'success' });
      }
      
      // Escape - Deselect
      if (e.key === 'Escape') {
        // Clear multi-selection first
        if (selectedLayerIds.length > 0) {
          setSelectedLayerIds([]);
        }
        setActiveLayer(null);
      }
      
      // Ctrl+A - Select all layers
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allLayerIds = layers.map(l => l.id);
        setSelectedLayerIds(allLayerIds);
        if (allLayerIds.length > 0) {
          setActiveLayer(allLayerIds[allLayerIds.length - 1]);
          setToast({ message: `${allLayerIds.length} layers selected`, type: 'success' });
        }
      }

      // [ - Decrease opacity
      if (e.key === '[' && activeLayerId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const layer = layers.find(l => l.id === activeLayerId);
          if (layer && !layer.locked) {
            updateLayer(activeLayerId, { opacity: Math.max(0, layer.opacity - 10) });
          }
        }
      }

      // ] - Increase opacity
      if (e.key === ']' && activeLayerId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const layer = layers.find(l => l.id === activeLayerId);
          if (layer && !layer.locked) {
            updateLayer(activeLayerId, { opacity: Math.min(100, layer.opacity + 10) });
          }
        }
      }

      // H - Toggle visibility (V reserved for Move tool)
      if ((e.key === 'h' || e.key === 'H') && activeLayerId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const layer = layers.find(l => l.id === activeLayerId);
          if (layer) {
            updateLayer(activeLayerId, { visible: !layer.visible });
            setToast({ message: layer.visible ? 'Layer hidden' : 'Layer visible', type: 'success' });
          }
        }
      }

      // L - Toggle lock
      if (e.key === 'l' && activeLayerId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const layer = layers.find(l => l.id === activeLayerId);
          if (layer) {
            updateLayer(activeLayerId, { locked: !layer.locked });
            setToast({ message: layer.locked ? 'Layer unlocked' : 'Layer locked', type: 'success' });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, activeLayerId, layers, removeLayer, duplicateLayer, setActiveLayer, updateLayer, selectedLayerIds]);

  const handleModuleSelect = (module: Module) => {
    // If there's a result image and user is switching modules, ask what to do
    if (resultImage && !isProcessing && activeModule !== module) {
      setPendingModule(module);
      setShowConfirmDialog(true);
    } else {
      // No result yet or same module, just switch
      setActiveModule(module);
    }
  };

  const handleContinueWithResult = () => {
    // Use the result image as the new current image
    if (resultImage) {
      setCurrentImage(resultImage);
      setResultImage(null);
      setResultData(null);
      setStatus(`Switched to ${pendingModule} with processed image`);
      setToast({ message: 'Using processed image for next operation', type: 'success' });
    }
    setActiveModule(pendingModule);
    setShowConfirmDialog(false);
    setPendingModule(null);
  };

  const handleUseOriginal = () => {
    // Keep original image, discard result
    setResultImage(null);
    setResultData(null);
    setStatus(`Switched to ${pendingModule} with original image`);
    setActiveModule(pendingModule);
    setShowConfirmDialog(false);
    setPendingModule(null);
  };

  const handleCancelDialog = () => {
    // Cancel the module switch
    setShowConfirmDialog(false);
    setPendingModule(null);
  };

  // Determine which image is currently visible and should be processed
  const getVisibleImageSource = () => {
    if (layers.length > 0) {
      const active = activeLayerId ? layers.find(l => l.id === activeLayerId) : undefined;
      if (active && active.visible) {
        return { url: active.imageUrl, layerId: active.id as string, source: 'layer' as const };
      }
      // Fallback to top-most visible image layer (exclude backgrounds)
      const topVisible = [...layers]
        .filter(l => l.visible && l.type !== 'background' && !!l.imageUrl)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      if (topVisible) {
        return { url: topVisible.imageUrl, layerId: topVisible.id as string, source: 'layer' as const };
      }
    } else {
      if (resultImage) return { url: resultImage, source: 'result' as const };
      if (currentImage) return { url: currentImage, source: 'current' as const };
    }
    return { url: null as string | null, source: 'none' as const };
  };

  // Make sure the image URL is publicly accessible by the backend (convert data/blob to uploaded URL)
  const ensureProcessableUrl = async (srcUrl: string): Promise<string> => {
    if (/^https?:\/\//i.test(srcUrl)) return srcUrl;
    try {
      let blob: Blob;
      if (srcUrl.startsWith('data:')) {
        const [meta, b64] = srcUrl.split(',');
        const mimeMatch = meta.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bin = atob(b64);
        const len = bin.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
        blob = new Blob([u8], { type: mime });
      } else {
        const res = await fetch(srcUrl);
        blob = await res.blob();
      }
      const ext = (blob.type.split('/')[1] || 'png').split(';')[0];
      const file = new File([blob], `image.${ext}`, { type: blob.type || 'image/png' });
      const publicUrl = await uploadImage(file);
      return publicUrl;
    } catch (e) {
      console.error('ensureProcessableUrl failed, falling back to original URL:', e);
      return srcUrl;
    }
  };

  // Downscale a public URL if larger than maxDim, return new public URL
  const downscaleIfNeeded = async (publicUrl: string, maxDim = 2048): Promise<string> => {
    try {
      const res = await fetch(publicUrl, { mode: 'cors', cache: 'no-store' });
      if (!res.ok) return publicUrl;
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = obj; });
      URL.revokeObjectURL(obj);
      const w = img.naturalWidth || img.width; const h = img.naturalHeight || img.height;
      const max = Math.max(w, h);
      if (max <= maxDim) return publicUrl;
      const scale = maxDim / max;
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d'); if (!ctx) return publicUrl;
      ctx.drawImage(img, 0, 0, cw, ch);
      const outBlob: Blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.92));
      const file = new File([outBlob], `scaled-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = await uploadImage(file);
      return url;
    } catch {
      return publicUrl;
    }
  };

  // Composite currently visible layers to a PNG blob and upload; returns public URL
  const compositeVisibleLayers = async (): Promise<string | null> => {
    const visibleLayers = layers.filter(l => l.visible);
    if (visibleLayers.length === 0) return null;
    const minX = Math.min(...visibleLayers.map(l => l.position.x));
    const minY = Math.min(...visibleLayers.map(l => l.position.y));
    const maxX = Math.max(...visibleLayers.map(l => l.position.x + l.size.width));
    const maxY = Math.max(...visibleLayers.map(l => l.position.y + l.size.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(maxX - minX));
    canvas.height = Math.max(1, Math.round(maxY - minY));
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    const sorted = [...visibleLayers].sort((a,b) => a.zIndex - b.zIndex);
    for (const layer of sorted) {
      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      try { ctx.globalCompositeOperation = (layer.blendMode as any) ?? 'source-over'; } catch { ctx.globalCompositeOperation = 'source-over'; }
      if (layer.type === 'background' && layer.backgroundColor) {
        ctx.fillStyle = layer.backgroundColor;
        ctx.fillRect(Math.round(layer.position.x - minX), Math.round(layer.position.y - minY), Math.round(layer.size.width), Math.round(layer.size.height));
      } else if (layer.imageUrl) {
        // leverage export loader pattern
        const res = await fetch(layer.imageUrl, { mode: 'cors' });
        const blob = await res.blob();
        const u = URL.createObjectURL(blob);
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise((resolve,reject)=>{ img.onload=resolve; img.onerror=reject; img.src=u; });
        ctx.translate(layer.position.x - minX + layer.size.width/2, layer.position.y - minY + layer.size.height/2);
        ctx.rotate((layer.rotation * Math.PI)/180);
        ctx.drawImage(img, Math.round(-layer.size.width/2), Math.round(-layer.size.height/2), Math.round(layer.size.width), Math.round(layer.size.height));
        URL.revokeObjectURL(u);
      }
      ctx.restore();
    }
    const outBlob: Blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png'));
    const file = new File([outBlob], `composite-${Date.now()}.png`, { type: 'image/png' });
    const url = await uploadImage(file);
    return url;
  };

  // Smart-crop removed: variation helper no longer needed

  const handleProcess = async (params: any) => {
    if (!activeModule) return;
    
    // Check if user is logged in - redirect to panel instead of showing modal
    if (!isLoggedIn || !userId) {
      setToast({ message: 'Lütfen önce Panel\'den giriş yapın', type: 'error' });
      setTimeout(() => {
        const panelUrl = import.meta.env.VITE_PANEL_URL || 'http://localhost:3000';
        window.location.href = panelUrl;
      }, 2000);
      return;
    }

    // Define credit costs per module
    const creditCosts: Record<NonNullable<Module>, number> = {
      'upscale': 10,
      'remove-bg': 8,
      'pixel-change': 12,
    };

    const creditsNeeded = activeModule ? (creditCosts[activeModule] || 10) : 10;

    // Check if user has enough credits
    if (userCredits < creditsNeeded) {
      setToast({ message: `Yetersiz kredi! ${creditsNeeded} kredi gerekli.`, type: 'error' });
      setShowMembershipPlans(true);
      return;
    }

    const visible = getVisibleImageSource();
    const imageToProcess = visible.url;
    const targetLayerId = (visible as any).layerId as string | undefined;
    if (!imageToProcess) return;

    setIsProcessing(true);
    setStatus('Processing...');

  // If composite flag requested and layers exist, render composite and use that URL
  let safeUrl = params?.composite && layers.length > 0 ? (await compositeVisibleLayers()) || imageToProcess : imageToProcess;
  safeUrl = await ensureProcessableUrl(safeUrl);
  safeUrl = await downscaleIfNeeded(safeUrl, 2048);

    // Smart-crop removed: no variation/caching tweak needed

    const requestLog = {
      timestamp: Date.now(),
      type: 'request' as const,
      data: { module: activeModule, params, image_url: safeUrl.substring(0, 80) + '...' },
    };
    setLogs((prev) => [...prev, requestLog]);

    const result = await processImage(activeModule, safeUrl, params);

    const responseLog = {
      timestamp: Date.now(),
      type: result.success ? ('response' as const) : ('error' as const),
      data: result.raw_response || result,
    };
    setLogs((prev) => [...prev, responseLog]);

  if (result.success && result.output_url) {
      // Deduct credits
      try {
        const success = await deductCredits(
          userId,
          creditsNeeded,
          `${activeModule} processing`,
        );

        if (success) {
          // Update local credits count
          setUserCredits(prev => prev - creditsNeeded);
          
          // Save processing history
          await saveProcessingHistory({
            user_id: userId,
            module: activeModule as 'upscale' | 'remove-bg' | 'pixel-change',
            input_url: safeUrl,
            output_url: result.output_url,
            params,
            credits_used: creditsNeeded,
            processing_time: result.processing_time,
            status: 'success',
          });
        } else {
          // Shouldn't happen, but handle it
          setToast({ message: 'Kredi düşme hatası', type: 'error' });
        }
      } catch (error) {
        console.error('Credit deduction error:', error);
      }

      // If targeting a layer, add step to that layer; else use legacy single image result
      if (targetLayerId) {
        const processStep: ProcessStep = {
          id: `step-${Date.now()}`,
          timestamp: Date.now(),
          module: activeModule,
          params,
          inputImage: safeUrl,
          outputImage: result.output_url,
          status: 'success',
          processingTime: result.processing_time,
        };
        addProcessStep(targetLayerId, processStep);
      } else {
        // Legacy single image mode
        setResultImage(result.output_url);
      }
      
      setStatus('Processing complete');
      setProcessingTime(result.processing_time);
      setModelVersion(result.model_version);
      
      // Force status to "succeeded" if we have a result
      const finalStatus = result.status === 'processing' ? 'succeeded' : result.status;
      
      setResultData({
        status: finalStatus,
        predictTime: result.predict_time,
        webUrl: result.web_url,
      });
      
      // Auto-switch to compare mode ONLY for eligible modules
      // Eligible: upscale, pixel-change (enhance-like). Exclude others to avoid noisy UX.
      const compareEligible = new Set<Module>(['upscale', 'pixel-change']);
      if (activeModule && compareEligible.has(activeModule)) {
        setViewMode('compare');
        setZoomLevel(1);
      } else {
        // Default to fit after processing for non-compare flows
        setViewMode('fit');
        setZoomLevel(1);
      }
      
      setToast({ message: 'Image processed successfully!', type: 'success' });
    } else {
      const errorMessage = result.error || 'Unknown error occurred';
      setStatus(`Error: ${errorMessage}`);
      setToast({ message: `Processing failed: ${errorMessage}`, type: 'error' });
    }

    setIsProcessing(false);
  };

  const handleExportClick = () => {
    if (layers.length === 0 && !resultImage) {
      setToast({ message: 'No image to export', type: 'error' });
      return;
    }
    setShowExportDialog(true);
  };

  const handleExport = async (format: string, quality: number) => {
    try {
      // Helper to safely load an image URL into an HTMLImageElement, attempting CORS-safe paths first
      const loadImage = async (src: string): Promise<{ img: HTMLImageElement; revoke?: () => void }> => {
        // Fast path for data URLs
        if (src.startsWith('data:')) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
          });
          return { img };
        }
        // Try fetch as blob (requires CORS on the source)
        try {
          const res = await fetch(src, { mode: 'cors' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = objectUrl;
          });
          return { img, revoke: () => URL.revokeObjectURL(objectUrl) };
        } catch (err) {
          // Fallback: try direct load with anonymous CORS (may taint if server disallows CORS)
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
          });
          return { img };
        }
      };

      // If we have layers, export the composite canvas
      if (layers.length > 0) {
        // Create a composite canvas from all visible layers
        const canvas = document.createElement('canvas');

        // Find canvas bounds
        const visibleLayers = layers.filter(l => l.visible);
        if (visibleLayers.length === 0) {
          setToast({ message: 'No visible layers to export', type: 'error' });
          return;
        }

        const minX = Math.min(...visibleLayers.map(l => l.position.x));
        const minY = Math.min(...visibleLayers.map(l => l.position.y));
        const maxX = Math.max(...visibleLayers.map(l => l.position.x + l.size.width));
        const maxY = Math.max(...visibleLayers.map(l => l.position.y + l.size.height));

        canvas.width = Math.max(1, Math.round(maxX - minX));
        canvas.height = Math.max(1, Math.round(maxY - minY));
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Draw all layers in order
        const sortedLayers = [...visibleLayers].sort((a, b) => a.zIndex - b.zIndex);

        // Track object URLs to revoke later
        const revokers: Array<() => void> = [];

        try {
          for (const layer of sortedLayers) {
            ctx.save();
            ctx.globalAlpha = layer.opacity / 100;
            // fall back to source-over if blendMode is invalid
            try {
              ctx.globalCompositeOperation = (layer.blendMode as any) ?? 'source-over';
            } catch {
              ctx.globalCompositeOperation = 'source-over';
            }

            if (layer.type === 'background' && layer.backgroundColor) {
              ctx.fillStyle = layer.backgroundColor;
              ctx.fillRect(
                Math.round(layer.position.x - minX),
                Math.round(layer.position.y - minY),
                Math.round(layer.size.width),
                Math.round(layer.size.height)
              );
            } else if (layer.imageUrl) {
              const { img, revoke } = await loadImage(layer.imageUrl);
              if (revoke) revokers.push(revoke);

              ctx.translate(
                layer.position.x - minX + layer.size.width / 2,
                layer.position.y - minY + layer.size.height / 2
              );
              ctx.rotate((layer.rotation * Math.PI) / 180);
              ctx.drawImage(
                img,
                Math.round(-layer.size.width / 2),
                Math.round(-layer.size.height / 2),
                Math.round(layer.size.width),
                Math.round(layer.size.height)
              );
            }

            ctx.restore();
          }

          // Convert to desired format directly from composite canvas
          const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
          const qualityValue = format === 'png' ? undefined : quality / 100;

          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('Failed to convert composite'))),
              mimeType,
              qualityValue
            );
          });

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `editorx-${Date.now()}.${format}`;
          // Ensure click works reliably
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 0);

          setToast({ message: `Image exported as ${format.toUpperCase()}!`, type: 'success' });
        } finally {
          // Revoke any temporary object URLs
          for (const revoke of revokers) {
            try { revoke(); } catch {}
          }
        }
        return;
      }

      // Fallback: export the current result image if present
      if (resultImage) {
        // If the requested format is the same as the source and CORS allows, just download the blob
        const sameFormat = (() => {
          const extMatch = resultImage.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
          const ext = extMatch?.[1]?.toLowerCase();
          const desired = format === 'jpg' ? 'jpeg' : format;
          return ext ? (ext === desired || (ext === 'jpg' && desired === 'jpeg')) : false;
        })();

        try {
          const res = await fetch(resultImage, { mode: 'cors' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();

          if (sameFormat) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `editorx-${Date.now()}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 0);
            setToast({ message: `Image exported as ${format.toUpperCase()}!`, type: 'success' });
            return;
          }

          // Otherwise convert via canvas
          const img = new Image();
          const objectUrl = URL.createObjectURL(blob);
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = objectUrl;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');
          ctx.drawImage(img, 0, 0);

          const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
          const qualityValue = format === 'png' ? undefined : quality / 100;
          const outBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('Failed to convert result'))),
              mimeType,
              qualityValue
            );
          });
          URL.revokeObjectURL(objectUrl);

          const url = URL.createObjectURL(outBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `editorx-${Date.now()}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 0);
          setToast({ message: `Image exported as ${format.toUpperCase()}!`, type: 'success' });
          return;
        } catch (err) {
          console.error('Result export failed, likely due to CORS:', err);
          setToast({ message: 'Failed to export image (CORS blocked)', type: 'error' });
          return;
        }
      }

      setToast({ message: 'No image to export', type: 'error' });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Failed to export image', type: 'error' });
    }
  };

  // Note: Standalone zoom/fit/compare action buttons removed with the bottom control bar.


  return (
    <div className="min-h-screen bg-white dark:bg-[#0C0C0F] flex flex-col">
      <Header
        onHistoryClick={() => setShowHistoryModal(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
        onExportClick={handleExportClick}
        onNotificationClick={() => setShowNotifications(true)}
        onProfileClick={() => setShowProfileModal(true)}
        onBalanceClick={() => setShowMembershipPlans(true)}
        onLoginClick={() => window.location.href = import.meta.env.VITE_PANEL_URL || 'http://localhost:3000'}
        hasResult={layers.length > 0 || !!resultImage}
        isLoggedIn={isLoggedIn}
        userCredits={userCredits}
      />

      <Toolbar activeModule={activeModule} onModuleSelect={handleModuleSelect} />

      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><LoadingSpinner size="xl" text="Loading editor..." /></div>}>
        <main className="flex-1 flex overflow-hidden">
        {/* AI Chat Panel - Always visible on left (hidden on mobile) */}
        {isChatExpanded && (
          <div className={`hidden lg:flex ${showLeftPanel ? 'w-80 border-r bg-gray-50 dark:bg-gray-900 overflow-visible' : 'w-0 border-r-0 bg-transparent pointer-events-none overflow-hidden'} border-gray-200 dark:border-gray-800 flex-col relative transition-[width] ${showLeftPanel ? 'duration-200 ease-out' : 'duration-400 ease-in'}`}>
            <ChatPanel
              onImageEdit={(prompt) => {
                console.log('AI Edit prompt:', prompt);
                setToast({ message: `AI işlemi başlatılıyor: ${prompt}`, type: 'success' });
              }}
              isProcessing={isProcessing}
            />
            {/* Edge handle on the right edge of AI panel (only when open) */}
            {showLeftPanel && !isAnyModalOpen && (
              <div className="absolute top-0 right-0 h-full">
                <EdgeHandle side="left" open={showLeftPanel} onClick={() => setShowLeftPanel(v => !v)} />
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* When left panel is closed, show a handle at the very left edge to reopen */}
          {!showLeftPanel && !isAnyModalOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <EdgeHandle side="left" open={false} onClick={() => setShowLeftPanel(true)} />
            </div>
          )}
          <div className="flex-1 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-[#0C0C0F] dark:via-[#1A1A22]/30 dark:to-[#0C0C0F] p-4 md:p-8 overflow-hidden">
            <div className="h-full bg-white/80 dark:bg-[#0C0C0F]/40 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col">
              {/* Show Multi-Layer Canvas if layers exist, otherwise show upload zone */}
              {layers.length > 0 ? (
                <>
                  {/* Multi-Layer Canvas with Tool Panel */}
                  <div className="flex-1 overflow-hidden relative flex">
                    {/* Tool Panel - Left Side */}
                    <ToolPanel 
                      activeTool={activeTool}
                      onToolSelect={setActiveTool}
                    />
                    
                    {/* Canvas Area */}
                    <div className="flex-1 p-8 relative">
                      <CanvasRenderer 
                        showControls={true}
                        viewMode={viewMode}
                        zoomLevel={zoomLevel}
                        onZoomChange={setZoomLevel}
                        onViewModeChange={setViewMode}
                        activeTool={activeTool}
                      />
                      
                      {/* Alignment Toolbar - Floating on Top */}
                      <AlignmentToolbar />
                    </div>
                  </div>
                  
                  {/* Processing Timeline */}
                  {activeLayerId && (
                    <ProcessingTimeline />
                  )}
                </>
              ) : !currentImage ? (
                <MultiFileDropZone />
              ) : (
                <>
                  {/* Image Display Area - Fixed Height */}
                  <div 
                    className="flex-1 p-8" 
                    style={{ 
                      maxHeight: 'calc(100vh - 350px)',
                      overflow: viewMode === 'zoom' ? 'auto' : 'hidden'
                    }}
                  >
                    {resultImage ? (
                      <div className="w-full h-full">
                        {viewMode === 'compare' ? (
                          <ImageComparer
                            beforeImage={currentImage}
                            afterImage={resultImage}
                          />
                        ) : viewMode === 'zoom' ? (
                          <div className="w-full h-full flex items-center justify-center overflow-auto">
                            <img
                              src={resultImage}
                              alt="Result (Zoomed)"
                              className="rounded-lg shadow-2xl"
                              style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'center',
                                transition: 'transform 0.3s ease',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={resultImage}
                              alt="Result (Fitted)"
                              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {viewMode === 'zoom' ? (
                          <div className="w-full h-full flex items-center justify-center overflow-auto">
                            <img
                              src={currentImage}
                              alt="Uploaded content (Zoomed)"
                              className="rounded-lg shadow-2xl"
                              style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'center',
                                transition: 'transform 0.3s ease',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                        ) : (
                          <img
                            src={currentImage}
                            alt="Uploaded content"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Zoom Controls - Only visible in zoom mode, above metadata bar */}
                  {(currentImage || resultImage) && viewMode === 'zoom' && (
                    <div className="flex items-center justify-center py-3 border-t border-gray-800/50 border-gray-200">
                      <div className="flex items-center gap-2 bg-[#1A1A22]/90 bg-white/90 backdrop-blur-lg px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 shadow-xl">
                        <button
                          onClick={() => {
                            const newZoom = Math.max(0.5, zoomLevel - 0.25);
                            setZoomLevel(newZoom);
                            setToast({ message: `Zoom: ${(newZoom * 100).toFixed(0)}%`, type: 'success' });
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#0C0C0F] hover:bg-[#A97FFF] hover:bg-[#A97FFF] text-gray-900 dark:text-white hover:text-white transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        
                        <span className="text-gray-900 dark:text-white font-medium text-sm min-w-[60px] text-center">
                          {(zoomLevel * 100).toFixed(0)}%
                        </span>
                        
                        <button
                          onClick={() => {
                            const newZoom = Math.min(3, zoomLevel + 0.25);
                            setZoomLevel(newZoom);
                            setToast({ message: `Zoom: ${(newZoom * 100).toFixed(0)}%`, type: 'success' });
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#0C0C0F] hover:bg-[#A97FFF] hover:bg-[#A97FFF] text-gray-900 dark:text-white hover:text-white transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        
                        <div className="w-px h-6 bg-gray-700 bg-gray-300 mx-2"></div>
                        
                        <button
                          onClick={() => {
                            setZoomLevel(1);
                            setToast({ message: 'Reset to 100%', type: 'success' });
                          }}
                          className="px-3 py-1 text-xs font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-[#0C0C0F] hover:bg-[#A97FFF] hover:bg-[#A97FFF] hover:text-white rounded-lg transition-all"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Result Metadata - Compact Bottom Bar */}
                  {resultImage && resultData && (
                    <div className="border-t border-gray-200 dark:border-gray-800 bg-[#1A1A22]/50 bg-gray-50/90 backdrop-blur-sm px-6 py-3">
                      <div className="flex items-center gap-6 text-sm">
                        {resultData.status && (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${resultData.status === 'succeeded' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                            <span className="text-gray-600 dark:text-gray-400">{t('history.status')}:</span>
                            <span className={`font-medium ${resultData.status === 'succeeded' ? 'text-green-400 text-green-600' : 'text-yellow-400 text-yellow-600'}`}>
                              {resultData.status === 'succeeded' ? t('history.completed') : t('history.processing')}
                            </span>
                          </div>
                        )}
                        {resultData.predictTime && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">{t('history.time')}:</span>
                            <span className="text-gray-900 dark:text-white font-medium">{resultData.predictTime.toFixed(2)}s</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom view controls removed per request to simplify UI */}
        </div>

        {layers.length > 0 ? (
          <div className={`${showRightPanel ? 'w-80 md:w-96' : 'w-0 pointer-events-none'} border-l border-gray-200 dark:border-gray-800 ${showRightPanel ? 'bg-white dark:bg-[#0C0C0F]' : 'bg-transparent'} ${showRightPanel ? 'overflow-visible' : 'overflow-hidden'} flex flex-col relative transition-[width] ${showRightPanel ? 'duration-200 ease-out' : 'duration-400 ease-in'}`}
          >
            {/* Control Panel - Fixed at TOP */}
            {showRightPanel && activeModule && activeLayerId && (
              <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-[#1A1A22]">
                <div className="mb-3">
                  <h4 className="text-gray-900 dark:text-white font-semibold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#A97FFF]"></span>
                    {t('control.processActiveLayer') || 'Process Active Layer'}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                    {t('control.selectTool') || 'Apply processing to active layer'}
                  </p>
                </div>
                <ControlPanel
                  module={activeModule}
                  onProcess={handleProcess}
                  isProcessing={isProcessing}
                  disabled={isProcessing}
                />
              </div>
            )}
            
            {/* Layers Panel - Scrollable BELOW Control Panel */}
            {showRightPanel && (
              <div className="flex-1 overflow-y-auto">
                <LayersPanel />
              </div>
            )}
            {/* Edge handle on the left edge of layers panel (only when open) */}
            {showRightPanel && !isAnyModalOpen && (
              <div className="absolute top-0 left-0 h-full">
                <EdgeHandle side="right" open={showRightPanel} onClick={() => setShowRightPanel(v => !v)} />
              </div>
            )}
          </div>
        ) : activeModule && currentImage ? (
          <div className={`${showRightPanel ? 'w-80 md:w-96' : 'w-0 pointer-events-none'} border-l border-gray-200 dark:border-gray-800 ${showRightPanel ? 'bg-gray-50 dark:bg-[#0C0C0F]' : 'bg-transparent'} p-4 md:p-6 ${showRightPanel ? 'overflow-y-auto' : 'overflow-hidden'} relative transition-[width] ${showRightPanel ? 'duration-200 ease-out' : 'duration-400 ease-in'}`}>
            <ControlPanel
              module={activeModule}
              onProcess={handleProcess}
              isProcessing={isProcessing}
              disabled={isProcessing}
            />
            {showRightPanel && !isAnyModalOpen && (
              <div className="absolute top-0 left-0 h-full">
                <EdgeHandle side="right" open={showRightPanel} onClick={() => setShowRightPanel(v => !v)} />
              </div>
            )}
          </div>
        ) : null}
        {/* When right panel is closed, show a handle anchored to the right edge of main area */}
        {!showRightPanel && !isAnyModalOpen && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <EdgeHandle side="right" open={false} onClick={() => setShowRightPanel(true)} />
          </div>
        )}
      </main>

      <StatusBar
        status={status}
        processingTime={processingTime}
        modelVersion={modelVersion}
      />

      <Console logs={logs} />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleContinueWithResult}
        onCancel={handleUseOriginal}
        onClose={handleCancelDialog}
        title="Continue with Processed Image?"
        message="You have a processed result. Would you like to use this processed image for the next operation, or start fresh with the original image?"
        confirmText="Use Processed Image"
        cancelText="Use Original Image"
      />

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        imageUrl={
          layers.length > 0 
            ? (layers.find(l => l.id === activeLayerId)?.imageUrl || layers[0]?.imageUrl || '') 
            : (resultImage || '')
        }
      />

      {/* Prefer drawer for less workspace disruption */}
      <HistoryDrawer
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onLoadImage={(inputUrl, outputUrl) => {
          setCurrentImage(inputUrl);
          setResultImage(outputUrl);
          setShowHistoryModal(false);
          setToast({ message: 'Görsel geçmişten yüklendi', type: 'success' });
        }}
        userId={userId}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* AuthModal removed - users must login via Panel */}


      <MembershipPlans
        isOpen={showMembershipPlans}
        onClose={() => setShowMembershipPlans(false)}
        onSelectPlan={(_planId, credits) => {
          setUserCredits(credits);
          setToast({ message: `${credits.toLocaleString()} kredi yüklendi!`, type: 'success' });
        }}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onLogout={() => {
          console.log('🚪 Logout: Immediate redirect...');
          
          // Redirect FIRST (instant UX)
          const panelUrl = import.meta.env.VITE_PANEL_URL || 'http://localhost:3000';
          window.location.href = panelUrl;
          
          // Cleanup happens in background (non-blocking)
          setTimeout(() => {
            supabase.auth.signOut().catch(console.error);
            setShowProfileModal(false);
            setIsLoggedIn(false);
            setUserProfile(null);
            setUserCredits(0);
            setUserId(null);
          }, 0);
        }}
        userId={userId}
        userProfile={userProfile}
      />

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      </Suspense>
    </div>
  );
}

export default App;



