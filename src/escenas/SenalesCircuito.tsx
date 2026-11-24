import React from 'react';
import {useCurrentFrame} from 'remotion';
import {avance, CerebroPizarra, elipse, Flecha, Garabato, GRIS, NEGRO, Pizarra, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Además, aprende las señales: un lugar, una hora, una persona. Y las ganas pueden aparecer solas,
 * antes de consumir."
 * Abajo, el cerebro. Arriba aparecen tres señales (una calle con farol, un reloj, una silueta),
 * cada una con una flecha al cerebro que enciende un poco el circuito; con "ganas" se enciende entero.
 */
const SILUETA = 'M 860 300 C 900 300 912 345 900 372 C 940 385 962 430 960 520 L 760 520 C 758 430 780 385 820 372 C 808 345 820 300 860 300 Z';

export const SenalesCircuito: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fLugar = momento('lugar');
	const fHora = momento('hora');
	const fPersona = momento('persona');
	const fGanas = momento('ganas');

	const cerebro = avance(frame, 4, 40);
	const lugar = avance(frame, fLugar - 8, 22);
	const hora = avance(frame, fHora - 8, 22);
	const persona = avance(frame, fPersona - 8, 22);
	const fl = [fLugar, fHora, fPersona].map((f) => avance(frame, f + 10, 16));
	const ganas = avance(frame, fGanas - 6, 24);
	const circuito = Math.min(1, 0.22 * (fl[0] + fl[1] + fl[2]) + ganas);

	return (
		<Pizarra>
			{/* un lugar: calle con farol */}
			<Trazo d="M 90 560 L 215 300 M 330 560 L 255 300" p={tramo(lugar, 0, 0.5)} />
			<Trazo d="M 210 540 L 214 520 M 222 470 L 225 450 M 230 400 L 232 385" p={tramo(lugar, 0.4, 0.7)} ancho={6} />
			<Trazo d="M 360 560 L 360 330 Q 360 300 392 300 L 410 300" p={tramo(lugar, 0.5, 0.9)} />
			<Garabato forma={elipse(412, 318, 20)} caja={[390, 296, 44, 44]} p={tramo(lugar, 0.8, 1)} paso={12} />
			<Texto x={225} y={625} texto="un lugar" p={tramo(lugar, 0.5, 1)} tam={50} />
			{/* una hora: reloj */}
			<Trazo d={elipse(560, 410, 100)} p={tramo(hora, 0, 0.55)} />
			<Trazo d="M 560 322 L 560 340 M 648 410 L 630 410 M 560 498 L 560 480 M 472 410 L 490 410" p={tramo(hora, 0.4, 0.7)} ancho={6} />
			<Trazo d={`M 560 410 L ${560 - 48} ${410 - 28} M 560 410 L ${560 + 40 * Math.sin(t)} ${410 - 70 * Math.cos(t * 0.4)}`} p={tramo(hora, 0.6, 1)} color={ROJO} ancho={8} />
			<Texto x={560} y={575} texto="una hora" p={tramo(hora, 0.5, 1)} tam={50} />
			{/* una persona: silueta */}
			<Garabato forma={SILUETA} caja={[755, 295, 210, 230]} p={persona} color={GRIS} paso={18} opacidad={0.75} />
			<Trazo d={SILUETA} p={persona} ancho={7} color={NEGRO} />
			<Texto x={860} y={600} texto="una persona" p={tramo(persona, 0.5, 1)} tam={50} />

			<Flecha desde={[230, 660]} hasta={[390, 830]} curva={-30} p={fl[0]} ancho={7} punta={26} />
			<Flecha desde={[560, 610]} hasta={[545, 790]} curva={0} p={fl[1]} ancho={7} punta={26} />
			<Flecha desde={[860, 640]} hasta={[700, 830]} curva={30} p={fl[2]} ancho={7} punta={26} />

			<CerebroPizarra x={540} y={1040} p={cerebro} escala={0.92} circuito={circuito} colorCircuito={'#FFD23F'} />
			<Texto x={905} y={1180} texto="ganas" p={ganas} tam={88} color={ROJO} negrita />
			{ganas > 0.5
				? [0, 1, 2].map((i) => (
						<Trazo key={i} d={`M ${880 + i * 40} ${1090 - (i === 1 ? 20 : 0)} l ${(i - 1) * 14} -40`} p={tramo(ganas, 0.5, 1)} color={ROJO} ancho={7} />
					))
				: null}
		</Pizarra>
	);
};
