import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrazoCerebro, GloboCorazon, Nube} from '../componentes/Amor';
import {Camara, temblor} from '../componentes/Camara';
import {Contador} from '../componentes/Contador';
import {LucesNoche} from '../componentes/Dormir';
import {Destellos, Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {CerebroConCara} from '../componentes/Interruptor';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Es un estudio chico, de quince personas, pero muestra algo importante: el cerebro aprende a
 * soltar. Solo necesita tiempo."
 * Cielo de madrugada con nubes. El cerebro sostiene un globo con forma de corazón (aparece
 * "15 personas"); al decir "soltar" abre la mano y el globo sube hasta perderse en el cielo.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const HOMBRO: V3 = [0.24, 1.0, 0.05];
const CODO: V3 = [0.44, 1.1, 0.14];
const MUNECA: V3 = [0.4, 1.28, 0.12];

export const GloboSoltar: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fQuince = momento('quince');
	const fImportante = momento('importante', {fin: true});
	const fSoltar = momento('soltar');
	const fTiempo = momento('tiempo', {fin: true});

	const contador = spring({frame: frame - fQuince + 2, fps, config: {damping: 13}}) * (1 - interpolate(frame, [fImportante + 6, fImportante + 20], [0, 1], clamp));
	const abre = interpolate(frame, [fSoltar - 2, fSoltar + 6], [0, 1], clamp);
	const sube = interpolate(frame, [fSoltar, fTiempo + 10], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const paz = interpolate(frame, [fTiempo - 20, fTiempo], [0, 1], clamp);
	const despedida = spring({frame: frame - fTiempo + 12, fps, config: {damping: 14}});

	const globoBase: V3 = [MUNECA[0], MUNECA[1] + 0.13, MUNECA[2]];
	const globo: V3 = [globoBase[0] + 0.35 * sube + 0.1 * Math.sin(t * 1.8) * sube, globoBase[1] + 4.6 * sube, globoBase[2] - 1.6 * sube];

	// cámara: sube un poco para acompañar al globo
	const mira = interpolate(frame, [fSoltar, fTiempo + 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const sacudon = temblor(t, 0.25);
	const base = mezclar([0.2, 1.3, 5.3], [0.15, 1.6, 5.1], mira);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0, 1.55, 0], [0.1, 2.25, -0.5], mira);

	return (
		<Escenario3D
			fondo="linear-gradient(180deg, #4B3C8F 0%, #8E6BB8 38%, #E7A6C0 72%, #FFD3B0 100%)"
			luces={false}
			overlay={<Contador valor={15} texto="15 personas" color="#FF8FAB" aparicion={contador} top={1400} />}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.9} />
			<directionalLight position={[0, -1, 4]} intensity={0.8} color="#FFC9A0" />
			<Resplandor color="#FFC38A" escala={9} opacidad={0.35} position={[0, -1.2, -5]} />

			<Nube position={[-1.3, 2.7, -2.6]} scale={0.6} color="#FFE6F0" />
			<Nube position={[1.4, 2.1, -3.2]} scale={0.75} color="#FFF0E6" />
			<Nube position={[-0.9, 0.5, -2.2]} scale={0.5} color="#F5E6FF" />
			<Nube position={[1.1, 4.0, -3.5]} scale={0.7} color="#FFE6F0" />

			<group position={[0, 0.95 + 0.04 * Math.sin(t * 1.4), 0]} rotation={[0.08, -0.2, 0]} scale={0.45}>
				<CerebroConCara
					t={t}
					abiertos={paz > 0.6 ? 0 : 1.05}
					mirar={[0.35, 0.75]}
					brillo={0.3 + 0.3 * despedida}
					boca="sonrisa"
				/>
			</group>
			<BrazoCerebro desde={HOMBRO} codo={CODO} mano={MUNECA} cerrar={1 - abre} escalaMano={0.8} />
			<GloboCorazon t={t} largoHilo={0.75} position={globo} scale={1 - 0.35 * sube} />
			{despedida > 0.01 ? (
				<Destellos t={t} cantidad={40} rango={[1.6, 1.4, 1]} centro={[globo[0], globo[1] - 0.6, globo[2]]} tamano={0.03 * despedida} semilla="globo" colores={['#FFFFFF', '#FFD23F', '#FFD6E0']} />
			) : null}
			<Destellos t={t} cantidad={30} rango={[6, 5, 3]} centro={[0, 2.5, -2]} tamano={0.022} semilla="cielo-madrugada" colores={['#FFFFFF', '#FFE6F0']} opacidad={0.55} />
		</Escenario3D>
	);
};
