import React from 'react';
import {useCurrentFrame} from 'remotion';
import {avance, Garabato, GRIS, Pizarra, rectangulo, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Pero con los meses, ese circuito suele ir calmándose y las señales van perdiendo fuerza."
 * Una hoja de calendario y, encima, una ola roja que se dibuja de izquierda a derecha y se
 * achica en cada ciclo (mes 1 → mes 4).
 */
const X0 = 170;
const X1 = 910;
const Y0 = 880;

const ola = () => {
	let d = '';
	for (let i = 0; i <= 160; i++) {
		const k = i / 160;
		const x = X0 + (X1 - X0) * k;
		const amp = 250 * (1 - 0.85 * k);
		const y = Y0 - amp * Math.sin(k * Math.PI * 8);
		d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
	}
	return d;
};
const OLA = ola();

export const OlaCalendario: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const fMeses = momento('meses');
	const fFuerza = momento('fuerza', {fin: true});

	const hoja = avance(frame, 3, 34);
	const onda = avance(frame, fMeses, Math.max(30, fFuerza - fMeses));
	const titulo = avance(frame, fMeses - 6, 20);

	return (
		<Pizarra zoom={[1, 1.03]}>
			<Garabato forma={rectangulo(140, 520, 800, 110, 18)} caja={[140, 520, 800, 110]} p={tramo(hoja, 0.3, 0.8)} color={ROJO} opacidad={0.85} />
			<Trazo d={rectangulo(140, 520, 800, 740, 24)} p={tramo(hoja, 0, 0.5)} />
			<Trazo d="M 140 630 L 940 630" p={tramo(hoja, 0.4, 0.6)} />
			{[0, 1, 2, 3, 4, 5].map((i) => (
				<Trazo key={`v${i}`} d={`M ${254 + i * 114} 630 L ${254 + i * 114} 1260`} p={tramo(hoja, 0.5 + i * 0.05, 0.75 + i * 0.05)} color={GRIS} ancho={4} />
			))}
			{[0, 1, 2, 3].map((i) => (
				<Trazo key={`h${i}`} d={`M 140 ${756 + i * 126} L 940 ${756 + i * 126}`} p={tramo(hoja, 0.6 + i * 0.05, 0.85 + i * 0.05)} color={GRIS} ancho={4} />
			))}
			<Texto x={540} y={470} texto="con los meses" p={titulo} tam={70} />
			<Trazo d={OLA} p={onda} color={ROJO} ancho={13} />
			{[1, 2, 3, 4].map((m) => (
				<Texto key={m} x={X0 + ((m - 0.5) / 4) * (X1 - X0)} y={1225} texto={`mes ${m}`} p={tramo(onda, (m - 1) / 4, (m - 0.4) / 4)} tam={44} color={GRIS} />
			))}
		</Pizarra>
	);
};
