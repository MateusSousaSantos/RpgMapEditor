// src/components/ColorWheel.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ColorWheelProps {
  color: string;
  onChange: (color: string) => void;
  size?: number;
  className?: string;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  color,
  onChange,
  size = 120,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const centerRef = useRef({ x: 0, y: 0 });

  // Convert HSV to RGB
  const hsvToRgb = useCallback((h: number, s: number, v: number) => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return { r, g, b };
  }, []);

  // Convert RGB to HSV
  const rgbToHsv = useCallback((r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : diff / max;
    const v = max;

    return { h, s, v };
  }, []);

  // Convert hex to RGB
  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }, []);

  // Convert RGB to hex
  const rgbToHex = useCallback((r: number, g: number, b: number) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }, []);

  // Draw the color wheel
  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    centerRef.current = { x: centerX, y: centerY };

    ctx.clearRect(0, 0, size, size);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      for (let r = 0; r < radius; r += 1) {
        const hue = angle;
        const saturation = r / radius;
        const value = 1;
        
        const { r: red, g: green, b: blue } = hsvToRgb(hue, saturation, value);
        
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.beginPath();
        const x = centerX + Math.cos((angle * Math.PI) / 180) * r;
        const y = centerY + Math.sin((angle * Math.PI) / 180) * r;
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw current color indicator
    const currentRgb = hexToRgb(color);
    const currentHsv = rgbToHsv(currentRgb.r, currentRgb.g, currentRgb.b);
    
    const indicatorRadius = (currentHsv.s * radius);
    const indicatorX = centerX + Math.cos((currentHsv.h * Math.PI) / 180) * indicatorRadius;
    const indicatorY = centerY + Math.sin((currentHsv.h * Math.PI) / 180) * indicatorRadius;

    // Draw indicator
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 4, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 4, 0, 2 * Math.PI);
    ctx.stroke();
  }, [size, color, hsvToRgb, rgbToHsv, hexToRgb]);

  // Handle mouse events
  const handleMouseEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = centerRef.current.x;
    const centerY = centerRef.current.y;
    const radius = size / 2 - 10;

    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= radius) {
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;

      const saturation = Math.min(distance / radius, 1);
      const value = 1;

      const { r, g, b } = hsvToRgb(angle, saturation, value);
      const newColor = rgbToHex(r, g, b);
      
      onChange(newColor);
    }
  }, [size, onChange, hsvToRgb, rgbToHex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseEvent(e);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleMouseEvent(e);
    }
  }, [isDragging, handleMouseEvent]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    drawColorWheel();
  }, [drawColorWheel]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-pointer rounded-full border border-slate-600"
        onMouseDown={handleMouseDown}
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-2 text-center">
        <div 
          className="w-8 h-8 mx-auto rounded border border-slate-600"
          style={{ backgroundColor: color }}
        />
        <div className="text-xs text-slate-400 mt-1 font-mono">
          {color.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// Simple color picker with preset colors
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  className = '',
}) => {
  const presetColors = [
    '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#000000',
    '#808080', '#800000', '#008000', '#000080',
    '#808000', '#800080', '#008080', '#c0c0c0',
    '#ff8000', '#8000ff', '#00ff80', '#ff0080',
    '#80ff00', '#0080ff', '#ffc000', '#c000ff'
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <ColorWheel color={color} onChange={onChange} size={100} />
      <div className="grid grid-cols-6 gap-1">
        {presetColors.map((presetColor) => (
          <button
            key={presetColor}
            className={`w-6 h-6 rounded border ${
              color === presetColor 
                ? 'border-blue-400 ring-1 ring-blue-400' 
                : 'border-slate-600 hover:border-slate-400'
            }`}
            style={{ backgroundColor: presetColor }}
            onClick={() => onChange(presetColor)}
            title={presetColor}
          />
        ))}
      </div>
    </div>
  );
};