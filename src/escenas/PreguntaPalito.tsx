import React from 'react';
import {useCurrentFrame} from 'remotion';
import {avance, NEGRO, Palito, Pizarra, Pregunta, ROJO, tramo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "¿Por qué cuesta tanto dejar una droga, aunque quieras?"
 * Un personaje de palitos se dibuja; arriba aparece un gran signo de pregunta rojo y,
 * con "aunque quieras", se rasca la cabeza entre preguntitas.
 */
export const PreguntaPalito: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fCuesta = momento('cuesta');
	const fDroga = momento('droga', {fin: true});
	const fAunque = momento('aunque');

	const cuerpo = avance(frame, 2, 34);
	const signo = avance(frame, fCuesta, 24);
	const rasca = avance(frame, fAunque - 8, 10);
	const chicos = avance(frame, fAunque, 22);
	const brazoD: [number, number] = [24 + 126 * rasca, 8 + 47 * rasca + 10 * Math.sin(t * 16) * rasca];

	return (
		<Pizarra>
			<Palito x={540} y={1010} p={cuerpo} escala={2} cara={frame > fDroga ? 'preocupada' : 'neutra'} pose={{brazoD}} cabeza={{rot: -8 * rasca}} />
			<Pregunta x={560} y={360} p={signo} tam={1.9} color={ROJO} ancho={16} />
			<Pregunta x={290} y={560} p={chicos} tam={0.7} color={NEGRO} ancho={9} />
			<Pregunta x={820} y={600} p={tramo(chicos, 0.3, 1)} tam={0.6} color={NEGRO} ancho={9} />
		</Pizarra>
	);
};
