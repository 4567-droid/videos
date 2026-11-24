import React from 'react';
import {useCurrentFrame} from 'remotion';
import {avance, Garabato, Palito, Pizarra, rectangulo, ROJO, Texto, Tilde, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Si vos o alguien cercano lo necesita, en Argentina la línea 141 es gratuita, anónima y atiende
 * todo el día." (aviso de ayuda)
 * Dos personajes de la mano con un corazón. Abajo, un celular con "141" bien grande (resaltado en
 * amarillo) y, al costado, tildes: gratuita, anónima, las 24 h.
 */
const CORAZON = 'M 540 410 C 498 378 488 346 510 330 C 526 320 538 327 540 341 C 542 327 554 320 570 330 C 592 346 582 378 540 410 Z';

export const Linea141: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const fVos = momento('vos');
	const fCercano = momento('cercano');
	const fNecesita = momento('necesita');
	const fArgentina = momento('argentina');
	const f141 = momento('141');
	const fGratuita = momento('gratuita');
	const fAnonima = momento('anónima');
	const fAtiende = momento('atiende');

	const vos = avance(frame, fVos - 10, 24);
	const otro = avance(frame, fCercano - 10, 24);
	const corazon = avance(frame, fCercano + 6, 18);
	const celu = avance(frame, fNecesita - 10, 30);
	const pais = avance(frame, fArgentina - 2, 16);
	const numero = avance(frame, f141 - 6, 20);
	const checks = [fGratuita, fAnonima, fAtiende].map((f) => avance(frame, f - 4, 16));
	const textos = ['gratuita', 'anónima', 'las 24 h'];

	return (
		<Pizarra>
			<Palito x={410} y={520} p={vos} escala={0.85} cara="sonrisa" pose={{brazoD: [92, 0]}} />
			<Palito x={670} y={520} p={otro} escala={0.85} cara="sonrisa" pose={{brazoI: [92, 0]}} />
			<Garabato forma={CORAZON} caja={[486, 318, 108, 96]} p={corazon} color={ROJO} paso={14} />
			<Trazo d={CORAZON} p={corazon} ancho={6} />

			{/* celular */}
			<Trazo d={rectangulo(170, 690, 440, 620, 48)} p={tramo(celu, 0, 0.6)} />
			<Trazo d={rectangulo(205, 770, 370, 440, 20)} p={tramo(celu, 0.4, 0.8)} ancho={6} />
			<Trazo d="M 350 732 L 430 732" p={tramo(celu, 0.7, 0.9)} ancho={8} />
			<Trazo d="M 372 1262 A 18 18 0 1 1 408 1262 A 18 18 0 1 1 372 1262" p={tramo(celu, 0.8, 1)} ancho={6} />
			<Texto x={390} y={860} texto="Argentina" p={pais} tam={54} />
			<Garabato forma={rectangulo(225, 930, 330, 180, 30)} caja={[225, 930, 330, 180]} p={tramo(numero, 0.4, 1)} />
			<Texto x={390} y={1080} texto="141" p={numero} tam={190} color={ROJO} negrita />
			<Texto x={390} y={1170} texto="línea" p={numero} tam={48} />

			{checks.map((c, i) => (
				<g key={i}>
					<Tilde x={680} y={860 + i * 150} p={tramo(c, 0, 0.5)} tam={52} />
					<Texto x={730} y={880 + i * 150} texto={textos[i]} p={tramo(c, 0.3, 1)} tam={58} ancla="inicio" />
				</g>
			))}
		</Pizarra>
	);
};
