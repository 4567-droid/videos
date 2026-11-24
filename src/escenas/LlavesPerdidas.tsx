import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {AMARILLO, avance, CerebroPizarra, elipse, Garabato, NEGRO, NubePensamiento, Pizarra, Pregunta, ROJO, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Tu cerebro no se acuerda dónde dejó las llaves, pero se acuerda perfecto de ese lugar." (cierre gracioso)
 * El cerebro con cara pícara. Abajo, unas llaves perdidas entre signos de pregunta. Arriba, en su
 * nube de pensamiento, un pin rojo marca "ese lugar" con una estrellita; el cerebro guiña un ojo.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const PIN = 'M 790 300 C 740 245 745 185 790 180 C 835 185 840 245 790 300 Z';

export const LlavesPerdidas: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fLlaves = momento('llaves');
	const fAcuerda2 = momento('acuerda', {ocurrencia: 2});
	const fPerfecto = momento('perfecto');
	const fLugar = momento('lugar');

	const cerebro = avance(frame, 3, 34);
	const llaves = avance(frame, fLlaves - 10, 22);
	const preguntas = avance(frame, fLlaves, 20);
	const nube = avance(frame, fAcuerda2 - 6, 22);
	const pin = avance(frame, fPerfecto - 2, 18);
	const estrella = avance(frame, fLugar - 4, 16);
	const guino = interpolate(frame, [fPerfecto, fPerfecto + 2, fPerfecto + 12, fPerfecto + 14], [0, 1, 1, 0], clamp);
	const salto = Math.abs(Math.sin(t * 5)) * 10 * pin;

	return (
		<Pizarra>
			<NubePensamiento x={800} y={250} w={380} h={230} p={nube} cola={[650, 420]} />
			<g transform={`translate(0 ${-salto})`}>
				<Garabato forma={PIN} caja={[740, 175, 100, 130]} p={pin} color={ROJO} paso={16} />
				<Trazo d={PIN} p={pin} ancho={7} />
				<Trazo d={elipse(790, 228, 14)} p={tramo(pin, 0.5, 1)} ancho={5} />
			</g>
			<Trazo d="M 700 318 Q 790 300 880 318" p={tramo(pin, 0.3, 1)} ancho={5} />
			<Garabato forma="M 900 175 L 909 198 L 934 198 L 914 212 L 921 236 L 900 222 L 879 236 L 886 212 L 866 198 L 891 198 Z" caja={[864, 172, 72, 66]} p={estrella} color={AMARILLO} paso={12} />
			<Trazo d="M 900 175 L 909 198 L 934 198 L 914 212 L 921 236 L 900 222 L 879 236 L 886 212 L 866 198 L 891 198 Z" p={estrella} ancho={5} />

			<CerebroPizarra x={520} y={700} p={cerebro} escala={1.05} cara="picara" guino={guino} circuito={0.35 * nube} />

			{/* llaves perdidas */}
			<Trazo d={elipse(240, 1110, 42)} p={tramo(llaves, 0, 0.35)} ancho={8} />
			<Trazo d="M 270 1140 L 350 1220 M 320 1190 L 340 1170 M 336 1206 L 356 1186" p={tramo(llaves, 0.3, 0.7)} ancho={9} />
			<Trazo d={elipse(262, 1128, 12)} p={tramo(llaves, 0.3, 0.5)} ancho={5} />
			<Trazo d="M 282 1110 L 400 1110 M 360 1110 L 360 1134 M 382 1110 L 382 1128" p={tramo(llaves, 0.55, 1)} ancho={9} />
			<Pregunta x={150} y={1000} p={preguntas} tam={0.6} ancho={9} color={NEGRO} />
			<Pregunta x={430} y={1020} p={tramo(preguntas, 0.3, 1)} tam={0.5} ancho={9} color={NEGRO} />
		</Pizarra>
	);
};
