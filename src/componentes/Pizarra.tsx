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

// ---------- personaje de palitos ----------

export type CaraPalito = 'neutra' | 'sonrisa' | 'triste' | 'plana' | 'preocupada' | 'o';
export type PosePalito = {brazoI: P2; brazoD: P2; piernaI: P2; piernaD: P2};
/** Ángulos en grados: [hombro, codo]. 0 = hacia abajo; positivo = hacia afuera; 180 = hacia arriba. */
export const POSE_PARADO: PosePalito = {brazoI: [24, 8], brazoD: [24, 8], piernaI: [12, 0], piernaD: [12, 0]};
export const POSE_MANOS_CABEZA: PosePalito = {brazoI: [140, 50], brazoD: [140, 50], piernaI: [12, 0], piernaD: [12, 0]};

const extremidad = (lado: number, origen: P2, ang: P2, l1: number, l2: number): [P2, P2] => {
	const a1 = (ang[0] * Math.PI) / 180;
	const a2 = ((ang[0] + ang[1]) * Math.PI) / 180;
	const codo: P2 = [origen[0] + lado * Math.sin(a1) * l1, origen[1] + Math.cos(a1) * l1];
	const fin: P2 = [codo[0] + lado * Math.sin(a2) * l2, codo[1] + Math.cos(a2) * l2];
	return [codo, fin];
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
}> = ({x, y, p, escala = 1, pose, cara = 'neutra', cabeza, giro = 0, color = NEGRO}) => {
	if (p <= 0.001) return null;
	const ps = {...POSE_PARADO, ...pose};
	const hombro: P2 = [0, -100];
	const cadera: P2 = [0, 0];
	const cab: P2 = [0, -160 + (cabeza?.baja ?? 0)];
	const brazos = ([-1, 1] as const).map((lado) => extremidad(lado, hombro, lado < 0 ? ps.brazoI : ps.brazoD, 55, 52));
	const piernas = ([-1, 1] as const).map((lado) => extremidad(lado, cadera, lado < 0 ? ps.piernaI : ps.piernaD, 64, 58));
	const pc = tramo(p, 0, 0.25);
	const pt = tramo(p, 0.22, 0.4);
	const pb = tramo(p, 0.38, 0.65);
	const pp = tramo(p, 0.6, 0.85);
	const pf = tramo(p, 0.82, 1);
	const bocas: Record<CaraPalito, string> = {
		neutra: 'M -12 14 Q 0 20 12 14',
		sonrisa: 'M -15 8 Q 0 26 15 8',
		triste: 'M -14 20 Q 0 6 14 20',
		plana: 'M -13 14 L 13 14',
		preocupada: 'M -15 16 q 7.5 -7 15 0 q 7.5 7 15 0',
		o: '',
	};
	return (
		<g transform={`translate(${x} ${y}) scale(${escala}) rotate(${giro} 0 120)`}>
			<g transform={`rotate(${cabeza?.rot ?? 0} ${cab[0]} ${cab[1] + 36})`}>
				<Trazo d={elipse(cab[0], cab[1], 36, 38)} p={pc} color={color} ancho={8 / Math.sqrt(escala)} />
				{pf > 0 ? (
					<g transform={`translate(${cab[0]} ${cab[1]})`} opacity={pf}>
						<circle cx={-12} cy={-6} r={4.5} fill={color} />
						<circle cx={12} cy={-6} r={4.5} fill={color} />
						{cara === 'o' ? (
							<circle cx={0} cy={15} r={6} fill="none" stroke={color} strokeWidth={5} />
						) : (
							<path d={bocas[cara]} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
						)}
						{cara === 'preocupada' || cara === 'triste' ? (
							<>
								<path d="M -20 -20 L -6 -15" stroke={color} strokeWidth={4.5} strokeLinecap="round" />
								<path d="M 20 -20 L 6 -15" stroke={color} strokeWidth={4.5} strokeLinecap="round" />
							</>
						) : null}
					</g>
				) : null}
			</g>
			<Trazo d={`M 0 ${cab[1] + 38} L ${cadera[0]} ${cadera[1]}`} p={pt} color={color} ancho={8 / Math.sqrt(escala)} />
			{brazos.map(([codo, mano], i) => (
				<Trazo key={`b${i}`} d={`M ${hombro[0]} ${hombro[1]} L ${codo[0]} ${codo[1]} L ${mano[0]} ${mano[1]}`} p={pb} color={color} ancho={8 / Math.sqrt(escala)} />
			))}
			{piernas.map(([rodilla, pie], i) => (
				<Trazo key={`p${i}`} d={`M ${cadera[0]} ${cadera[1]} L ${rodilla[0]} ${rodilla[1]} L ${pie[0]} ${pie[1]}`} p={pp} color={color} ancho={8 / Math.sqrt(escala)} />
			))}
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
