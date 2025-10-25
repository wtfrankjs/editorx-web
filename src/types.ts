export type Module = 'upscale' | 'remove-bg' | 'pixel-change' | null;

// Layer System Types
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

export interface ProcessStep {
  id: string;
  timestamp: number;
  module: Module;
  params: any;
  inputImage: string;
  outputImage: string;
  status: 'success' | 'failed' | 'processing';
  processingTime?: number;
}

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape' | 'background';
  imageUrl: string;
  thumbnail?: string;
  backgroundColor?: string; // For background type layers
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  blendMode: BlendMode;
  processingHistory: ProcessStep[];
  originalImage: string; // Keep original for reset
  zIndex: number;
  createdAt: number;
  // Crop system removed
  // Optional affine skew (degrees). Applied as CSS skewX/skewY for fast, high-quality preview
  transformSkew?: { x: number; y: number };
}

export interface Canvas {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
}

export interface ProjectHistoryStep {
  id: string;
  timestamp: number;
  action: 'add-layer' | 'delete-layer' | 'transform' | 'process' | 'reorder';
  layerId?: string;
  beforeState: any;
  afterState: any;
}

export interface Project {
  id: string;
  name: string;
  canvas: Canvas;
  layers: Layer[];
  currentLayerId: string | null;
  history: ProjectHistoryStep[];
  historyIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface UpscaleParams {
  image_url: string;
  scale: number;
  face_enhance: boolean;
}

export interface SmartCropParams {
  image_url: string;
  preset: string;
  mode: string;
  prompt?: string;
}

export interface RemoveBgParams {
  image_url: string;
}

export interface PixelChangeParams {
  image_url: string;
  prompt: string;
  strength: number;
}

export interface ProcessingResult {
  success: boolean;
  output_url?: string;
  error?: string;
  processing_time?: number;
  model_version?: string;
  status?: string;
  web_url?: string;
  predict_time?: number;
  raw_response?: any;
}

export interface HistoryItem {
  id: string;
  module: string;
  input_url: string;
  output_url?: string;
  timestamp: number;
  params: Record<string, any>;
}
// Crop system types removed
