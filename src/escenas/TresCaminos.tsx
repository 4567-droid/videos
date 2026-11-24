import React from 'react';
import {useCurrentFrame} from 'remotion';
import {AMARILLO, avance, Brillo, Cruz, elipse, Flecha, Garabato, NEGRO, Pizarra, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Las drogas llegan por caminos distintos: unas bloquean que la dopamina se recicle, otras
 * fuerzan su liberación, otras activan las neuronas que la fabrican."
 * Una neurona con su terminal y la sinapsis llena de puntitos de dopamina. Tres flechas de
 * colores: roja → la bomba de reciclaje (tachada), ámbar → las vesículas largan de más,
 * negra → el cuerpo de la neurona se enciende.
 */
const AMBAR = '#F2A900';
const SOMA = 'M 455 470 C 450 410 500 385 540 388 C 590 385 630 415 625 470 C 630 520 590 552 540 552 C 490 552 452 525 455 470 Z';
const DENDRITAS = ['M 470 420 L 400 360 L 360 300', 'M 400 360 L 345 372', 'M 610 420 L 680 360 L 722 300', 'M 680 360 L 735 376', 'M 540 388 L 540 305 L 500 255', 'M 540 305 L 585 255'];
const TERMINAL = 'M 470 905 C 470 868 610 868 610 905 C 615 962 582 992 540 992 C 498 992 465 962 470 905 Z';
const PUNTOS: [number, number][] = [
	[505, 1012],
	[548, 1022],
	[580, 1008],
	[526, 1030],
];
const EXTRA: [number, number][] = [
	[470, 1018],
	[610, 1020],
	[492, 1040],
	[570, 1040],
	[600, 1000],
	[530, 1004],
	[455, 1000],
	[625, 1038],
];

const Punto: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
	s <= 0.01 ? null : <circle cx={x} cy={y} r={11 * Math.min(1, s)} fill={AMARILLO} stroke={NEGRO} strokeWidth={4} />;

export const TresCaminos: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fUnas = momento('unas');
	const fRecicle = momento('recicle');
	const fOtras = momento('otras');
	const fLiberacion = momento('liberación');
	const fOtras2 = momento('otras', {ocurrencia: 2});
	const fFabrican = momento('fabrican', {fin: true});

	const neurona = avance(frame, 4, 60);
	const f1 = avance(frame, fUnas, 24);
	const f2 = avance(frame, fOtras, 24);
	const f3 = avance(frame, fOtras2, 24);
	const cruz = avance(frame, fRecicle - 4, 14);
	const libera = avance(frame, fLiberacion - 6, 20);
	const activa = avance(frame, fOtras2 + 16, Math.max(10, fFabrican - fOtras2 - 16));

	return (
		<Pizarra>
			{/* neurona */}
			<Brillo x={540} y={470} r={130} intensidad={0.8 * activa} />
			<Garabato forma={SOMA} caja={[450, 385, 180, 170]} p={activa} paso={20} />
			<Trazo d={SOMA} p={tramo(neurona, 0, 0.3)} />
			{DENDRITAS.map((d, i) => (
				<Trazo key={i} d={d} p={tramo(neurona, 0.2 + i * 0.04, 0.4 + i * 0.04)} ancho={7} />
			))}
			<Trazo d={elipse(540, 470, 24)} p={tramo(neurona, 0.3, 0.45)} ancho={6} />
			<Trazo d="M 540 552 C 548 650 532 760 540 868" p={tramo(neurona, 0.4, 0.65)} />
			<Trazo d={TERMINAL} p={tramo(neurona, 0.6, 0.8)} />
			{[
				[508, 930],
				[562, 926],
				[536, 958],
			].map(([x, y], i) => (
				<Trazo key={i} d={elipse(x, y, 15)} p={tramo(neurona, 0.7 + i * 0.05, 0.85 + i * 0.05)} ancho={5} />
			))}
			{/* bomba de reciclaje (abajo a la izquierda de la terminal) */}
			<Trazo d="M 462 960 L 446 990 M 484 974 L 470 1000" p={tramo(neurona, 0.8, 0.9)} ancho={6} />
			{/* membrana de la neurona que recibe */}
			<Trazo d="M 420 1075 C 490 1048 590 1048 660 1075" p={tramo(neurona, 0.8, 0.95)} />
			<Trazo d="M 450 1068 L 450 1170 M 630 1068 L 630 1170" p={tramo(neurona, 0.88, 1)} ancho={7} />
			{PUNTOS.map(([x, y], i) => (
				<Punto key={i} x={x} y={y} s={tramo(neurona, 0.9, 1)} />
			))}
			{EXTRA.map(([x, y], i) => (
				<Punto key={`e${i}`} x={x + 4 * Math.sin(t * 3 + i)} y={y} s={i < 4 ? cruz : libera * 1.5 - (i - 4) * 0.12} />
			))}

			{/* 1: bloquean el reciclaje */}
			<Flecha desde={[140, 820]} hasta={[440, 975]} curva={60} p={f1} color={ROJO} ancho={11} punta={36} />
			<Texto x={260} y={770} texto="no se recicla" p={tramo(f1, 0.3, 1)} tam={50} color={ROJO} />
			<Cruz x={466} y={980} p={cruz} tam={26} ancho={9} />
			{/* 2: fuerzan la liberación */}
			<Flecha desde={[940, 820]} hasta={[625, 935]} curva={-60} p={f2} color={AMBAR} ancho={11} punta={36} />
			<Texto x={810} y={770} texto="se libera de más" p={tramo(f2, 0.3, 1)} tam={50} color={AMBAR} />
			{/* 3: activan las neuronas que la fabrican */}
			<Flecha desde={[150, 330]} hasta={[440, 450]} curva={50} p={f3} color={NEGRO} ancho={11} punta={36} />
			<Texto x={220} y={265} texto="se activa" p={tramo(f3, 0.3, 1)} tam={54} />
			{activa > 0.2
				? [0, 1, 2].map((i) => (
						<Trazo key={i} d={`M ${650 + i * 18} ${405 + i * 35} l 30 -12`} p={tramo(activa, 0.2, 0.6)} color={NEGRO} ancho={7} />
					))
				: null}
		</Pizarra>
	);
};
