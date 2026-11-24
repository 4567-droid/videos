import React from 'react';
import {useCurrentFrame} from 'remotion';
import {AMARILLO, avance, CerebroPizarra, Flecha, Garabato, NEGRO, Pizarra, rectangulo, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Pero casi todas terminan en el mismo lugar: el circuito de recompensa, con una subida que suele
 * ser mucho mayor que la de una comida o un abrazo."
 * Arriba, tres flechitas (los colores de la escena anterior) llegan al circuito del cerebro, que se
 * enciende. Abajo, un gráfico: la barra roja crece enorme; "comida" y "abrazo" quedan chiquitas.
 */
const AMBAR = '#F2A900';
const BASE = 1250;

const Barra: React.FC<{x: number; alto: number; p: number; color: string; texto: string}> = ({x, alto, p, color, texto}) => {
	const h = alto * p;
	if (p <= 0.001) return null;
	const forma = rectangulo(x, BASE - h, 120, h, 10);
	return (
		<g>
			<Garabato forma={forma} caja={[x, BASE - h, 120, h]} p={Math.min(1, p * 1.4)} color={color} paso={22} />
			<path d={forma} fill="none" stroke={NEGRO} strokeWidth={7} strokeLinejoin="round" />
			<Texto x={x + 60} y={BASE + 56} texto={texto} p={tramo(p, 0.3, 1)} tam={48} />
		</g>
	);
};

export const GraficoSubida: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const fCasi = momento('casi');
	const fCircuito = momento('circuito');
	const fSubida = momento('subida');
	const fMayor = momento('mayor', {fin: true});
	const fComida = momento('comida');
	const fAbrazo = momento('abrazo');

	const cerebro = avance(frame, 2, 40);
	const flechas = [0, 1, 2].map((i) => avance(frame, fCasi + 4 + i * 8, 20));
	const circuito = avance(frame, fCircuito - 4, 24);
	const etiqueta = avance(frame, fCircuito + 10, 30);
	const ejes = avance(frame, fSubida - 24, 22);
	const grande = avance(frame, fSubida, Math.max(12, fMayor - fSubida));
	const comida = avance(frame, fComida - 4, 14);
	const abrazo = avance(frame, fAbrazo - 4, 14);

	return (
		<Pizarra>
			<CerebroPizarra x={560} y={390} p={cerebro} escala={0.72} circuito={circuito} etiqueta={etiqueta} />
			<Flecha desde={[90, 220]} hasta={[440, 400]} curva={40} p={flechas[0]} color={ROJO} ancho={9} />
			<Flecha desde={[80, 560]} hasta={[440, 440]} curva={-40} p={flechas[1]} color={AMBAR} ancho={9} />
			<Flecha desde={[1000, 230]} hasta={[700, 360]} curva={-40} p={flechas[2]} color={NEGRO} ancho={9} />

			{/* gráfico */}
			<Trazo d={`M 190 690 L 190 ${BASE} L 960 ${BASE}`} p={ejes} />
			<Texto x={128} y={980} texto="dopamina" p={ejes} tam={50} rotar={-90} />
			<Barra x={270} alto={520} p={grande} color={ROJO} texto="droga" />
			<Barra x={500} alto={95} p={comida} color={AMARILLO} texto="comida" />
			<Barra x={720} alto={110} p={abrazo} color={AMARILLO} texto="abrazo" />
			{grande > 0.95 ? <Trazo d="M 330 700 L 330 650 M 312 668 L 330 650 L 348 668" p={tramo(grande, 0.95, 1)} color={ROJO} ancho={8} /> : null}
		</Pizarra>
	);
};
