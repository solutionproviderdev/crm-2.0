'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, PencilBrush, FabricImage, Point } from 'fabric';
import type { TPointerEventInfo } from 'fabric';
import {
	Paintbrush,
	Eraser,
	Hand,
	Undo2,
	Trash2,
	Check,
	ChevronRight,
	Info,
	X,
	Minus,
	Plus,
} from 'lucide-react';

type Zone = 'lower' | 'middle' | 'upper';
type FabricCanvasWithElements = Canvas & {
	elements?: {
		lower?: { el?: HTMLCanvasElement };
		upper?: { el?: HTMLCanvasElement };
	};
};

const ZONE_COLORS: Record<Zone, string> = {
	lower: 'rgba(59,  130, 246, 0.55)',
	middle: 'rgba(16,  185, 129, 0.55)',
	upper: 'rgba(239,  68,  68, 0.55)',
};

const ZONE_SOLID: Record<Zone, string> = {
	lower: '#3B82F6',
	middle: '#10B981',
	upper: '#EF4444',
};

const ZONE_LABELS: Record<Zone, string> = {
	lower: 'Lower',
	middle: 'Counter',
	upper: 'Upper',
};

const ZONE_RGB: Record<Zone, [number, number, number]> = {
	lower: [59, 130, 246],
	middle: [16, 185, 129],
	upper: [239, 68, 68],
};

function getCanvasLayers(canvas: Canvas) {
	const withElements = canvas as FabricCanvasWithElements;
	return {
		lower: canvas.lowerCanvasEl || withElements.elements?.lower?.el,
		upper: canvas.upperCanvasEl || withElements.elements?.upper?.el,
	};
}

interface ZonePainterProps {
	imageUrl: string;
	onMasksReady: (masks: Record<Zone, Blob>) => void;
	isUploading?: boolean;
}

export default function ZonePainter({
	imageUrl,
	onMasksReady,
	isUploading,
}: ZonePainterProps) {
	const canvasElRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const fabricRef = useRef<Canvas | null>(null);
	const roRef = useRef<ResizeObserver | null>(null);
	const imgNatW = useRef(0);
	const imgNatH = useRef(0);
	const [activeZone, setActiveZone] = useState<Zone>('lower');
	const [brushSize, setBrushSize] = useState(50);
	const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'move'>(
		'brush',
	);
	const [zonesDone, setZonesDone] = useState<Set<Zone>>(new Set());
	const [hasStrokes, setHasStrokes] = useState(false);
	const [opacity, setOpacity] = useState(55);
	const [showTip, setShowTip] = useState(true);
	const activeZoneRef = useRef(activeZone);
	const activeToolRef = useRef(activeTool);
	const mountedRef = useRef(true);

	useEffect(() => {
		activeZoneRef.current = activeZone;
	}, [activeZone]);
	useEffect(() => {
		activeToolRef.current = activeTool;
	}, [activeTool]);

	// ── Resize canvas to fill container while keeping image aspect ratio ───────
	const resizeCanvas = (canvas: Canvas) => {
		const el = containerRef.current;
		if (!fabricRef.current || !el || !imgNatW.current || !imgNatH.current)
			return;
		// Reserve space for floating toolbars (top ~50px, bottom ~50px) + a bit of breathing room
		const cW = el.clientWidth - 24;
		const cH = el.clientHeight - 120;


		// Guard: layout may not be ready yet
		if (cW < 200 || cH < 150) return;
		const scale = Math.min(cW / imgNatW.current, cH / imgNatH.current, 1);
		const newW = Math.round(imgNatW.current * scale);
		const newH = Math.round(imgNatH.current * scale);

		canvas.width = newW;
		canvas.height = newH;
		const { lower, upper } = getCanvasLayers(canvas);
		const wrapper = lower?.parentElement;
		
		if (wrapper) {
			wrapper.style.width = `${newW}px`;
			wrapper.style.height = `${newH}px`;
		}
		if (lower) {
			lower.width = newW;
			lower.height = newH;
			lower.style.width = `${newW}px`;
			lower.style.height = `${newH}px`;
		}
		if (upper) {
			upper.width = newW;
			upper.height = newH;
			upper.style.width = `${newW}px`;
			upper.style.height = `${newH}px`;
		}
		canvas.calcOffset();
		const bg = canvas.backgroundImage;
		if (bg) {
			bg.set({ scaleX: scale, scaleY: scale });
		}
		canvas.requestRenderAll();
	};

	// ── Initialise Fabric canvas ──────────────────────────────────────────────
	useEffect(() => {
		mountedRef.current = true;
		if (!canvasElRef.current) return;

		const canvas = new Canvas(canvasElRef.current, {
			isDrawingMode: true,
			width: 400,
			height: 400,
		});
		fabricRef.current = canvas;

		FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then(img => {
			if (!mountedRef.current || !fabricRef.current) return;
			imgNatW.current = img.width ?? 800;
			imgNatH.current = img.height ?? 600;

			// Set the image as background first
			canvas.backgroundImage = img;

			// Try initial sizing
			const el = containerRef.current;
			if (el) {
				const cW = el.clientWidth - 24;
				const cH = el.clientHeight - 120;
				if (cW > 200 && cH > 150) {
					const scale = Math.min(cW / imgNatW.current, cH / imgNatH.current, 1);
					const newW = Math.round(imgNatW.current * scale);
					const newH = Math.round(imgNatH.current * scale);
					img.set({ scaleX: scale, scaleY: scale });
					canvas.width = newW;
					canvas.height = newH;
					const { lower, upper } = getCanvasLayers(canvas);
					const wrapper = lower?.parentElement;
					
					if (wrapper) {
						wrapper.style.width = `${newW}px`;
						wrapper.style.height = `${newH}px`;
					}
					if (lower) {
						lower.width = newW;
						lower.height = newH;
						lower.style.width = `${newW}px`;
						lower.style.height = `${newH}px`;
					}
					if (upper) {
						upper.width = newW;
						upper.height = newH;
						upper.style.width = `${newW}px`;
						upper.style.height = `${newH}px`;
					}
					canvas.calcOffset();
				}
			}
			canvas.requestRenderAll();
			canvas.backgroundImage = img;
			resizeCanvas(canvas);

			// Watch for container resize
			const ro = new ResizeObserver(() => {
				if (!containerRef.current) return;
				resizeCanvas(canvas);
			});
			if (containerRef.current) ro.observe(containerRef.current);
			roRef.current = ro;

			// Resize passes to catch late layout changes (dynamic import, flex settling)
			requestAnimationFrame(() => {
				if (mountedRef.current && fabricRef.current)
					resizeCanvas(fabricRef.current);
			});
			setTimeout(() => {
				if (mountedRef.current && fabricRef.current)
					resizeCanvas(fabricRef.current);
			}, 150);
		});

		canvas.on('path:created', () => {
			setHasStrokes(true);
			setZonesDone(prev => new Set([...prev, activeZoneRef.current]));
		});

		// ── Panning & Zooming ────────────────────────────────────────────────
		let isDragging = false;
		let lastPosX = 0;
		let lastPosY = 0;

		const onMouseDown = (opt: TPointerEventInfo) => {
			if (activeToolRef.current === 'move') {
				if (!('clientX' in opt.e)) return;
				isDragging = true;
				canvas.defaultCursor = 'grabbing';
				canvas.setCursor('grabbing');
				lastPosX = opt.e.clientX;
				lastPosY = opt.e.clientY;
			}
		};

		const onMouseMove = (opt: TPointerEventInfo) => {
			if (isDragging && activeToolRef.current === 'move') {
				if (!('clientX' in opt.e)) return;
				const vpt = canvas.viewportTransform;
				if (vpt) {
					vpt[4] += opt.e.clientX - lastPosX;
					vpt[5] += opt.e.clientY - lastPosY;
					canvas.requestRenderAll();
				}
				lastPosX = opt.e.clientX;
				lastPosY = opt.e.clientY;
			}
		};

		const onMouseUp = () => {
			if (activeToolRef.current === 'move') {
				isDragging = false;
				canvas.defaultCursor = 'grab';
				canvas.setCursor('grab');
			}
		};

		const onMouseWheel = (opt: TPointerEventInfo<WheelEvent>) => {
			const delta = opt.e.deltaY;
			let zoom = canvas.getZoom();
			zoom *= 0.999 ** delta;
			zoom = Math.max(0.5, Math.min(20, zoom));
			canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
			opt.e.preventDefault();
			opt.e.stopPropagation();
		};

		canvas.on('mouse:down', onMouseDown);
		canvas.on('mouse:move', onMouseMove);
		canvas.on('mouse:up', onMouseUp);
		canvas.on('mouse:wheel', onMouseWheel);

		return () => {
			mountedRef.current = false;
			roRef.current?.disconnect();
			roRef.current = null;
			canvas.off('mouse:down', onMouseDown);
			canvas.off('mouse:move', onMouseMove);
			canvas.off('mouse:up', onMouseUp);
			canvas.off('mouse:wheel', onMouseWheel);
			canvas.dispose();
			fabricRef.current = null;
		};
	}, [imageUrl]);

	// ── Update brush whenever settings change ─────────────────────────────────
	useEffect(() => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		if (activeTool === 'move') {
			canvas.isDrawingMode = false;
			canvas.defaultCursor = 'grab';
		} else {
			canvas.isDrawingMode = true;
			canvas.defaultCursor = 'crosshair';
			const brush = new PencilBrush(canvas);
			brush.color =
				activeTool === 'eraser'
					? 'rgba(255,255,255,1)'
					: ZONE_COLORS[activeZone].replace('0.55', (opacity / 100).toFixed(2));
			brush.width = brushSize;
			canvas.freeDrawingBrush = brush;
		}
	}, [activeZone, brushSize, activeTool, opacity]);

	const handleUndo = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		const objs = canvas.getObjects();
		if (objs.length > 0) {
			canvas.remove(objs[objs.length - 1]);
			canvas.renderAll();
			if (canvas.getObjects().length === 0) setHasStrokes(false);
		}
	};

	const handleClearAll = () => {
		const canvas = fabricRef.current;
		if (!canvas) return;
		canvas.clear();
		canvas.requestRenderAll();
		setHasStrokes(false);
		setZonesDone(new Set());
		FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then(img => {
			if (!mountedRef.current || !fabricRef.current) return;
			imgNatW.current = img.width ?? 800;
			imgNatH.current = img.height ?? 600;
			canvas.backgroundImage = img;
			resizeCanvas(canvas);
		});
	};

	// ── Export one RGBA mask per zone (OpenAI format) ────────────────────────
	const exportMasks = (): Record<Zone, Blob> => {
		const canvas = fabricRef.current!;
		const originalVpt = [...canvas.viewportTransform!];
		canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
		canvas.renderAll();

		const w = Math.round(imgNatW.current || canvas.width!);
		const h = Math.round(imgNatH.current || canvas.height!);
		const srcCanvas = canvas.lowerCanvasEl as HTMLCanvasElement;
		const scaled = document.createElement('canvas');
		scaled.width = w;
		scaled.height = h;
		const scaledCtx = scaled.getContext('2d')!;
		scaledCtx.imageSmoothingEnabled = false;
		scaledCtx.drawImage(srcCanvas, 0, 0, w, h);
		const srcData = scaledCtx.getImageData(0, 0, w, h);
		const masks: Partial<Record<Zone, Blob>> = {};

		(['lower', 'middle', 'upper'] as Zone[]).forEach(zone => {
			const off = document.createElement('canvas');
			off.width = w;
			off.height = h;
			const ctx = off.getContext('2d')!;
			const out = ctx.createImageData(w, h);
			const [zr, zg, zb] = ZONE_RGB[zone];

			for (let i = 0; i < srcData.data.length; i += 4) {
				const r = srcData.data[i],
					g = srcData.data[i + 1],
					b = srcData.data[i + 2],
					a = srcData.data[i + 3];
				const isZone =
					a > 40 &&
					Math.abs(r - zr) < 70 &&
					Math.abs(g - zg) < 70 &&
					Math.abs(b - zb) < 70;
				if (isZone) {
					out.data[i] = out.data[i + 1] = out.data[i + 2] = out.data[i + 3] = 0;
				} else {
					out.data[i] =
						out.data[i + 1] =
						out.data[i + 2] =
						out.data[i + 3] =
							255;
				}
			}

			ctx.putImageData(out, 0, 0);
			const dataUrl = off.toDataURL('image/png');
			const binary = atob(dataUrl.split(',')[1]);
			const bytes = new Uint8Array(binary.length);
			for (let k = 0; k < binary.length; k++) bytes[k] = binary.charCodeAt(k);
			masks[zone] = new Blob([bytes], { type: 'image/png' });
		});

		canvas.setViewportTransform(
			originalVpt as [number, number, number, number, number, number],
		);
		canvas.renderAll();
		return masks as Record<Zone, Blob>;
	};

	const doneCount = zonesDone.size;
	const allDone = doneCount === 3;

	const toolItems: {
		key: 'brush' | 'eraser' | 'move';
		icon: typeof Paintbrush;
		label: string;
	}[] = [
		{ key: 'brush', icon: Paintbrush, label: 'Brush' },
		{ key: 'eraser', icon: Eraser, label: 'Erase' },
		{ key: 'move', icon: Hand, label: 'Move' },
	];

	// ═══════════════════════════════════════════════════════════════════════════
	// JSX — Immersive floating-toolbar design
	// ═══════════════════════════════════════════════════════════════════════════
	return (
		<div
			ref={containerRef}
			className="relative w-full h-full overflow-hidden select-none"
			style={{
				fontFamily: 'Inter, system-ui, sans-serif',
				background: '#e8ecf0',
			}}
		>
			{/* ── CANVAS (centered, fills available space) ──────────────────────── */}
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="relative">
					<canvas
						ref={canvasElRef}
						className="rounded-lg"
						style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
					/>
					{/* Active zone color indicator strip */}
					{activeTool === 'brush' && (
						<div
							className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg pointer-events-none"
							style={{ backgroundColor: ZONE_SOLID[activeZone], opacity: 0.8 }}
						/>
					)}
				</div>
			</div>

			{/* ── TIP BANNER (below top toolbar) ────────────────────────────────── */}
			{showTip && (
				<div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-blue-600/90 backdrop-blur-xl rounded-xl shadow-lg text-xs text-white max-w-lg animate-in fade-in slide-in-from-top-2 duration-300">
					<Info className="h-3.5 w-3.5 shrink-0 opacity-80" />
					<span>
						Select a zone, then paint over that area. Cover all three zones to
						continue.
					</span>
					<button
						onClick={() => setShowTip(false)}
						className="ml-1 p-0.5 rounded hover:bg-white/20 transition shrink-0"
					>
						<X className="h-3 w-3" />
					</button>
				</div>
			)}

			{/* ── TOP TOOLBAR (floating, centered) ──────────────────────────────── */}
			<div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 px-1.5 py-1.5 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-lg shadow-black/[0.06] border border-gray-200/70">
				{/* Zone pills */}
				{(['lower', 'middle', 'upper'] as Zone[]).map(zone => {
					const isActive = activeZone === zone && activeTool !== 'eraser';
					return (
						<button
							key={zone}
							onClick={() => {
								setActiveZone(zone);
								if (activeTool === 'eraser') setActiveTool('brush');
							}}
							className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${
								isActive
									? 'bg-gray-900 text-white shadow-sm'
									: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
							}`}
						>
							<span
								className="w-2 h-2 rounded-full shrink-0 ring-1"
								style={{
									backgroundColor: ZONE_SOLID[zone],
									boxShadow: isActive
										? `0 0 6px ${ZONE_SOLID[zone]}80`
										: `0 0 0 1px ${ZONE_SOLID[zone]}40`,
								}}
							/>
							{ZONE_LABELS[zone]}
							{zonesDone.has(zone) && (
								<Check className="h-2.5 w-2.5 text-green-400" />
							)}
						</button>
					);
				})}

				<div className="w-px h-5 bg-gray-200 mx-1.5" />

				{/* Tool buttons */}
				{toolItems.map(({ key, icon: Icon, label }) => (
					<button
						key={key}
						onClick={() => setActiveTool(key)}
						title={label}
						className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${
							activeTool === key
								? 'bg-[#046288] text-white shadow-sm shadow-[#046288]/20'
								: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
						}`}
					>
						<Icon className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">{label}</span>
					</button>
				))}

				<div className="w-px h-5 bg-gray-200 mx-1.5" />

				{/* Brush size stepper */}
				<div className="flex items-center gap-1 px-1">
					<button
						onClick={() => setBrushSize(Math.max(5, brushSize - 10))}
						className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
					>
						<Minus className="h-3 w-3" />
					</button>
					<span className="text-[10px] font-black text-gray-500 w-7 text-center tabular-nums">
						{brushSize}
					</span>
					<button
						onClick={() => setBrushSize(Math.min(200, brushSize + 10))}
						className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
					>
						<Plus className="h-3 w-3" />
					</button>
				</div>

				<div className="w-px h-5 bg-gray-200 mx-1.5 hidden sm:block" />

				{/* Opacity (compact) */}
				<div className="hidden sm:flex items-center gap-1.5 px-1.5">
					<span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
						Op
					</span>
					<input
						type="range"
						min={20}
						max={100}
						value={opacity}
						onChange={e => setOpacity(Number(e.target.value))}
						className="w-14 h-1 accent-[#046288] cursor-pointer"
					/>
					<span className="text-[10px] font-bold text-gray-500 w-6 tabular-nums">
						{opacity}%
					</span>
				</div>
			</div>

			{/* ── BOTTOM BAR (floating) ─────────────────────────────────────────── */}
			<div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-3">
				{/* Left cluster: undo / clear */}
				<div className="flex items-center gap-1 px-1.5 py-1.5 bg-white/95 backdrop-blur-2xl rounded-xl shadow-lg shadow-black/[0.06] border border-gray-200/70">
					<button
						onClick={handleUndo}
						disabled={!hasStrokes}
						className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
					>
						<Undo2 className="h-3.5 w-3.5" /> Undo
					</button>
					<button
						onClick={handleClearAll}
						disabled={!hasStrokes}
						className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
					>
						<Trash2 className="h-3.5 w-3.5" /> Clear
					</button>
				</div>

				{/* Center: zone progress dots */}
				<div className="flex items-center gap-3 px-4 py-2 bg-white/95 backdrop-blur-2xl rounded-xl shadow-lg shadow-black/[0.06] border border-gray-200/70">
					{(['lower', 'middle', 'upper'] as Zone[]).map(z => (
						<div key={z} className="flex items-center gap-1.5">
							<span
								className={`w-2 h-2 rounded-full transition-all duration-300 ${
									zonesDone.has(z) ? 'scale-110' : 'opacity-40'
								}`}
								style={{ backgroundColor: ZONE_SOLID[z] }}
							/>
							<span
								className={`text-[10px] font-bold transition-colors ${
									zonesDone.has(z) ? 'text-gray-800' : 'text-gray-400'
								}`}
							>
								{zonesDone.has(z) ? '✓' : '○'}
							</span>
						</div>
					))}
					<span className="text-[10px] font-black text-gray-400 ml-1">
						{doneCount}/3
					</span>
				</div>

				{/* Right: Continue button */}
				<button
					onClick={() => onMasksReady(exportMasks())}
					disabled={isUploading || doneCount === 0}
					className={`flex items-center gap-2 pl-5 pr-4 py-2.5 rounded-xl text-sm font-black shadow-lg transition-all duration-300 ${
						allDone
							? 'bg-[#046288] hover:bg-[#034e6d] text-white shadow-[#046288]/25 hover:scale-[1.03] active:scale-[0.97]'
							: doneCount > 0
								? 'bg-white/95 backdrop-blur-2xl text-[#046288] border border-[#046288]/20 hover:bg-[#046288]/5 shadow-black/[0.06]'
								: 'bg-white/80 text-gray-300 border border-gray-200/60 cursor-not-allowed shadow-none'
					}`}
				>
					{isUploading
						? 'Uploading…'
						: allDone
							? 'Continue'
							: `Continue (${doneCount}/3)`}
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
