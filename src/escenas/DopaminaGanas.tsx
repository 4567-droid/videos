import React from 'react';
import {useCurrentFrame} from 'remotion';
import {avance, CerebroPizarra, elipse, Flecha, Garabato, GRIS, Pizarra, rectangulo, ROJO, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Casi todo empieza con la dopamina: la molécula del querer. No tanto del placer, sino de las
 * ganas de repetir algo."
 * Se dibuja el cerebro y su circuito de recompensa se enciende. Arriba: una molécula y
 * "dopamina → querer". Abajo: "placer" chiquito en gris y una flecha grande que dice "ganas", con un ↻.
 */
const HEXAGONO = 'M 230 205 L 268 227 L 268 271 L 230 293 L 192 271 L 192 227 Z';

export const DopaminaGanas: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const fDopamina = momento('dopamina');
	const fQuerer = momento('querer');
	const fPlacer = momento('placer');
	const fGanas = momento('ganas');
	const fRepetir = momento('repetir');

	const cerebro = avance(frame, 4, 50);
	const circuito = avance(frame, fDopamina, 26);
	const etiqueta = avance(frame, fDopamina + 22, 30);
	const molecula = avance(frame, fDopamina - 6, 24);
	const querer = avance(frame, fQuerer - 4, 18);
	const placer = avance(frame, fPlacer - 4, 18);
	const ganas = avance(frame, fGanas - 8, 18);
	const repetir = avance(frame, fRepetir, 20);

	return (
		<Pizarra>
			{/* molécula + dopamina → querer */}
			<Trazo d={HEXAGONO} p={tramo(molecula, 0, 0.6)} ancho={7} />
			<Trazo d="M 268 227 L 300 210 M 192 271 L 160 290 L 140 330" p={tramo(molecula, 0.5, 0.9)} ancho={7} />
			<Texto x={330} y={272} texto="dopamina" p={tramo(molecula, 0.6, 1)} tam={66} ancla="inicio" />
			<Garabato forma={rectangulo(700, 205, 240, 90, 20)} caja={[700, 205, 240, 90]} p={querer} />
			<Trazo d="M 615 250 L 680 250 M 660 232 L 680 250 L 660 268" p={querer} ancho={7} />
			<Texto x={820} y={275} texto="querer" p={querer} tam={74} negrita />

			<CerebroPizarra x={540} y={650} p={cerebro} escala={1.2} circuito={circuito} etiqueta={etiqueta} />

			{/* "no tanto del placer" (chiquito, gris) */}
			<Flecha desde={[330, 990]} hasta={[255, 1100]} curva={-20} p={placer} color={GRIS} ancho={6} punta={20} />
			<Texto x={240} y={1170} texto="placer" p={placer} tam={52} color={GRIS} />
			{/* "las ganas de repetir algo" (grande, rojo) */}
			<Flecha desde={[470, 720]} hasta={[740, 1080]} curva={-60} p={ganas} color={ROJO} ancho={12} punta={40} />
			<Garabato forma={rectangulo(650, 1110, 300, 120, 30)} caja={[650, 1110, 300, 120]} p={tramo(ganas, 0.5, 1)} />
			<Texto x={800} y={1200} texto="GANAS" p={tramo(ganas, 0.3, 1)} tam={96} color={ROJO} negrita />
			<Trazo d={`${elipse(960, 1030, 50)}`} p={tramo(repetir, 0, 0.8)} color={ROJO} ancho={8} />
			<Trazo d="M 1003 1000 L 1012 1035 L 980 1030" p={tramo(repetir, 0.8, 1)} color={ROJO} ancho={8} />
		</Pizarra>
	);
};
