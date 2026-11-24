import React, {useId} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FUENTE_MANO} from '../lib/fuente';
import {useEscena} from '../lib/escena';

/**
 * Estilo "pizarra blanca": todo es SVG (1080×1920) dibujado con trazos de marcador que se
 * dibujan solos (pathLength + dashoffset), con toques de amarillo y rojo. Incluye el personaje
 * de palitos, el cerebro con su "circuito de recompensa" y una lamparita.
 * Los subtítulos van abajo: dejar libre desde y ≈ 1360.
 */

export const NEGRO = '#1D1D24';
export const AMARILLO = '#FFD23F';
export const ROJO = '#E63946';
export const GRIS = '#A3A3AD';

type P2 = [number, number];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Progreso 0..1 de algo que empieza en `desde` y dura `dur` frames. */
export const avance = (frame: number, desde: number, dur: number) =>
	interpolate(frame, [desde, desde + Math.max(1, dur)], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});

/** Sub-tramo de un progreso: cuánto avanzó entre a y b (0..1). */
export const tramo = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

/** Elipse como path (para poder dibujarla con un trazo). */
export const elipse = (cx: number, cy: number, rx: number, ry = rx) =>
	`M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;

/** Rectángulo con puntas redondeadas como path. */
export const rectangulo = (x: number, y: number, w: number, h: number, r = 18) =>
	`M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;

/** Pizarra con fondo blanco, manchitas de borrador y un acercamiento lento ("cámara"). */
export const Pizarra: React.FC<{children: React.ReactNode; overlay?: React.ReactNode; zoom?: [number, number]; foco?: P2}> = ({
	children,
	overlay,
	zoom = [1, 1.05],
	foco = [540, 760],
}) => {
	const frame = useCurrentFrame();
	const {duracion} = useEscena();
	const k = frame / Math.max(1, duracion);
	const s = zoom[0] + (zoom[1] - zoom[0]) * k;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 42%, #FFFFFF 0%, #F8F8F3 62%, #EDEDE5 100%)'}}>
			<svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<filter id="marcador" x="-5%" y="-5%" width="110%" height="110%">
						<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" />
						<feDisplacementMap in="SourceGraphic" scale="3.2" />
					</filter>
					<filter id="difuso" x="-60%" y="-60%" width="220%" height="220%">
						<feGaussianBlur stdDeviation="18" />
					</filter>
				</defs>
				{/* rastros de borrador de otras clases */}
				<g opacity={0.045} fill="#55555F">
					<ellipse cx={220} cy={330} rx={190} ry={40} transform="rotate(-8 220 330)" />
					<ellipse cx={860} cy={1180} rx={170} ry={36} transform="rotate(6 860 1180)" />
					<ellipse cx={760} cy={240} rx={120} ry={26} />
				</g>
				<g transform={`translate(${foco[0] * (1 - s)} ${foco[1] * (1 - s)}) scale(${s})`} filter="url(#marcador)">
					{children}
				</g>
			</svg>
			{overlay}
		</AbsoluteFill>
	);
};

/** Trazo de marcador que se dibuja solo (p: 0..1). */
export const Trazo: React.FC<{d: string; p: number; color?: string; ancho?: number; opacidad?: number}> = ({d, p, color = NEGRO, ancho = 8, opacidad = 1}) =>
	p <= 0.001 ? null : (
		<path
			d={d}
			pathLength={1}
			fill="none"
			stroke={color}
			strokeWidth={ancho}
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeDasharray="1 1"
			strokeDashoffset={1 - Math.min(1, p)}
			opacity={opacidad}
		/>
	);

/** Flecha que se dibuja sola, de `desde` a `hasta` con una curva (desvío perpendicular en px). */
export const Flecha: React.FC<{desde: P2; hasta: P2; curva?: number; p: number; color?: string; ancho?: number; punta?: number}> = ({
	desde,
	hasta,
	curva = 0,
	p,
	color = NEGRO,
	ancho = 8,
	punta = 30,
}) => {
	if (p <= 0.001) return null;
	const mx = (desde[0] + hasta[0]) / 2;
	const my = (desde[1] + hasta[1]) / 2;
	const dx = hasta[0] - desde[0];
	const dy = hasta[1] - desde[1];
	const largo = Math.hypot(dx, dy) || 1;
	const cx = mx + (-dy / largo) * curva;
	const cy = my + (dx / largo) * curva;
	const ang = Math.atan2(hasta[1] - cy, hasta[0] - cx);
	const k = tramo(p, 0.75, 1);
	const ala = (s: number): P2 => [hasta[0] - Math.cos(ang + s * 0.5) * punta, hasta[1] - Math.sin(ang + s * 0.5) * punta];
	const a1 = ala(1);
	const a2 = ala(-1);
	return (
		<g>
			<Trazo d={`M ${desde[0]} ${desde[1]} Q ${cx} ${cy} ${hasta[0]} ${hasta[1]}`} p={tramo(p, 0, 0.8)} color={color} ancho={ancho} />
			<Trazo d={`M ${a1[0]} ${a1[1]} L ${hasta[0]} ${hasta[1]} L ${a2[0]} ${a2[1]}`} p={k} color={color} ancho={ancho} />
		</g>
	);
};

/** Texto a mano que se escribe letra por letra. `ancla`: el x es el centro (por defecto) o el comienzo. */
export const Texto: React.FC<{
	x: number;
	y: number;
	texto: string;
	p: number;
	tam?: number;
	color?: string;
	ancla?: 'centro' | 'inicio';
	rotar?: number;
	negrita?: boolean;
}> = ({x, y, texto, p, tam = 56, color = NEGRO, ancla = 'centro', rotar = 0, negrita = false}) => {
	if (p <= 0.001) return null;
	const n = Math.ceil(Math.min(1, p) * texto.length);
	const ancho = texto.length * tam * 0.44;
	const x0 = ancla === 'centro' ? x - ancho / 2 : x;
	return (
		<text
			x={x0}
			y={y}
			fontFamily={FUENTE_MANO}
			fontSize={tam}
			fill={color}
			stroke={negrita ? color : 'none'}
			strokeWidth={negrita ? tam * 0.03 : 0}
			transform={rotar ? `rotate(${rotar} ${x} ${y})` : undefined}
		>
			{texto.slice(0, n)}
		</text>
	);
};

/** Relleno a garabatos (como con resaltador) dentro de una forma. */
export const Garabato: React.FC<{forma: string; caja: [number, number, number, number]; p: number; color?: string; paso?: number; opacidad?: number}> = ({
	forma,
	caja,
	p,
	color = AMARILLO,
	paso = 26,
	opacidad = 0.9,
}) => {
	const id = useId().replace(/:/g, '');
	if (p <= 0.001) return null;
	const [x, y, w, h] = caja;
	const puntos: string[] = [];
	for (let i = 0; i * paso <= w + h + 60; i++) {
		const xa = x + i * paso;
		puntos.push(i % 2 === 0 ? `${xa} ${y - 10}` : `${xa - h - 20} ${y + h + 10}`);
	}
	return (
		<g>
			<clipPath id={`gar-${id}`}>
				<path d={forma} />
			</clipPath>
			<g clipPath={`url(#gar-${id})`}>
				<Trazo d={`M ${puntos.join(' L ')}`} p={p} color={color} ancho={paso * 1.5} opacidad={opacidad} />
			</g>
		</g>
	);
};

/** Halo difuso de color (para lo que "se enciende"). */
export const Brillo: React.FC<{x: number; y: number; r: number; intensidad: number; color?: string}> = ({x, y, r, intensidad, color = AMARILLO}) =>
	intensidad <= 0.01 ? null : <circle cx={x} cy={y} r={r} fill={color} opacity={Math.min(1, intensidad)} filter="url(#difuso)" />;

/** Tilde (✓) dibujado. */
export const Tilde: React.FC<{x: number; y: number; p: number; tam?: number; color?: string}> = ({x, y, p, tam = 40, color = NEGRO}) => (
	<Trazo d={`M ${x - tam * 0.5} ${y} L ${x - tam * 0.12} ${y + tam * 0.4} L ${x + tam * 0.6} ${y - tam * 0.5}`} p={p} color={color} ancho={9} />
);

/** Cruz (✗) roja dibujada. */
export const Cruz: React.FC<{x: number; y: number; p: number; tam?: number; color?: string; ancho?: number}> = ({x, y, p, tam = 120, color = ROJO, ancho = 14}) => (
	<g>
		<Trazo d={`M ${x - tam} ${y - tam} L ${x + tam} ${y + tam}`} p={tramo(p, 0, 0.5)} color={color} ancho={ancho} />
		<Trazo d={`M ${x + tam} ${y - tam} L ${x - tam} ${y + tam}`} p={tramo(p, 0.5, 1)} color={color} ancho={ancho} />
	</g>
);

/** Signo de pregunta dibujado (centro de la curva en x, y). */
export const Pregunta: React.FC<{x: number; y: number; p: number; tam?: number; color?: string; ancho?: number}> = ({x, y, p, tam = 1, color = NEGRO, ancho = 12}) => (
	<g transform={`translate(${x} ${y}) scale(${tam})`}>
		<Trazo d="M -42 -40 C -42 -100 48 -104 48 -46 C 48 -8 2 -6 2 34 L 2 52" p={tramo(p, 0, 0.85)} color={color} ancho={ancho / tam} />
		{p > 0.9 ? <circle cx={2} cy={86} r={10 / Math.sqrt(tam)} fill={color} /> : null}
	</g>
);

/** Nube de pensamiento (contorno) con burbujitas hacia `cola`. */
export const NubePensamiento: React.FC<{x: number; y: number; w: number; h: number; p: number; cola?: P2}> = ({x, y, w, h, p, cola}) => {
	const rx = w / 2;
	const ry = h / 2;
	const bultos = 9;
	let d = '';
	for (let i = 0; i <= bultos; i++) {
		const a = (i / bultos) * Math.PI * 2;
		const px = x + Math.cos(a) * rx;
		const py = y + Math.sin(a) * ry;
		if (i === 0) d += `M ${px} ${py}`;
		else {
			const am = ((i - 0.5) / bultos) * Math.PI * 2;
			d += ` Q ${x + Math.cos(am) * rx * 1.25} ${y + Math.sin(am) * ry * 1.25} ${px} ${py}`;
		}
	}
	return (
		<g>
			<Trazo d={d} p={tramo(p, 0, 0.8)} />
			{cola
				? [0, 1, 2].map((i) => {
						const k = 0.3 + i * 0.28;
						const bx = x + (cola[0] - x) * k;
						const by = y + ry * 0.9 + (cola[1] - y - ry * 0.9) * k;
						return <Trazo key={i} d={elipse(bx, by, 22 - i * 6)} p={tramo(p, 0.75 + i * 0.08, 0.85 + i * 0.08)} ancho={6} />;
					})
				: null}
		</g>
	);
};

// ---------- caras expresivas ----------

export type CaraPalito =
	| 'neutra'
	| 'sonrisa'
	| 'triste'
	| 'plana'
	| 'preocupada'
	| 'o'
	| 'feliz'
	| 'agotado'
	| 'enojado'
	| 'asustado'
	| 'culpable'
	| 'guino'
	| 'bostezo'
	| 'dormido'
	| 'mareado'
	| 'alerta'
	| 'fastidio';

type TipoOjo = 'punto' | 'feliz' | 'cerrado' | 'grande' | 'enorme' | 'pesado' | 'espiral';
type TipoCeja = 'enojada' | 'preocupada' | 'arriba' | 'plana' | null;
type TipoBoca =
	| 'neutra'
	| 'sonrisa'
	| 'triste'
	| 'plana'
	| 'ondita'
	| 'o'
	| 'risa'
	| 'grito'
	| 'bostezo'
	| 'dientes'
	| 'mareada'
	| 'chica'
	| 'costado'
	| 'lengua'
	| 'jadeo';

const RASGOS: Record<CaraPalito, {ojoI: TipoOjo; ojoD: TipoOjo; ceja: TipoCeja; boca: TipoBoca; ojeras?: boolean}> = {
	neutra: {ojoI: 'punto', ojoD: 'punto', ceja: null, boca: 'neutra'},
	sonrisa: {ojoI: 'punto', ojoD: 'punto', ceja: null, boca: 'sonrisa'},
	triste: {ojoI: 'punto', ojoD: 'punto', ceja: 'preocupada', boca: 'triste'},
	plana: {ojoI: 'punto', ojoD: 'punto', ceja: null, boca: 'plana'},
	preocupada: {ojoI: 'punto', ojoD: 'punto', ceja: 'preocupada', boca: 'ondita'},
	o: {ojoI: 'punto', ojoD: 'punto', ceja: null, boca: 'o'},
	feliz: {ojoI: 'feliz', ojoD: 'feliz', ceja: null, boca: 'risa'},
	agotado: {ojoI: 'pesado', ojoD: 'pesado', ceja: 'preocupada', boca: 'jadeo', ojeras: true},
	enojado: {ojoI: 'punto', ojoD: 'punto', ceja: 'enojada', boca: 'triste'},
	asustado: {ojoI: 'grande', ojoD: 'grande', ceja: 'arriba', boca: 'grito'},
	culpable: {ojoI: 'punto', ojoD: 'punto', ceja: 'preocupada', boca: 'dientes'},
	guino: {ojoI: 'punto', ojoD: 'feliz', ceja: null, boca: 'lengua'},
	bostezo: {ojoI: 'cerrado', ojoD: 'cerrado', ceja: 'plana', boca: 'bostezo'},
	dormido: {ojoI: 'cerrado', ojoD: 'cerrado', ceja: null, boca: 'chica'},
	mareado: {ojoI: 'espiral', ojoD: 'espiral', ceja: null, boca: 'mareada'},
	alerta: {ojoI: 'enorme', ojoD: 'enorme', ceja: 'arriba', boca: 'dientes'},
	fastidio: {ojoI: 'pesado', ojoD: 'pesado', ceja: 'plana', boca: 'costado'},
};

const espiral = (cx: number, cy: number, r: number) => {
	let d = `M ${cx} ${cy}`;
	for (let i = 1; i <= 28; i++) {
		const a = i * 0.62;
		const rr = (r * i) / 28;
		d += ` L ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
	}
	return d;
};

/**
 * Cara dibujada para una cabeza redonda de radio ~37 centrada en (0, 0).
 * `mirar`: hacia dónde miran las pupilas (-1..1 en x e y).
 */
export const Cara: React.FC<{cara: CaraPalito; color?: string; mirar?: P2; ojeras?: boolean}> = ({cara, color = NEGRO, mirar, ojeras}) => {
	const r = RASGOS[cara];
	const [mx, my] = mirar ?? (cara === 'culpable' ? [0.9, -0.3] : [0, 0]);
	const linea = {fill: 'none', stroke: color, strokeWidth: 4.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	const ojo = (lado: -1 | 1, tipo: TipoOjo) => {
		const x = lado * 13;
		const y = -6;
		switch (tipo) {
			case 'feliz':
				return <path key={lado} d={`M ${x - 7} ${y + 3} Q ${x} ${y - 8} ${x + 7} ${y + 3}`} {...linea} />;
			case 'cerrado':
				return <path key={lado} d={`M ${x - 7} ${y - 1} Q ${x} ${y + 5} ${x + 7} ${y - 1}`} {...linea} />;
			case 'grande':
				return (
					<g key={lado}>
						<circle cx={x} cy={y - 2} r={9.5} fill="#FFFFFF" stroke={color} strokeWidth={3.5} />
						<circle cx={x + mx * 4} cy={y - 2 + my * 4} r={3.8} fill={color} />
					</g>
				);
			case 'enorme':
				return (
					<g key={lado}>
						<circle cx={x} cy={y - 3} r={12} fill="#FFFFFF" stroke={color} strokeWidth={3.5} />
						<circle cx={x + mx * 5} cy={y - 3 + my * 5} r={2.6} fill={color} />
					</g>
				);
			case 'pesado':
				return (
					<g key={lado}>
						<path d={`M ${x - 8.5} ${y - 1} A 8.5 8.5 0 0 0 ${x + 8.5} ${y - 1} Z`} fill="#FFFFFF" stroke={color} strokeWidth={3.5} />
						<circle cx={x + mx * 3} cy={y + 3} r={3.3} fill={color} />
						<path d={`M ${x - 10} ${y - 1.5} L ${x + 10} ${y - 1.5}`} {...linea} strokeWidth={5} />
					</g>
				);
			case 'espiral':
				return <path key={lado} d={espiral(x, y, 9)} {...linea} strokeWidth={3.2} />;
			default:
				return <circle key={lado} cx={x + mx * 4} cy={y + my * 3} r={4.5} fill={color} />;
		}
	};
	const ceja = (lado: -1 | 1) => {
		switch (r.ceja) {
			case 'enojada':
				return <path key={lado} d={`M ${lado * 23} -24 L ${lado * 5} -15`} {...linea} strokeWidth={5} />;
			case 'preocupada':
				return <path key={lado} d={`M ${lado * 21} -16 L ${lado * 6} -22`} {...linea} />;
			case 'arriba':
				return <path key={lado} d={`M ${lado * 22} -24 Q ${lado * 13} -31 ${lado * 4} -25`} {...linea} />;
			case 'plana':
				return <path key={lado} d={`M ${lado * 21} -19 L ${lado * 6} -19`} {...linea} />;
			default:
				return null;
		}
	};
	const boca = (() => {
		switch (r.boca) {
			case 'sonrisa':
				return <path d="M -15 8 Q 0 26 15 8" {...linea} strokeWidth={5} />;
			case 'triste':
				return <path d="M -14 21 Q 0 7 14 21" {...linea} strokeWidth={5} />;
			case 'plana':
				return <path d="M -13 14 L 13 14" {...linea} strokeWidth={5} />;
			case 'ondita':
				return <path d="M -15 16 q 7.5 -7 15 0 q 7.5 7 15 0" {...linea} strokeWidth={5} />;
			case 'o':
				return <circle cx={0} cy={15} r={6} fill="none" stroke={color} strokeWidth={5} />;
			case 'risa':
				return (
					<g>
						<path d="M -17 7 Q 0 34 17 7 Z" fill={color} stroke={color} strokeWidth={3} strokeLinejoin="round" />
						<path d="M -8 19 Q 0 27 8 19 Q 0 15 -8 19 Z" fill={ROJO} />
					</g>
				);
			case 'grito':
				return <ellipse cx={0} cy={17} rx={7.5} ry={10} fill={color} />;
			case 'bostezo':
				return (
					<g>
						<ellipse cx={0} cy={16} rx={11} ry={15} fill={color} />
						<ellipse cx={0} cy={24} rx={6} ry={4.5} fill={ROJO} />
					</g>
				);
			case 'dientes':
				return (
					<g>
						<rect x={-16} y={8} width={32} height={14} rx={5} fill="#FFFFFF" stroke={color} strokeWidth={3.5} />
						<path d="M -16 15 L 16 15 M -6 8 L -6 22 M 5 8 L 5 22" fill="none" stroke={color} strokeWidth={2.6} />
					</g>
				);
			case 'mareada':
				return <path d="M -17 16 q 4.25 -6 8.5 0 q 4.25 6 8.5 0 q 4.25 -6 8.5 0 q 4.25 6 8.5 0" {...linea} strokeWidth={4.5} />;
			case 'chica':
				return <path d="M -8 14 Q 0 20 8 14" {...linea} />;
			case 'costado':
				return <path d="M -3 17 L 14 13" {...linea} strokeWidth={5} />;
			case 'lengua':
				return (
					<g>
						<path d="M -15 8 Q 0 26 15 8" {...linea} strokeWidth={5} />
						<path d="M 2 15.5 Q 4 26 10 25 Q 15 23 12 12" fill={ROJO} stroke={color} strokeWidth={3} strokeLinejoin="round" />
					</g>
				);
			case 'jadeo':
				return (
					<g>
						<ellipse cx={0} cy={17} rx={9} ry={7} fill={color} />
						<path d="M -4 20 Q -5 32 1 32 Q 7 32 6 20 Z" fill={ROJO} stroke={color} strokeWidth={2.5} />
					</g>
				);
			default:
				return <path d="M -12 14 Q 0 20 12 14" {...linea} strokeWidth={5} />;
		}
	})();
	return (
		<g>
			{ojeras || r.ojeras
				? ([-1, 1] as const).map((lado) => (
						<g key={`oj${lado}`}>
							<path d={`M ${lado * 13 - 11} 2 Q ${lado * 13} 19 ${lado * 13 + 11} 2 Q ${lado * 13} 9 ${lado * 13 - 11} 2 Z`} fill="#6E6A9E" opacity={0.55} />
							<path d={`M ${lado * 13 - 12} 9 Q ${lado * 13} 24 ${lado * 13 + 12} 9`} fill="none" stroke="#6E6A9E" strokeWidth={3} opacity={0.7} strokeLinecap="round" />
						</g>
					))
				: null}
			{ojo(-1, r.ojoI)}
			{ojo(1, r.ojoD)}
			{ceja(-1)}
			{ceja(1)}
			{boca}
		</g>
	);
};

// ---------- sol y luna (figuras recurrentes) ----------

export const AZUL = '#2F6FE4';
export const AZUL_CLARO = '#A9C8FF';
export const ROSA = '#FF8FAB';

/** Cabeza/cuerpo de sol: círculo amarillo con rayos (radio 40). `giro` rota los rayos. */
const CuerpoSol: React.FC<{p: number; giro?: number; brillo?: number; ancho?: number}> = ({p, giro = 0, brillo = 0.5, ancho = 7}) => (
	<g>
		<Brillo x={0} y={0} r={70} intensidad={brillo * tramo(p, 0.5, 1)} />
		<Garabato forma={elipse(0, 0, 40)} caja={[-44, -44, 88, 88]} p={tramo(p, 0.3, 0.9)} paso={14} opacidad={0.95} />
		<Trazo d={elipse(0, 0, 40)} p={tramo(p, 0, 0.5)} ancho={ancho} />
		<g transform={`rotate(${giro})`}>
			{new Array(12).fill(0).map((_, i) => {
				const a = (i / 12) * Math.PI * 2;
				const r0 = 52;
				const r1 = i % 2 === 0 ? 72 : 64;
				return (
					<Trazo
						key={i}
						d={`M ${(Math.cos(a) * r0).toFixed(1)} ${(Math.sin(a) * r0).toFixed(1)} L ${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)}`}
						p={tramo(p, 0.4 + i * 0.04, 0.55 + i * 0.04)}
						color={i % 2 === 0 ? '#F2B600' : NEGRO}
						ancho={i % 2 === 0 ? ancho * 1.5 : ancho * 0.9}
					/>
				);
			})}
		</g>
	</g>
);

/** Medialuna (radio 44) que mira a la derecha; la cara va del lado de adentro. */
export const MEDIALUNA = 'M 14.44 -41.58 A 44 44 0 1 0 34.92 26.76 A 36 36 0 1 1 14.44 -41.58 Z';

const CaraLuna: React.FC<{cara: CaraPalito}> = ({cara}) => {
	const r = RASGOS[cara];
	const linea = {fill: 'none', stroke: NEGRO, strokeWidth: 4.5, strokeLinecap: 'round' as const};
	const ojo = (() => {
		switch (r.ojoD) {
			case 'cerrado':
				return <path d="M -32 -13 Q -25 -6 -18 -13" {...linea} />;
			case 'feliz':
				return <path d="M -32 -10 Q -25 -19 -18 -10" {...linea} />;
			case 'pesado':
				return (
					<g>
						<path d="M -33 -14 A 7.5 7.5 0 0 0 -18 -14 Z" fill="#FFFFFF" stroke={NEGRO} strokeWidth={3.2} />
						<circle cx={-24} cy={-10.5} r={3} fill={NEGRO} />
						<path d="M -35 -14.5 L -16 -14.5" {...linea} strokeWidth={5} />
					</g>
				);
			case 'grande':
			case 'enorme':
				return (
					<g>
						<circle cx={-25} cy={-14} r={8.5} fill="#FFFFFF" stroke={NEGRO} strokeWidth={3.2} />
						<circle cx={-22} cy={-14} r={3.2} fill={NEGRO} />
					</g>
				);
			default:
				return <circle cx={-24} cy={-13} r={4.2} fill={NEGRO} />;
		}
	})();
	const ceja =
		r.ceja === 'enojada' ? (
			<path d="M -35 -30 L -16 -22" {...linea} strokeWidth={5} />
		) : r.ceja === 'preocupada' ? (
			<path d="M -34 -23 L -17 -29" {...linea} />
		) : r.ceja === 'plana' ? (
			<path d="M -34 -25 L -17 -25" {...linea} />
		) : null;
	const boca = (() => {
		switch (r.boca) {
			case 'triste':
				return <path d="M -29 21 Q -21 13 -13 19" {...linea} />;
			case 'bostezo':
			case 'grito':
				return <ellipse cx={-21} cy={17} rx={6} ry={8.5} fill={NEGRO} />;
			case 'plana':
			case 'costado':
				return <path d="M -28 18 L -13 15" {...linea} />;
			case 'risa':
				return <path d="M -30 12 Q -22 28 -12 15 Z" fill={NEGRO} stroke={NEGRO} strokeWidth={2.5} strokeLinejoin="round" />;
			default:
				return <path d="M -29 13 Q -22 23 -12 16" {...linea} />;
		}
	})();
	return (
		<g>
			<ellipse cx={-33} cy={3} rx={6} ry={4} fill={ROSA} opacity={0.7} />
			{ojo}
			{ceja}
			{boca}
		</g>
	);
};

/** Luna dibujada (medialuna azul con cara). `voltear` la hace mirar a la izquierda. */
export const LunaPizarra: React.FC<{x: number; y: number; p: number; escala?: number; cara?: CaraPalito; voltear?: boolean; gorro?: boolean; brillo?: number}> = ({
	x,
	y,
	p,
	escala = 1,
	cara = 'dormido',
	voltear = false,
	gorro = false,
	brillo = 0.35,
}) => {
	if (p <= 0.001) return null;
	const a = 7 / Math.sqrt(escala);
	return (
		<g transform={`translate(${x} ${y}) scale(${voltear ? -escala : escala} ${escala})`}>
			<Brillo x={-10} y={0} r={60} intensidad={brillo * tramo(p, 0.5, 1)} color={AZUL_CLARO} />
			<Garabato forma={MEDIALUNA} caja={[-46, -46, 84, 76]} p={tramo(p, 0.3, 0.9)} color={AZUL_CLARO} paso={12} opacidad={0.95} />
			<Trazo d={MEDIALUNA} p={tramo(p, 0, 0.6)} ancho={a} />
			{gorro ? <Gorro p={tramo(p, 0.5, 0.9)} x={-8} y={-30} rot={-28} /> : null}
			{p > 0.75 ? (
				<g opacity={tramo(p, 0.75, 1)}>
					<CaraLuna cara={cara} />
				</g>
			) : null}
		</g>
	);
};

/** Sol dibujado con cara. */
export const SolPizarra: React.FC<{x: number; y: number; p: number; escala?: number; cara?: CaraPalito | null; giro?: number; brillo?: number; mirar?: P2}> = ({
	x,
	y,
	p,
	escala = 1,
	cara = 'sonrisa',
	giro = 0,
	brillo = 0.5,
	mirar,
}) => {
	if (p <= 0.001) return null;
	return (
		<g transform={`translate(${x} ${y}) scale(${escala})`}>
			<CuerpoSol p={p} giro={giro} brillo={brillo} ancho={7 / Math.sqrt(escala)} />
			{cara && p > 0.75 ? (
				<g opacity={tramo(p, 0.75, 1)}>
					<Cara cara={cara} mirar={mirar} />
				</g>
			) : null}
		</g>
	);
};

/** Gorro de dormir (con pompón) apoyado en (x, y). */
const Gorro: React.FC<{p: number; x?: number; y?: number; rot?: number}> = ({p, x = 0, y = -30, rot = 0}) => {
	if (p <= 0.001) return null;
	const forma = 'M -34 6 Q -30 -44 40 -62 Q 14 -28 34 6 Z';
	return (
		<g transform={`translate(${x} ${y}) rotate(${rot})`}>
			<Garabato forma={forma} caja={[-36, -64, 80, 72]} p={p} color={AZUL} paso={12} opacidad={0.55} />
			<Trazo d={forma} p={p} ancho={6} />
			<Trazo d="M -38 6 Q 0 14 38 6" p={p} ancho={9} />
			{p > 0.8 ? <circle cx={42} cy={-64} r={10} fill="#FFFFFF" stroke={NEGRO} strokeWidth={5} /> : null}
		</g>
	);
};

// ---------- personaje de palitos ----------

export type PosePalito = {brazoI: P2; brazoD: P2; piernaI: P2; piernaD: P2};
/** Ángulos en grados: [hombro, codo]. 0 = hacia abajo; positivo = hacia afuera; 180 = hacia arriba. */
export const POSE_PARADO: PosePalito = {brazoI: [24, 8], brazoD: [24, 8], piernaI: [12, 0], piernaD: [12, 0]};
export const POSE_MANOS_CABEZA: PosePalito = {brazoI: [140, 50], brazoD: [140, 50], piernaI: [12, 0], piernaD: [12, 0]};
export const POSE_BRAZOS_CRUZADOS: Partial<PosePalito> = {brazoI: [32, -150], brazoD: [32, -150]};
/** Pose de carrera según la fase (radianes): piernas y brazos alternados. */
export const poseCorrer = (fase: number, amplitud = 1): PosePalito => {
	const s = Math.sin(fase) * amplitud;
	return {
		piernaI: [12 + 38 * s, 30 * Math.max(0, s)],
		piernaD: [12 - 38 * s, 30 * Math.max(0, -s)],
		brazoI: [40 - 45 * s, -70],
		brazoD: [40 + 45 * s, -70],
	};
};

const extremidad = (lado: number, origen: P2, ang: P2, l1: number, l2: number): [P2, P2] => {
	const a1 = (ang[0] * Math.PI) / 180;
	const a2 = ((ang[0] + ang[1]) * Math.PI) / 180;
	const codo: P2 = [origen[0] + lado * Math.sin(a1) * l1, origen[1] + Math.cos(a1) * l1];
	const fin: P2 = [codo[0] + lado * Math.sin(a2) * l2, codo[1] + Math.cos(a2) * l2];
	return [codo, fin];
};

const PELO_DESPEINADO = 'M -32 -18 L -34 -46 L -20 -30 L -14 -60 L -4 -34 L 6 -62 L 12 -34 L 26 -54 L 26 -28 L 42 -36 L 33 -14';

/** Cabeza de palito (normal, sol o luna) con cara; centrada en (0, 0). */
export const CabezaPalito: React.FC<{
	p: number;
	cara: CaraPalito;
	tipo?: 'normal' | 'sol' | 'luna';
	pelo?: 'despeinado' | 'gorro' | null;
	mirar?: P2;
	ojeras?: boolean;
	color?: string;
	ancho?: number;
	giroRayos?: number;
	voltear?: boolean;
	/** -1..1: corre la cara hacia un costado (como si la cabeza girara) */
	girarCara?: number;
	/** escala horizontal de la medialuna (-1..1, para darla vuelta de a poco) */
	escalaX?: number;
}> = ({p, cara, tipo = 'normal', pelo = null, mirar, ojeras, color = NEGRO, ancho = 8, giroRayos = 0, voltear = false, girarCara = 0, escalaX}) => {
	const pf = tramo(p, 0.6, 1);
	if (tipo === 'luna') {
		const sx = escalaX ?? (voltear ? -1 : 1);
		return (
			<g transform={`scale(${sx} 1)`}>
				<Garabato forma={MEDIALUNA} caja={[-46, -46, 84, 76]} p={tramo(p, 0.3, 0.9)} color={AZUL_CLARO} paso={12} opacidad={0.95} />
				<Trazo d={MEDIALUNA} p={tramo(p, 0, 0.6)} ancho={ancho} color={color} />
				{pelo === 'gorro' ? <Gorro p={tramo(p, 0.5, 0.9)} x={-8} y={-30} rot={-28} /> : null}
				{pf > 0 ? (
					<g opacity={pf}>
						<CaraLuna cara={cara} />
					</g>
				) : null}
			</g>
		);
	}
	return (
		<g>
			{tipo === 'sol' ? <CuerpoSol p={p} giro={giroRayos} ancho={ancho} brillo={0.35} /> : <Trazo d={elipse(0, 0, 36, 38)} p={tramo(p, 0, 0.6)} color={color} ancho={ancho} />}
			{pelo === 'despeinado' ? <Trazo d={PELO_DESPEINADO} p={tramo(p, 0.4, 0.8)} color={color} ancho={ancho * 0.8} /> : null}
			{pelo === 'gorro' ? <Gorro p={tramo(p, 0.4, 0.8)} x={2} y={-26} rot={-12} /> : null}
			{pf > 0 ? (
				<g opacity={pf} transform={`translate(${girarCara * 13} 0) scale(${(voltear ? -1 : 1) * (1 - 0.18 * Math.abs(girarCara))} 1)`}>
					<Cara cara={cara} mirar={mirar} ojeras={ojeras} color={color} />
				</g>
			) : null}
		</g>
	);
};

/** Personaje de palitos. (x, y) es la cadera; mide ~280 de alto con escala 1 (cabeza arriba, pies a +120). */
export const Palito: React.FC<{
	x: number;
	y: number;
	p: number;
	escala?: number;
	pose?: Partial<PosePalito>;
	cara?: CaraPalito;
	/** inclinación de la cabeza (grados) y cuánto baja (px) */
	cabeza?: {rot?: number; baja?: number};
	/** giro de todo el cuerpo alrededor de los pies (grados) */
	giro?: number;
	color?: string;
	/** cabeza normal, de sol o de luna (personajes "cortisol" y "melatonina") */
	tipoCabeza?: 'normal' | 'sol' | 'luna';
	pelo?: 'despeinado' | 'gorro' | null;
	mirar?: P2;
	ojeras?: boolean;
	/** la luna (o la cara) mira para el otro lado */
	voltear?: boolean;
	giroRayos?: number;
	girarCara?: number;
	escalaX?: number;
	/** algo que se dibuja en la mano derecha (coordenadas de la mano) */
	enMano?: React.ReactNode;
}> = ({x, y, p, escala = 1, pose, cara = 'neutra', cabeza, giro = 0, color = NEGRO, tipoCabeza = 'normal', pelo = null, mirar, ojeras, voltear, giroRayos, girarCara, escalaX, enMano}) => {
	if (p <= 0.001) return null;
	const ps = {...POSE_PARADO, ...pose};
	const hombro: P2 = [0, -100];
	const cadera: P2 = [0, 0];
	const radioCabeza = tipoCabeza === 'normal' ? 38 : 42;
	const cab: P2 = [0, -122 - radioCabeza + (cabeza?.baja ?? 0)];
	const brazos = ([-1, 1] as const).map((lado) => extremidad(lado, hombro, lado < 0 ? ps.brazoI : ps.brazoD, 55, 52));
	const piernas = ([-1, 1] as const).map((lado) => extremidad(lado, cadera, lado < 0 ? ps.piernaI : ps.piernaD, 64, 58));
	const pc = tramo(p, 0, 0.3);
	const pt = tramo(p, 0.22, 0.4);
	const pb = tramo(p, 0.38, 0.65);
	const pp = tramo(p, 0.6, 0.85);
	const ancho = 8 / Math.sqrt(escala);
	const manoD = brazos[1][1];
	return (
		<g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro} 0 120)`}>
			<g transform={`translate(${cab[0]} ${cab[1]}) rotate(${cabeza?.rot ?? 0} 0 ${radioCabeza})`}>
				<CabezaPalito
					p={pc}
					cara={cara}
					tipo={tipoCabeza}
					pelo={pelo}
					mirar={mirar}
					ojeras={ojeras}
					color={color}
					ancho={ancho}
					giroRayos={giroRayos}
					voltear={voltear}
					girarCara={girarCara}
					escalaX={escalaX}
				/>
			</g>
			<Trazo d={`M 0 ${cab[1] + radioCabeza} L ${cadera[0]} ${cadera[1]}`} p={pt} color={color} ancho={ancho} />
			{brazos.map(([codo, mano], i) => (
				<Trazo key={`b${i}`} d={`M ${hombro[0]} ${hombro[1]} L ${codo[0]} ${codo[1]} L ${mano[0]} ${mano[1]}`} p={pb} color={color} ancho={ancho} />
			))}
			{piernas.map(([rodilla, pie], i) => (
				<Trazo key={`p${i}`} d={`M ${cadera[0]} ${cadera[1]} L ${rodilla[0]} ${rodilla[1]} L ${pie[0]} ${pie[1]}`} p={pp} color={color} ancho={ancho} />
			))}
			{enMano && pb > 0.9 ? <g transform={`translate(${manoD[0]} ${manoD[1]})`}>{enMano}</g> : null}
		</g>
	);
};

// ---------- cerebro dibujado ----------

const CEREBRO_CONTORNO =
	'M -235 70 C -285 40 -290 -60 -245 -115 C -215 -165 -150 -200 -80 -205 C -40 -225 30 -228 75 -210 C 140 -215 205 -185 235 -135 C 275 -95 285 -30 262 15 C 250 45 225 70 195 80 C 205 120 175 160 130 158 C 100 156 82 140 80 122 C 50 128 20 126 0 112 C -40 135 -110 138 -150 118 C -190 120 -225 100 -235 70 Z';
const CEREBRO_PLIEGUES = [
	'M -230 10 C -190 -10 -150 5 -120 -15 C -85 -35 -40 -20 -10 -5 C 20 10 50 0 75 15',
	'M -20 -205 C -35 -170 -5 -150 -20 -120 C -32 -95 -5 -75 -15 -50',
	'M -175 -150 C -150 -120 -185 -95 -160 -70 C -140 -50 -170 -35 -150 -15',
	'M 90 -200 C 70 -170 105 -150 85 -125 C 65 -100 100 -80 80 -55',
	'M 170 -160 C 150 -130 185 -110 160 -85',
	'M 232 -60 C 200 -40 225 -10 195 10',
	'M -120 75 C -95 55 -70 85 -40 70 C -15 58 10 85 30 70',
	'M 112 108 C 132 98 152 113 168 103',
	'M 106 132 C 126 124 150 138 166 128',
];
const CEREBRO_TRONCO = ['M 72 120 C 74 160 68 200 82 248', 'M 114 152 C 112 186 114 216 124 248'];
export const CIRCUITO = 'M 92 108 C 40 95 0 70 -55 48 C -110 25 -170 0 -218 -42';
const NODOS: P2[] = [
	[92, 108],
	[-55, 48],
	[-218, -42],
];
const ZONAS_EXTRA: P2[] = [
	[-150, -110],
	[40, -150],
	[175, -70],
	[-20, 0],
];

/** Cerebro dibujado (de perfil, mirando a la izquierda) con el circuito de recompensa. Mide ~560×460 con escala 1. */
export const CerebroPizarra: React.FC<{
	x: number;
	y: number;
	p: number;
	escala?: number;
	/** 0..1: el circuito de recompensa se enciende en amarillo */
	circuito?: number;
	/** 0..1: aparece el cartel "circuito de recompensa" */
	etiqueta?: number;
	/** 0..1: cerebro "apagado" (sombreado gris) */
	apagado?: number;
	/** 0..1: otras zonas encendidas */
	zonas?: number;
	cara?: 'picara' | 'feliz' | null;
	/** 0..1 guiño (cara pícara) */
	guino?: number;
	colorCircuito?: string;
}> = ({x, y, p, escala = 1, circuito = 0, etiqueta = 0, apagado = 0, zonas = 0, cara = null, guino = 0, colorCircuito = AMARILLO}) => {
	if (p <= 0.001) return null;
	const anchoLinea = 8 / escala;
	return (
		<g transform={`translate(${x} ${y}) scale(${escala})`}>
			{apagado > 0.01 ? (
				<Garabato forma={CEREBRO_CONTORNO} caja={[-290, -230, 580, 400]} p={apagado} color={GRIS} paso={22} opacidad={0.45} />
			) : null}
			{zonas > 0.01
				? ZONAS_EXTRA.map(([zx, zy], i) => (
						<g key={i}>
							<Brillo x={zx} y={zy} r={70} intensidad={0.75 * tramo(zonas, i * 0.15, i * 0.15 + 0.4)} />
							<Garabato forma={elipse(zx, zy, 55, 42)} caja={[zx - 60, zy - 50, 120, 100]} p={tramo(zonas, i * 0.15, i * 0.15 + 0.4)} paso={18} opacidad={0.8} />
						</g>
					))
				: null}
			{circuito > 0.01 ? (
				<>
					{NODOS.map(([nx, ny], i) => (
						<Brillo key={i} x={nx} y={ny} r={80} intensidad={0.85 * circuito} color={colorCircuito} />
					))}
					<Trazo d={CIRCUITO} p={circuito} color={colorCircuito} ancho={38} opacidad={0.95} />
				</>
			) : null}
			<Trazo d={CEREBRO_CONTORNO} p={tramo(p, 0, 0.55)} ancho={anchoLinea} />
			{CEREBRO_TRONCO.map((d, i) => (
				<Trazo key={i} d={d} p={tramo(p, 0.45, 0.65)} ancho={anchoLinea} />
			))}
			{CEREBRO_PLIEGUES.map((d, i) => (
				<Trazo key={i} d={d} p={tramo(p, 0.4 + i * 0.05, 0.6 + i * 0.05)} ancho={anchoLinea * 0.8} />
			))}
			{/* el circuito (siempre dibujado, finito) */}
			<Trazo d={CIRCUITO} p={tramo(p, 0.8, 1)} ancho={anchoLinea * 0.7} color={NEGRO} />
			{p > 0.95 ? NODOS.map(([nx, ny], i) => <circle key={i} cx={nx} cy={ny} r={11} fill={circuito > 0.5 ? ROJO : NEGRO} />) : null}
			{cara ? (
				<g opacity={tramo(p, 0.85, 1)}>
					<ellipse cx={-150} cy={-80} rx={26} ry={guino > 0.5 ? 4 : 30} fill="#FFFFFF" stroke={NEGRO} strokeWidth={6} />
					{guino > 0.5 ? null : <circle cx={-138} cy={-74} r={11} fill={NEGRO} />}
					<ellipse cx={-70} cy={-92} rx={26} ry={30} fill="#FFFFFF" stroke={NEGRO} strokeWidth={6} />
					<circle cx={-58} cy={-86} r={11} fill={NEGRO} />
					<path d={cara === 'picara' ? 'M -180 -128 L -128 -120 M -96 -140 L -44 -134' : 'M -176 -124 L -126 -124 M -96 -134 L -46 -134'} stroke={NEGRO} strokeWidth={7} strokeLinecap="round" />
					<path d={cara === 'picara' ? 'M -150 -25 Q -110 -5 -62 -35' : 'M -150 -30 Q -105 10 -60 -30'} fill="none" stroke={NEGRO} strokeWidth={7} strokeLinecap="round" />
				</g>
			) : null}
			{etiqueta > 0.01 ? (
				<g>
					<Trazo d="M -55 60 C -80 120 -120 170 -150 205" p={tramo(etiqueta, 0, 0.35)} ancho={5 / escala} />
					<Texto x={-150} y={262} texto="circuito de recompensa" p={tramo(etiqueta, 0.3, 1)} tam={50 / escala} color={NEGRO} />
				</g>
			) : null}
		</g>
	);
};

// ---------- lamparita ----------

const BULBO = 'M -70 40 C -110 0 -115 -90 -60 -130 C -20 -158 20 -158 60 -130 C 115 -90 110 0 70 40 C 55 55 50 75 50 95 L -50 95 C -50 75 -55 55 -70 40 Z';

/** Lamparita dibujada; `brillo` 0..1 la rellena de amarillo y le pone rayos. `signo`: un "?" adentro. */
export const Bombilla: React.FC<{x: number; y: number; p: number; brillo?: number; escala?: number; signo?: boolean}> = ({
	x,
	y,
	p,
	brillo = 0,
	escala = 1,
	signo = false,
}) => {
	if (p <= 0.001) return null;
	const a = 8 / escala;
	return (
		<g transform={`translate(${x} ${y}) scale(${escala})`}>
			<Brillo x={0} y={-50} r={150} intensidad={0.55 * brillo} />
			<Garabato forma={BULBO} caja={[-115, -160, 230, 260]} p={brillo} paso={24} opacidad={0.85} />
			<Trazo d={BULBO} p={tramo(p, 0, 0.6)} ancho={a} />
			{[110, 128, 146].map((yy, i) => (
				<Trazo key={i} d={`M ${-46 + i * 4} ${yy} L ${46 - i * 4} ${yy}`} p={tramo(p, 0.55 + i * 0.1, 0.7 + i * 0.1)} ancho={a} />
			))}
			{signo ? (
				<Pregunta x={0} y={-50} p={tramo(p, 0.75, 1)} tam={0.62} ancho={11} />
			) : (
				<Trazo d="M -25 60 L -15 10 L 0 40 L 15 10 L 25 60" p={tramo(p, 0.7, 1)} ancho={a * 0.7} />
			)}
			{brillo > 0.02
				? new Array(9).fill(0).map((_, i) => {
						const ang = -Math.PI / 2 + ((i - 4) / 4) * 1.9;
						const r0 = 175;
						const r1 = r0 + 70 * brillo;
						return (
							<Trazo
								key={i}
								d={`M ${Math.cos(ang) * r0} ${-50 + Math.sin(ang) * r0} L ${Math.cos(ang) * r1} ${-50 + Math.sin(ang) * r1}`}
								p={1}
								color={i % 2 === 0 ? AMARILLO : NEGRO}
								ancho={i % 2 === 0 ? 12 : 7}
								opacidad={Math.min(1, brillo * 1.5)}
							/>
						);
					})
				: null}
		</g>
	);
};

// ---------- objetos recurrentes ----------

/** Curva suave (Catmull-Rom → Bézier) que pasa por todos los puntos. */
export const curvaSuave = (pts: P2[]): string => {
	if (pts.length < 2) return '';
	let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(pts.length - 1, i + 2)];
		const c1: P2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2: P2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
	}
	return d;
};

/** Polilínea con muchos puntos de una función (para gráficos). */
export const curvaDeFuncion = (f: (x: number) => number, desde: number, hasta: number, aPixel: (x: number, y: number) => P2, pasos = 90): string => {
	const pts: string[] = [];
	for (let i = 0; i <= pasos; i++) {
		const x = desde + ((hasta - desde) * i) / pasos;
		const [px, py] = aPixel(x, f(x));
		pts.push(`${px.toFixed(1)} ${py.toFixed(1)}`);
	}
	return `M ${pts.join(' L ')}`;
};

/** Gotita de transpiración (o de agua). */
export const Gota: React.FC<{x: number; y: number; p: number; tam?: number; rot?: number}> = ({x, y, p, tam = 1, rot = 0}) =>
	p <= 0.01 ? null : (
		<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${tam * Math.min(1, p * 1.6)})`} opacity={Math.min(1, p * 2)}>
			<path d="M 0 -18 C 9 -4 13 5 13 11 C 13 19 7 24 0 24 C -7 24 -13 19 -13 11 C -13 5 -9 -4 0 -18 Z" fill={AZUL_CLARO} stroke={NEGRO} strokeWidth={4} strokeLinejoin="round" />
		</g>
	);

/** "Z z z" que flotan hacia arriba (t en segundos). */
export const Zzz: React.FC<{x: number; y: number; p: number; t: number; tam?: number; color?: string}> = ({x, y, p, t, tam = 54, color = AZUL}) => {
	if (p <= 0.01) return null;
	return (
		<g opacity={Math.min(1, p * 1.5)}>
			{[0, 1, 2].map((i) => {
				const fase = (t * 0.6 + i / 3) % 1;
				const s = tam * (0.55 + 0.45 * (1 - i / 3));
				return (
					<text
						key={i}
						x={x + i * tam * 0.55 + 8 * Math.sin(t * 2 + i)}
						y={y - i * tam * 0.7 - 14 * fase}
						fontFamily={FUENTE_MANO}
						fontSize={s}
						fill={color}
						opacity={0.35 + 0.65 * (1 - fase)}
					>
						Z
					</text>
				);
			})}
		</g>
	);
};

/** Rayo de energía (relleno amarillo). Centro en (x, y), ~110 de alto con tam 1. */
export const Rayo: React.FC<{x: number; y: number; p: number; tam?: number; rot?: number; brillo?: number}> = ({x, y, p, tam = 1, rot = 0, brillo = 0}) => {
	if (p <= 0.001) return null;
	const forma = 'M 12 -58 L -30 6 L -2 6 L -14 58 L 32 -12 L 4 -12 Z';
	return (
		<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${tam})`}>
			<Brillo x={0} y={0} r={70} intensidad={brillo} />
			<Garabato forma={forma} caja={[-32, -60, 66, 120]} p={tramo(p, 0.4, 1)} paso={12} opacidad={1} />
			<Trazo d={forma} p={tramo(p, 0, 0.6)} ancho={7 / Math.sqrt(tam)} />
		</g>
	);
};

/** Estrellita de cinco puntas (contorno + relleno amarillo). */
export const Estrella: React.FC<{x: number; y: number; r: number; p: number; color?: string}> = ({x, y, r, p, color = AMARILLO}) => {
	if (p <= 0.01) return null;
	const puntos = new Array(10).fill(0).map((_, i) => {
		const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
		const rr = i % 2 === 0 ? r : r * 0.45;
		return `${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
	});
	const d = `M ${puntos.join(' L ')} Z`;
	return (
		<g>
			<path d={d} fill={color} opacity={tramo(p, 0.5, 1)} />
			<Trazo d={d} p={p} ancho={4} />
		</g>
	);
};

/** Celular (rectángulo redondeado con pantalla); `brillo` enciende la pantalla y tira rayitos. */
export const Celular: React.FC<{x: number; y: number; p: number; escala?: number; rot?: number; brillo?: number; pantalla?: React.ReactNode}> = ({
	x,
	y,
	p,
	escala = 1,
	rot = 0,
	brillo = 0,
	pantalla,
}) => {
	if (p <= 0.001) return null;
	const a = 7 / Math.sqrt(escala);
	return (
		<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${escala})`}>
			<Brillo x={0} y={0} r={110} intensidad={0.65 * brillo} />
			<path d={rectangulo(-46, -82, 92, 164, 16)} fill="#FFFFFF" opacity={tramo(p, 0.3, 0.6)} />
			{brillo > 0.01 ? <path d={rectangulo(-36, -66, 72, 126, 6)} fill={AMARILLO} opacity={0.55 * brillo} /> : null}
			<Trazo d={rectangulo(-46, -82, 92, 164, 16)} p={tramo(p, 0, 0.6)} ancho={a} />
			<Trazo d={rectangulo(-36, -66, 72, 126, 6)} p={tramo(p, 0.4, 0.8)} ancho={a * 0.6} />
			<Trazo d="M -10 -74 L 10 -74" p={tramo(p, 0.7, 0.9)} ancho={a * 0.7} />
			{pantalla && p > 0.8 ? <g opacity={tramo(p, 0.8, 1)}>{pantalla}</g> : null}
			{brillo > 0.02
				? [-1, 0, 1].map((i) => (
						<Trazo
							key={i}
							d={`M ${i * 34} -100 L ${i * 52} ${-128 - (i === 0 ? 12 : 0)}`}
							p={1}
							color={i === 0 ? '#F2B600' : NEGRO}
							ancho={i === 0 ? 9 : 6}
							opacidad={Math.min(1, brillo * 1.4)}
						/>
					))
				: null}
		</g>
	);
};

/**
 * Reloj dibujado. `hora` (0..12) y `minuto` (0..60) mueven las agujas; `cara` le pone ojos y boca;
 * `campanas` lo hace despertador; `sacudir` (0..1) lo hace temblar (sonando);
 * `enredado` (0..1) convierte las agujas en un enredo de fideos.
 */
export const RelojPizarra: React.FC<{
	x: number;
	y: number;
	r: number;
	p: number;
	hora?: number;
	minuto?: number;
	cara?: CaraPalito | null;
	campanas?: boolean;
	sacudir?: number;
	enredado?: number;
	t?: number;
	marcas?: boolean;
	relleno?: string;
}> = ({x, y, r, p, hora = 10, minuto = 10, cara = null, campanas = false, sacudir = 0, enredado = 0, t = 0, marcas = true, relleno}) => {
	if (p <= 0.001) return null;
	const a = 7;
	const rotar = sacudir * 7 * Math.sin(t * 40);
	const angH = ((hora % 12) / 12) * Math.PI * 2;
	const angM = (minuto / 60) * Math.PI * 2;
	const punta = (ang: number, largo: number): P2 => [Math.sin(ang) * largo, -Math.cos(ang) * largo];
	const [hx, hy] = punta(angH, r * 0.48);
	const [mx, my] = punta(angM, r * 0.74);
	const fideos = `M 0 0 C ${r * 0.5} ${-r * 0.2} ${r * 0.3} ${-r * 0.75} ${-r * 0.05} ${-r * 0.45} C ${-r * 0.4} ${-r * 0.15} ${-r * 0.65} ${r * 0.25} ${-r * 0.25} ${r * 0.35} C ${r * 0.2} ${r * 0.45} ${r * 0.55} ${r * 0.1} ${r * 0.25} ${-r * 0.1} C ${0} ${-r * 0.3} ${-r * 0.35} ${-r * 0.05} ${-r * 0.1} ${r * 0.15}`;
	const caraEscala = (r / 37) * 0.62;
	return (
		<g transform={`translate(${x} ${y}) rotate(${rotar})`}>
			{campanas
				? ([-1, 1] as const).map((lado) => {
						const bx = lado * r * 0.62;
						const by = -r * 0.92;
						const campana = `M ${bx - r * 0.3} ${by + r * 0.12} Q ${bx - r * 0.3} ${by - r * 0.3} ${bx} ${by - r * 0.3} Q ${bx + r * 0.3} ${by - r * 0.3} ${bx + r * 0.3} ${by + r * 0.12} Z`;
						return (
							<g key={lado} transform={`rotate(${lado * 30} ${bx} ${by})`}>
								<Garabato forma={campana} caja={[bx - r * 0.32, by - r * 0.32, r * 0.64, r * 0.46]} p={tramo(p, 0.5, 0.9)} color={ROJO} paso={12} opacidad={0.85} />
								<Trazo d={campana} p={tramo(p, 0.3, 0.7)} ancho={a} />
							</g>
						);
					})
				: null}
			{campanas ? (
				<>
					<Trazo d={`M ${-r * 0.55} ${r * 0.8} L ${-r * 0.8} ${r * 1.12} M ${r * 0.55} ${r * 0.8} L ${r * 0.8} ${r * 1.12}`} p={tramo(p, 0.3, 0.7)} ancho={a} />
					<Trazo d={`M 0 ${-r} L 0 ${-r * 1.18}`} p={tramo(p, 0.4, 0.7)} ancho={a} />
				</>
			) : null}
			<circle cx={0} cy={0} r={r} fill={relleno ?? '#FFFFFF'} opacity={tramo(p, 0.2, 0.6) * (relleno ? 0.9 : 1)} />
			<Trazo d={elipse(0, 0, r)} p={tramo(p, 0, 0.5)} ancho={a + 1} />
			{marcas
				? new Array(12).fill(0).map((_, i) => {
						const ang = (i / 12) * Math.PI * 2;
						const [x0, y0] = punta(ang, r * 0.86);
						const [x1, y1] = punta(ang, r * (i % 3 === 0 ? 0.7 : 0.78));
						return <Trazo key={i} d={`M ${x0} ${y0} L ${x1} ${y1}`} p={tramo(p, 0.3 + i * 0.03, 0.45 + i * 0.03)} ancho={i % 3 === 0 ? 6 : 4} />;
					})
				: null}
			{cara ? (
				<g transform={`translate(0 ${r * 0.08}) scale(${caraEscala})`} opacity={tramo(p, 0.7, 1)}>
					<Cara cara={cara} />
				</g>
			) : null}
			{enredado > 0.01 ? (
				<Trazo d={fideos} p={tramo(p, 0.6, 1) * enredado} color={ROJO} ancho={8} />
			) : null}
			{enredado < 0.99 ? (
				<g opacity={1 - enredado}>
					<Trazo d={`M 0 0 L ${hx} ${hy}`} p={tramo(p, 0.6, 0.8)} ancho={a + 2} />
					<Trazo d={`M 0 0 L ${mx} ${my}`} p={tramo(p, 0.7, 0.9)} ancho={a - 1} color={cara ? ROJO : NEGRO} />
				</g>
			) : null}
			{p > 0.8 ? <circle cx={0} cy={0} r={8} fill={NEGRO} /> : null}
			{sacudir > 0.05
				? ([-1, 1] as const).map((lado) => (
						<g key={`s${lado}`} opacity={sacudir}>
							<Trazo d={`M ${lado * (r + 26)} ${-r * 0.5} Q ${lado * (r + 44)} 0 ${lado * (r + 26)} ${r * 0.5}`} p={1} ancho={6} />
							<Trazo d={`M ${lado * (r + 50)} ${-r * 0.7} Q ${lado * (r + 74)} 0 ${lado * (r + 50)} ${r * 0.7}`} p={1} ancho={5} />
						</g>
					))
				: null}
		</g>
	);
};

/**
 * Cama vista de costado: cabecera a la izquierda en x, colchón de `ancho` px, almohada.
 * (x, y) = esquina izquierda de arriba del colchón. `bulto`: alto de la manta sobre el cuerpo.
 */
export const CamaPizarra: React.FC<{x: number; y: number; ancho: number; p: number; manta?: number; bulto?: number; colorManta?: string}> = ({
	x,
	y,
	ancho,
	p,
	manta = 1,
	bulto = 40,
	colorManta = AZUL,
}) => {
	if (p <= 0.001) return null;
	const xm = x + 150;
	const formaManta = `M ${xm} ${y + 20} C ${xm + 10} ${y - bulto} ${xm + 120} ${y - bulto - 6} ${xm + 220} ${y - bulto * 0.8} C ${x + ancho - 120} ${y - bulto * 0.5} ${x + ancho - 30} ${y - 18} ${x + ancho + 14} ${y + 6} L ${x + ancho + 14} ${y + 70} L ${xm - 6} ${y + 70} Z`;
	return (
		<g>
			{/* cabecera y patas */}
			<Trazo d={`M ${x} ${y + 110} L ${x} ${y - 150} Q ${x + 30} ${y - 175} ${x + 60} ${y - 150} L ${x + 60} ${y + 4}`} p={tramo(p, 0, 0.4)} ancho={8} />
			<Trazo d={`M ${x + ancho} ${y + 110} L ${x + ancho} ${y - 30}`} p={tramo(p, 0.2, 0.45)} ancho={8} />
			<Trazo d={rectangulo(x, y, ancho, 64, 14)} p={tramo(p, 0.1, 0.5)} ancho={8} />
			{/* almohada */}
			<path d={`M ${x + 60} ${y + 4} C ${x + 50} ${y - 46} ${x + 170} ${y - 50} ${x + 175} ${y + 2} Z`} fill="#FFFFFF" opacity={tramo(p, 0.4, 0.6)} />
			<Trazo d={`M ${x + 60} ${y + 4} C ${x + 50} ${y - 46} ${x + 170} ${y - 50} ${x + 175} ${y + 2}`} p={tramo(p, 0.35, 0.6)} ancho={7} />
			{manta > 0.01 ? (
				<>
					<path d={formaManta} fill="#FFFFFF" opacity={tramo(p, 0.5, 0.7)} />
					<Garabato forma={formaManta} caja={[xm - 10, y - bulto - 10, ancho - 130, bulto + 90]} p={tramo(p, 0.55, 1) * manta} color={colorManta} paso={18} opacidad={0.35} />
					<Trazo d={formaManta} p={tramo(p, 0.45, 0.85) * manta} ancho={8} />
				</>
			) : null}
		</g>
	);
};
