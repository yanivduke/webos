/**
 * Canvas Manager - Handles canvas state and drawing operations
 * Inspired by Deluxe Paint for Amiga
 */

export enum DrawingTool {
  PENCIL = 'PENCIL',
  BRUSH = 'BRUSH',
  ERASER = 'ERASER',
  LINE = 'LINE',
  RECTANGLE = 'RECTANGLE',
  FILLED_RECTANGLE = 'FILLED_RECTANGLE',
  CIRCLE = 'CIRCLE',
  FILLED_CIRCLE = 'FILLED_CIRCLE',
  FILL = 'FILL',
  EYEDROPPER = 'EYEDROPPER',
  SELECT = 'SELECT',
  TEXT = 'TEXT'
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0-100
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export interface CanvasState {
  width: number;
  height: number;
  layers: Layer[];
  selectedLayerId: string;
  tool: DrawingTool;
  primaryColor: string;
  secondaryColor: string;
  brushSize: number;
  brushOpacity: number;
  backgroundColor: string;
}

export interface HistoryState {
  layerStates: Map<string, ImageData>;
  timestamp: number;
}

export interface Selection {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  imageData?: ImageData;
}

export class CanvasManager {
  private state: CanvasState;
  private history: HistoryState[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 20;
  private selection: Selection = { active: false, x: 0, y: 0, width: 0, height: 0 };
  private compositeCanvas: HTMLCanvasElement;
  private compositeCtx: CanvasRenderingContext2D;

  constructor(width: number = 800, height: number = 600, backgroundColor: string = '#a0a0a0') {
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = width;
    this.compositeCanvas.height = height;
    this.compositeCtx = this.compositeCanvas.getContext('2d', { willReadFrequently: true })!;

    this.state = {
      width,
      height,
      layers: [],
      selectedLayerId: '',
      tool: DrawingTool.BRUSH,
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      brushSize: 3,
      brushOpacity: 100,
      backgroundColor
    };

    this.addLayer('Background');
    this.fillLayer(this.state.selectedLayerId, backgroundColor);
    this.saveHistory();
  }

  // Layer Management
  addLayer(name: string): Layer {
    const canvas = document.createElement('canvas');
    canvas.width = this.state.width;
    canvas.height = this.state.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    const layer: Layer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      visible: true,
      opacity: 100,
      canvas,
      ctx
    };

    this.state.layers.push(layer);
    if (this.state.layers.length === 1) {
      this.state.selectedLayerId = layer.id;
    }

    return layer;
  }

  removeLayer(id: string): boolean {
    if (this.state.layers.length <= 1) {
      return false; // Must keep at least one layer
    }

    const index = this.state.layers.findIndex(l => l.id === id);
    if (index === -1) return false;

    this.state.layers.splice(index, 1);

    if (this.state.selectedLayerId === id) {
      this.state.selectedLayerId = this.state.layers[Math.max(0, index - 1)].id;
    }

    return true;
  }

  selectLayer(id: string): boolean {
    const layer = this.state.layers.find(l => l.id === id);
    if (!layer) return false;

    this.state.selectedLayerId = id;
    return true;
  }

  getLayer(id: string): Layer | undefined {
    return this.state.layers.find(l => l.id === id);
  }

  getSelectedLayer(): Layer | undefined {
    return this.getLayer(this.state.selectedLayerId);
  }

  setLayerVisibility(id: string, visible: boolean): void {
    const layer = this.getLayer(id);
    if (layer) {
      layer.visible = visible;
    }
  }

  setLayerOpacity(id: string, opacity: number): void {
    const layer = this.getLayer(id);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(100, opacity));
    }
  }

  setLayerName(id: string, name: string): void {
    const layer = this.getLayer(id);
    if (layer) {
      layer.name = name;
    }
  }

  moveLayerUp(id: string): boolean {
    const index = this.state.layers.findIndex(l => l.id === id);
    if (index === -1 || index === this.state.layers.length - 1) return false;

    [this.state.layers[index], this.state.layers[index + 1]] =
      [this.state.layers[index + 1], this.state.layers[index]];
    return true;
  }

  moveLayerDown(id: string): boolean {
    const index = this.state.layers.findIndex(l => l.id === id);
    if (index === -1 || index === 0) return false;

    [this.state.layers[index], this.state.layers[index - 1]] =
      [this.state.layers[index - 1], this.state.layers[index]];
    return true;
  }

  mergeLayerDown(id: string): boolean {
    const index = this.state.layers.findIndex(l => l.id === id);
    if (index === -1 || index === 0) return false;

    const upperLayer = this.state.layers[index];
    const lowerLayer = this.state.layers[index - 1];

    // Draw upper layer onto lower layer
    const prevAlpha = lowerLayer.ctx.globalAlpha;
    lowerLayer.ctx.globalAlpha = upperLayer.opacity / 100;
    lowerLayer.ctx.drawImage(upperLayer.canvas, 0, 0);
    lowerLayer.ctx.globalAlpha = prevAlpha;

    // Remove upper layer
    this.state.layers.splice(index, 1);
    this.state.selectedLayerId = lowerLayer.id;

    this.saveHistory();
    return true;
  }

  fillLayer(id: string, color: string): void {
    const layer = this.getLayer(id);
    if (!layer) return;

    layer.ctx.fillStyle = color;
    layer.ctx.fillRect(0, 0, this.state.width, this.state.height);
  }

  clearLayer(id: string): void {
    const layer = this.getLayer(id);
    if (!layer) return;

    layer.ctx.clearRect(0, 0, this.state.width, this.state.height);
  }

  // Tool Management
  setTool(tool: DrawingTool): void {
    this.state.tool = tool;
  }

  getTool(): DrawingTool {
    return this.state.tool;
  }

  // Color Management
  setPrimaryColor(color: string): void {
    this.state.primaryColor = color;
  }

  setSecondaryColor(color: string): void {
    this.state.secondaryColor = color;
  }

  swapColors(): void {
    const temp = this.state.primaryColor;
    this.state.primaryColor = this.state.secondaryColor;
    this.state.secondaryColor = temp;
  }

  getPrimaryColor(): string {
    return this.state.primaryColor;
  }

  getSecondaryColor(): string {
    return this.state.secondaryColor;
  }

  // Brush Settings
  setBrushSize(size: number): void {
    this.state.brushSize = Math.max(1, Math.min(64, size));
  }

  getBrushSize(): number {
    return this.state.brushSize;
  }

  setBrushOpacity(opacity: number): void {
    this.state.brushOpacity = Math.max(0, Math.min(100, opacity));
  }

  getBrushOpacity(): number {
    return this.state.brushOpacity;
  }

  // Drawing Operations
  drawPixel(x: number, y: number, color?: string): void {
    const layer = this.getSelectedLayer();
    if (!layer) return;

    const ctx = layer.ctx;
    const drawColor = color || this.state.primaryColor;

    ctx.fillStyle = drawColor;
    ctx.globalAlpha = this.state.brushOpacity / 100;

    if (this.state.brushSize === 1) {
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    } else {
      const halfSize = this.state.brushSize / 2;
      ctx.beginPath();
      ctx.arc(x, y, halfSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color?: string): void {
    const layer = this.getSelectedLayer();
    if (!layer) return;

    const ctx = layer.ctx;
    const drawColor = color || this.state.primaryColor;

    // Bresenham's line algorithm
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let currentX = x1;
    let currentY = y1;

    while (true) {
      this.drawPixel(currentX, currentY, drawColor);

      if (currentX === x2 && currentY === y2) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        currentX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentY += sy;
      }
    }
  }

  drawRectangle(x: number, y: number, width: number, height: number, filled: boolean = false, color?: string): void {
    const layer = this.getSelectedLayer();
    if (!layer) return;

    const ctx = layer.ctx;
    const drawColor = color || this.state.primaryColor;

    ctx.globalAlpha = this.state.brushOpacity / 100;

    if (filled) {
      ctx.fillStyle = drawColor;
      ctx.fillRect(x, y, width, height);
    } else {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = this.state.brushSize;
      ctx.strokeRect(x, y, width, height);
    }

    ctx.globalAlpha = 1;
  }

  drawCircle(x: number, y: number, radius: number, filled: boolean = false, color?: string): void {
    const layer = this.getSelectedLayer();
    if (!layer) return;

    const ctx = layer.ctx;
    const drawColor = color || this.state.primaryColor;

    ctx.globalAlpha = this.state.brushOpacity / 100;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (filled) {
      ctx.fillStyle = drawColor;
      ctx.fill();
    } else {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = this.state.brushSize;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  drawEllipse(x: number, y: number, radiusX: number, radiusY: number, filled: boolean = false, color?: string): void {
    const layer = this.getSelectedLayer();
    if (!layer) return;

    const ctx = layer.ctx;
    const drawColor = color || this.state.primaryColor;

    ctx.globalAlpha = this.state.brushOpacity / 100;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);

    if (filled) {
      ctx.fillStyle = drawColor;
      ctx.fill();
    } else {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = this.state.brushSize;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  // Flood fill algorithm (scanline)
  floodFill(startX: number, startY: number, fillColor?: string): void {
    const layer = this.getSelectedLayer();
    if (!layer) return;

    const ctx = layer.ctx;
    const color = fillColor || this.state.primaryColor;

    startX = Math.floor(startX);
    startY = Math.floor(startY);

    if (startX < 0 || startX >= this.state.width || startY < 0 || startY >= this.state.height) {
      return;
    }

    const imageData = ctx.getImageData(0, 0, this.state.width, this.state.height);
    const pixels = imageData.data;

    const targetColor = this.getPixelColor(pixels, startX, startY);
    const fillRgba = this.hexToRgba(color);

    // Don't fill if target color is same as fill color
    if (this.colorsMatch(targetColor, fillRgba)) {
      return;
    }

    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (x < 0 || x >= this.state.width || y < 0 || y >= this.state.height) continue;

      const currentColor = this.getPixelColor(pixels, x, y);
      if (!this.colorsMatch(currentColor, targetColor)) continue;

      // Fill pixel
      this.setPixelColor(pixels, x, y, fillRgba);

      // Add neighbors
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private getPixelColor(pixels: Uint8ClampedArray, x: number, y: number): [number, number, number, number] {
    const index = (y * this.state.width + x) * 4;
    return [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
  }

  private setPixelColor(pixels: Uint8ClampedArray, x: number, y: number, color: [number, number, number, number]): void {
    const index = (y * this.state.width + x) * 4;
    pixels[index] = color[0];
    pixels[index + 1] = color[1];
    pixels[index + 2] = color[2];
    pixels[index + 3] = color[3];
  }

  private colorsMatch(c1: [number, number, number, number], c2: [number, number, number, number]): boolean {
    return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
  }

  private hexToRgba(hex: string): [number, number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255]
      : [0, 0, 0, 255];
  }

  // Eyedropper tool
  pickColor(x: number, y: number): string | null {
    const layer = this.getSelectedLayer();
    if (!layer) return null;

    x = Math.floor(x);
    y = Math.floor(y);

    if (x < 0 || x >= this.state.width || y < 0 || y >= this.state.height) {
      return null;
    }

    const imageData = layer.ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;

    return this.rgbToHex(r, g, b);
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // History Management
  saveHistory(): void {
    // Remove any history after current index
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Create history state
    const layerStates = new Map<string, ImageData>();
    for (const layer of this.state.layers) {
      const imageData = layer.ctx.getImageData(0, 0, this.state.width, this.state.height);
      layerStates.set(layer.id, imageData);
    }

    this.history.push({
      layerStates,
      timestamp: Date.now()
    });

    this.historyIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo(): boolean {
    if (this.historyIndex <= 0) return false;

    this.historyIndex--;
    this.restoreHistoryState(this.history[this.historyIndex]);
    return true;
  }

  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;

    this.historyIndex++;
    this.restoreHistoryState(this.history[this.historyIndex]);
    return true;
  }

  private restoreHistoryState(state: HistoryState): void {
    for (const layer of this.state.layers) {
      const imageData = state.layerStates.get(layer.id);
      if (imageData) {
        layer.ctx.putImageData(imageData, 0, 0);
      }
    }
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Canvas Operations
  resize(newWidth: number, newHeight: number, method: 'stretch' | 'crop' | 'expand' = 'expand', anchorX: number = 0.5, anchorY: number = 0.5): void {
    const oldWidth = this.state.width;
    const oldHeight = this.state.height;

    this.state.width = newWidth;
    this.state.height = newHeight;

    for (const layer of this.state.layers) {
      const oldImageData = layer.ctx.getImageData(0, 0, oldWidth, oldHeight);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = oldWidth;
      tempCanvas.height = oldHeight;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(oldImageData, 0, 0);

      layer.canvas.width = newWidth;
      layer.canvas.height = newHeight;

      if (method === 'stretch') {
        layer.ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
      } else if (method === 'crop') {
        const offsetX = (oldWidth - newWidth) * anchorX;
        const offsetY = (oldHeight - newHeight) * anchorY;
        layer.ctx.drawImage(tempCanvas, -offsetX, -offsetY);
      } else if (method === 'expand') {
        const offsetX = (newWidth - oldWidth) * anchorX;
        const offsetY = (newHeight - oldHeight) * anchorY;
        layer.ctx.drawImage(tempCanvas, offsetX, offsetY);
      }
    }

    this.compositeCanvas.width = newWidth;
    this.compositeCanvas.height = newHeight;

    this.saveHistory();
  }

  rotate(degrees: number): void {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));

    const newWidth = Math.round(this.state.width * cos + this.state.height * sin);
    const newHeight = Math.round(this.state.width * sin + this.state.height * cos);

    for (const layer of this.state.layers) {
      const oldImageData = layer.ctx.getImageData(0, 0, this.state.width, this.state.height);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.state.width;
      tempCanvas.height = this.state.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(oldImageData, 0, 0);

      layer.canvas.width = newWidth;
      layer.canvas.height = newHeight;

      layer.ctx.translate(newWidth / 2, newHeight / 2);
      layer.ctx.rotate(radians);
      layer.ctx.drawImage(tempCanvas, -this.state.width / 2, -this.state.height / 2);
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.state.width = newWidth;
    this.state.height = newHeight;
    this.compositeCanvas.width = newWidth;
    this.compositeCanvas.height = newHeight;

    this.saveHistory();
  }

  flip(direction: 'horizontal' | 'vertical'): void {
    for (const layer of this.state.layers) {
      const imageData = layer.ctx.getImageData(0, 0, this.state.width, this.state.height);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.state.width;
      tempCanvas.height = this.state.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(imageData, 0, 0);

      layer.ctx.clearRect(0, 0, this.state.width, this.state.height);

      if (direction === 'horizontal') {
        layer.ctx.translate(this.state.width, 0);
        layer.ctx.scale(-1, 1);
      } else {
        layer.ctx.translate(0, this.state.height);
        layer.ctx.scale(1, -1);
      }

      layer.ctx.drawImage(tempCanvas, 0, 0);
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.saveHistory();
  }

  // Composite rendering
  getCompositeCanvas(): HTMLCanvasElement {
    this.compositeCtx.clearRect(0, 0, this.state.width, this.state.height);

    for (const layer of this.state.layers) {
      if (!layer.visible) continue;

      this.compositeCtx.globalAlpha = layer.opacity / 100;
      this.compositeCtx.drawImage(layer.canvas, 0, 0);
    }

    this.compositeCtx.globalAlpha = 1;
    return this.compositeCanvas;
  }

  // Export
  exportToPNG(): string {
    return this.getCompositeCanvas().toDataURL('image/png');
  }

  exportToBMP(): string {
    // Note: Canvas doesn't natively support BMP, returning PNG
    return this.getCompositeCanvas().toDataURL('image/png');
  }

  exportToJSON(): string {
    const data = {
      width: this.state.width,
      height: this.state.height,
      layers: this.state.layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        imageData: layer.canvas.toDataURL('image/png')
      }))
    };

    return JSON.stringify(data);
  }

  // Import
  async importFromJSON(json: string): Promise<void> {
    const data = JSON.parse(json);

    this.state.width = data.width;
    this.state.height = data.height;
    this.state.layers = [];

    for (const layerData of data.layers) {
      const layer = this.addLayer(layerData.name);
      layer.visible = layerData.visible;
      layer.opacity = layerData.opacity;

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = () => {
          layer.ctx.drawImage(img, 0, 0);
          resolve(true);
        };
        img.src = layerData.imageData;
      });
    }

    this.compositeCanvas.width = this.state.width;
    this.compositeCanvas.height = this.state.height;

    this.saveHistory();
  }

  async importFromImage(imageUrl: string): Promise<void> {
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    this.state.width = img.width;
    this.state.height = img.height;
    this.state.layers = [];

    const layer = this.addLayer('Imported Image');
    layer.canvas.width = img.width;
    layer.canvas.height = img.height;
    layer.ctx.drawImage(img, 0, 0);

    this.compositeCanvas.width = img.width;
    this.compositeCanvas.height = img.height;

    this.saveHistory();
  }

  // State getters
  getState(): CanvasState {
    return { ...this.state };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.state.width, height: this.state.height };
  }

  getLayers(): Layer[] {
    return [...this.state.layers];
  }
}
