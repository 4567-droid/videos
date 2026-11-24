import {linearTiming} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {TRANSICION} from '../lib/linea-de-tiempo';
import type {TipoTransicion} from '../lib/tipos';

export type {TipoTransicion};

type PropsPresentacion = {tipo: TipoTransicion};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

type GestoBorrador = {
	/** borde del borrado, en % del ancho */
	x: number;
	/** alto del borrador, en % del alto */
	y: number;
	rot: number;
	cara: 'ninguna' | 'feliz' | 'cansado' | 'contento';
	/** ángulos de los bracitos (grados; 0 = colgando, 90 = horizontal, 180 = arriba) */
	brazoI: number;
	brazoD: number;
	/** estirar/aplastar (1 = normal) */
	estira: number;
	/** 0..1 gotita de transpiración que sale volando */
	gota: number;
	/** 0..1 estrellitas de "ta-dá" */
	estrellas: number;
	/** 0..1 rayitas de velocidad */
	velocidad: number;
};

/** Coreografía del borrador según el tipo de transición (p: 0..1, lineal en el tiempo). */
const gesto = (tipo: TipoTransicion, p: number): GestoBorrador => {
	const base: GestoBorrador = {
		x: -12 + 124 * Easing.inOut(Easing.cubic)(p),
		y: 50 + 30 * Math.sin(p * Math.PI * 5),
		rot: 8 * Math.sin(p * 20),
		cara: 'ninguna',
		brazoI: 20,
		brazoD: 20,
		estira: 1,
		gota: 0,
		estrellas: 0,
		velocidad: 0,
	};
	if (tipo === 'borrar-saludo') {
		// borra hasta la mitad, se da vuelta, saluda a cámara con una sonrisa y sigue
		const avance = interpolate(p, [0, 0.33, 0.68, 1], [0, 0.46, 0.5, 1], clamp);
		const saluda = interpolate(p, [0.3, 0.38, 0.62, 0.7], [0, 1, 1, 0], clamp);
		return {
			...base,
			x: -12 + 124 * avance,
			y: 46 + 26 * Math.sin(p * Math.PI * 4) * (1 - saluda),
			rot: 8 * Math.sin(p * 20) * (1 - saluda),
			cara: 'feliz',
			brazoD: 20 + saluda * (150 + 22 * Math.sin(p * 60)),
			brazoI: 20 + 10 * saluda,
		};
	}
	if (tipo === 'borrar-cansado') {
		// a mitad de camino se para, jadea y se seca la frente; después sale disparado
		const avance = interpolate(p, [0, 0.32, 0.72, 1], [0, 0.55, 0.58, 1], clamp);
		const para = interpolate(p, [0.3, 0.36, 0.7, 0.74], [0, 1, 1, 0], clamp);
		const seca = interpolate(p, [0.4, 0.48, 0.6, 0.66], [0, 1, 1, 0], clamp);
		return {
			...base,
			x: -12 + 124 * avance,
			y: 48 + 28 * Math.sin(p * Math.PI * 4) * (1 - para),
			rot: 8 * Math.sin(p * 20) * (1 - para) - 6 * para,
			cara: para > 0.2 ? 'cansado' : 'contento',
			brazoI: 20 + para * 25,
			brazoD: 20 + seca * (140 + 14 * Math.sin(p * 70)),
			estira: 1 - 0.08 * para * (0.5 + 0.5 * Math.sin(p * 55)),
			gota: interpolate(p, [0.5, 0.7], [0, 1], clamp),
			velocidad: interpolate(p, [0.72, 0.78, 0.95, 1], [0, 1, 1, 0], clamp),
		};
	}
	if (tipo === 'borrar-giro') {
		// borra, hace una pirueta con los brazos abiertos y sale con estrellitas
		const avance = interpolate(p, [0, 0.42, 0.72, 1], [0, 0.55, 0.62, 1], clamp);
		const gira = interpolate(p, [0.42, 0.72], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
		const enGiro = Math.sin(gira * Math.PI);
		return {
			...base,
			x: -12 + 124 * avance,
			y: 46 + 26 * Math.sin(p * Math.PI * 4) * (1 - enGiro) - 6 * enGiro,
			rot: 360 * gira + 8 * Math.sin(p * 20) * (1 - enGiro),
			cara: gira > 0.05 ? 'feliz' : 'contento',
			brazoI: 20 + 120 * enGiro,
			brazoD: 20 + 120 * enGiro,
			estrellas: interpolate(p, [0.6, 0.75, 1], [0, 1, 0.6], clamp),
		};
	}
	return base;
};

/** Borrador de pizarra dibujado (opcionalmente con carita y bracitos). */
const Borrador: React.FC<{g: GestoBorrador}> = ({g}) => {
	const conCara = g.cara !== 'ninguna';
	const brazo = (lado: -1 | 1, ang: number) => {
		const a = (ang * Math.PI) / 180;
		const hx = lado * 68;
		const hy = -6;
		const cx = hx + lado * Math.sin(a) * 44;
		const cy = hy + Math.cos(a) * 44;
		const mx = cx + lado * Math.sin(a * 1.08) * 40;
		const my = cy + Math.cos(a * 1.08) * 40;
		return (
			<g key={lado}>
				<path d={`M ${hx} ${hy} L ${cx} ${cy} L ${mx} ${my}`} fill="none" stroke="#1D1D24" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
				<circle cx={mx} cy={my} r={8} fill="#FFFFFF" stroke="#1D1D24" strokeWidth={5} />
			</g>
		);
	};
	return (
		<svg width={320} height={380} viewBox="-160 -160 320 380" style={{overflow: 'visible'}}>
			<g transform={`scale(${1 / g.estira} ${g.estira})`}>
				{conCara ? [brazo(-1, g.brazoI), brazo(1, g.brazoD)] : null}
				<rect x={-70} y={-120} width={140} height={180} rx={22} fill="#3A86FF" />
				<rect x={-70} y={-120} width={140} height={34} rx={16} fill="#5C9BFF" />
				<rect x={-70} y={56} width={140} height={64} rx={14} fill="#4A4E69" />
				<rect x={-70} y={56} width={140} height={14} fill="#5D627E" />
				{conCara ? (
					<g>
						{g.cara === 'cansado' ? (
							<>
								<path d="M -40 -38 L -14 -34" stroke="#1D1D24" strokeWidth={7} strokeLinecap="round" />
								<path d="M 40 -38 L 14 -34" stroke="#1D1D24" strokeWidth={7} strokeLinecap="round" />
								<ellipse cx={0} cy={6} rx={14} ry={17} fill="#1D1D24" />
								<ellipse cx={0} cy={16} rx={8} ry={6} fill="#E63946" />
							</>
						) : (
							<>
								{g.cara === 'feliz' ? (
									<>
										<path d="M -40 -30 Q -28 -46 -16 -30" fill="none" stroke="#1D1D24" strokeWidth={7} strokeLinecap="round" />
										<path d="M 16 -30 Q 28 -46 40 -30" fill="none" stroke="#1D1D24" strokeWidth={7} strokeLinecap="round" />
									</>
								) : (
									<>
										<ellipse cx={-28} cy={-34} rx={12} ry={15} fill="#FFFFFF" />
										<ellipse cx={28} cy={-34} rx={12} ry={15} fill="#FFFFFF" />
										<circle cx={-25} cy={-31} r={6} fill="#1D1D24" />
										<circle cx={31} cy={-31} r={6} fill="#1D1D24" />
									</>
								)}
								<path d="M -26 -2 Q 0 30 26 -2 Z" fill="#1D1D24" />
								<path d="M -12 12 Q 0 22 12 12 Q 0 8 -12 12 Z" fill="#E63946" />
							</>
						)}
						<ellipse cx={-46} cy={-6} rx={11} ry={7} fill="#FF8FAB" opacity={0.75} />
						<ellipse cx={46} cy={-6} rx={11} ry={7} fill="#FF8FAB" opacity={0.75} />
					</g>
				) : null}
			</g>
			{g.gota > 0.01 ? (
				<path
					d="M 0 -14 C 8 -2 12 6 12 12 C 12 20 6 24 0 24 C -6 24 -12 20 -12 12 C -12 6 -8 -2 0 -14 Z"
					fill="#9CC2FF"
					stroke="#1D1D24"
					strokeWidth={4}
					transform={`translate(${70 + 70 * g.gota} ${-120 - 60 * Math.sin(g.gota * Math.PI) + 40 * g.gota})`}
					opacity={1 - Math.max(0, g.gota - 0.8) * 5}
				/>
			) : null}
		</svg>
	);
};

const Estrellita: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => {
	const puntos = new Array(10)
		.fill(0)
		.map((_, i) => {
			const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
			const rr = i % 2 === 0 ? r : r * 0.45;
			return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
		})
		.join(' ');
	return <polygon points={puntos} fill="#FFD23F" stroke="#1D1D24" strokeWidth={4} strokeLinejoin="round" />;
};

const Presentacion: React.FC<TransitionPresentationComponentProps<PropsPresentacion>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
	passedProps,
}) => {
	const entrando = presentationDirection === 'entering';
	if (passedProps.tipo.startsWith('borrar')) {
		// pizarra: un borrador pasa de izquierda a derecha y detrás queda la escena nueva (que se dibuja sola)
		if (!entrando) return <AbsoluteFill>{children}</AbsoluteFill>;
		const g = gesto(passedProps.tipo, p);
		const puntos: string[] = [];
		for (let i = 0; i <= 12; i++) {
			const y = (i / 12) * 100;
			puntos.push(`${(g.x + 4 * Math.sin(i * 1.9 + p * 9)).toFixed(2)}% ${y}%`);
		}
		const clip = `polygon(0% 0%, ${puntos.join(', ')}, 0% 100%)`;
		return (
			<AbsoluteFill>
				<AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>
				{g.velocidad > 0.01
					? [0, 1, 2].map((i) => (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: `calc(${g.x}% - ${150 + 60 * i}px)`,
									top: `calc(${g.y}% - ${50 - 50 * i}px)`,
									width: 110 - 20 * i,
									height: 10,
									borderRadius: 5,
									background: '#1D1D24',
									opacity: 0.55 * g.velocidad,
								}}
							/>
						))
					: null}
				<div
					style={{
						position: 'absolute',
						left: `calc(${g.x}% - 160px)`,
						top: `calc(${g.y}% - 160px)`,
						width: 320,
						height: 380,
						transform: `rotate(${g.rot}deg)`,
						transformOrigin: '160px 160px',
						filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.25))',
					}}
				>
					<Borrador g={g} />
				</div>
				{g.estrellas > 0.01 ? (
					<svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
						{[
							[-150, -170, 26],
							[140, -190, 20],
							[170, 40, 22],
							[-170, 60, 18],
						].map(([dx, dy, r], i) => (
							<g key={i} opacity={Math.min(1, g.estrellas * 1.4)}>
								<Estrellita x={(g.x / 100) * 1080 + dx * (0.6 + 0.4 * g.estrellas)} y={(g.y / 100) * 1920 + dy * (0.6 + 0.4 * g.estrellas)} r={r * g.estrellas} />
							</g>
						))}
					</svg>
				) : null}
			</AbsoluteFill>
		);
	}
	let style: React.CSSProperties;
	if (passedProps.tipo === 'deslizar') {
		style = entrando
			? {transform: `translateY(${(1 - p) * 30}%) scale(${1.06 - 0.06 * p})`, opacity: Math.min(1, p * 1.8)}
			: {transform: `translateY(${-p * 10}%) scale(${1 - 0.05 * p})`};
	} else if (passedProps.tipo === 'fundido') {
		style = entrando ? {opacity: p} : {};
	} else {
		// zoom: la escena nueva llega desde un acercamiento mientras la vieja se aleja
		style = entrando
			? {transform: `scale(${1.18 - 0.18 * p})`, opacity: p}
			: {transform: `scale(${1 + 0.12 * p})`};
	}
	return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const transicion = (tipo: TipoTransicion = 'zoom'): TransitionPresentation<PropsPresentacion> => ({
	component: Presentacion,
	props: {tipo},
});

/** El borrador con gesto lleva su propia coreografía (tiempo lineal); el resto, una curva suave. */
export const tiempoTransicion = (tipo: TipoTransicion = 'zoom', duracion = TRANSICION) =>
	linearTiming({
		durationInFrames: duracion,
		easing: tipo.startsWith('borrar') ? Easing.linear : Easing.inOut(Easing.cubic),
	});
