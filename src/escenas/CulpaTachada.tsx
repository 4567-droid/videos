import React from 'react';
import {useCurrentFrame} from 'remotion';
import {avance, Cruz, elipse, Flecha, Garabato, GRIS, NubePensamiento, Palito, Pizarra, Texto, tramo, Trazo} from '../componentes/Pizarra';
import {useEscena} from '../lib/escena';

/**
 * "Y encima puede aparecer la culpa: “ya fallé, qué más da”. Esa idea suele empujar a seguir."
 * Un personaje cabizbajo con una nubecita gris de culpa. Arriba, un globo de pensamiento con
 * "ya fallé, qué más da"; una flecha gris muestra que esa idea empuja, y el globo se tacha en rojo.
 */
export const CulpaTachada: React.FC = () => {
	const frame = useCurrentFrame();
	const {momento} = useEscena();
	const t = frame / 30;
	const fCulpa = momento('culpa');
	const fYa = momento('ya');
	const fDa = momento('da', {fin: true});
	const fEmpujar = momento('empujar');
	const fSeguir = momento('seguir');

	const persona = avance(frame, 3, 32);
	const culpa = avance(frame, fCulpa - 6, 22);
	const globo = avance(frame, fYa - 8, 22);
	const frase = avance(frame, fYa, Math.max(14, fDa - fYa));
	const empuja = avance(frame, fEmpujar - 6, 20);
	const tacha = avance(frame, fSeguir - 4, 20);

	return (
		<Pizarra>
			<NubePensamiento x={540} y={400} w={780} h={300} p={globo} cola={[560, 760]} />
			<Texto x={540} y={385} texto="ya fallé," p={tramo(frase, 0, 0.45)} tam={76} />
			<Texto x={540} y={470} texto="qué más da" p={tramo(frase, 0.45, 1)} tam={76} />
			<Cruz x={540} y={410} p={tacha} tam={170} ancho={16} />

			{/* nubecita de culpa */}
			<Garabato forma={elipse(300, 800, 95, 55)} caja={[200, 740, 200, 120]} p={culpa} color={GRIS} paso={18} opacidad={0.7} />
			<Trazo d={elipse(300, 800, 95, 55)} p={culpa} ancho={7} />
			{culpa > 0.6
				? [0, 1, 2, 3].map((i) => {
						const k = (t * 1.6 + i * 0.25) % 1;
						return <Trazo key={i} d={`M ${245 + i * 36} ${870 + k * 60} l -8 26`} p={1} color={GRIS} ancho={6} opacidad={1 - k} />;
					})
				: null}
			<Texto x={300} y={720} texto="culpa" p={tramo(culpa, 0.4, 1)} tam={54} color={GRIS} />

			<Flecha desde={[780, 560]} hasta={[680, 900]} curva={-40} p={empuja} color={GRIS} ancho={9} />
			<Palito
				x={540 + 18 * empuja}
				y={1080}
				p={persona}
				escala={1.4}
				cara="triste"
				cabeza={{rot: 14, baja: 16}}
				pose={{brazoI: [8, 4], brazoD: [8, 4], piernaI: [8, 0], piernaD: [8, 0]}}
				giro={4 * empuja}
			/>
		</Pizarra>
	);
};
