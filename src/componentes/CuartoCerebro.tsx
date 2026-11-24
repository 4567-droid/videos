import React from 'react';
import {Lamparita} from './Ciencia';
import {Avatar} from './Avatar';
import {Cama, Durmiente, Habitacion, LucesNoche, type BocaDurmiente} from './Dormir';
import {Destellos} from './Efectos';
import {Cable, CerebroConCara, Interruptor, NubeSueno} from './Interruptor';
import type {V3} from './utilidades3d';

/**
 * Montaje compartido por las escenas "el cerebro apaga el cuerpo" y "el cerebro despierta
 * antes": cuarto de noche, cama con el muñeco, cerebro flotando, nube de sueño o lamparita,
 * e interruptor ON/OFF conectado por cables (cerebro → interruptor → cuerpo).
 * Cámara recomendada: posicion [0.3, 3.1, 4.4], mirarA [0.05, 0.85, -0.45].
 */

export const POS_CEREBRO: V3 = [-0.35, 1.25, -0.95];
export const POS_INTERRUPTOR: V3 = [0.5, 0.88, -0.85];
export const POS_NUBE: V3 = [0.48, 1.5, -1.0];

const CABLE_CUERPO: V3[] = [
	[0.5, 0.67, -0.83],
	[0.64, 0.5, -0.62],
	[0.4, 0.46, -0.42],
	[0.12, 0.4, -0.33],
];
const CABLE_CEREBRO: V3[] = [
	[-0.12, 1.06, -0.86],
	[0.12, 0.92, -0.84],
	[0.31, 0.9, -0.84],
];

export const CuartoCerebro: React.FC<{
	t: number;
	cerebro: {abiertos: number; mirar?: [number, number]; brillo?: number; boca?: 'nada' | 'sonrisa' | 'grito'};
	/** 1 = ON, 0 = OFF (puede pasar de 1 por rebote) */
	interruptor: number;
	/** energía en el cable al cuerpo y en el del cerebro (0..1) */
	energiaCuerpo: number;
	energiaCerebro: number;
	colorCerebro?: string;
	cuerpo: {apagado: number; abiertos: number; mirar?: [number, number]; cejas?: number; boca?: BocaDurmiente; temblor?: number};
	nube?: number;
	lamparita?: number;
	brilloLamparita?: number;
}> = ({t, cerebro, interruptor, energiaCuerpo, energiaCerebro, colorCerebro = '#FF5DA2', cuerpo, nube = 0, lamparita = 0, brilloLamparita = 0}) => (
	<>
		<LucesNoche luz={0.1} />
		<Habitacion t={t} />
		<Cama />
		<Durmiente
			t={t}
			apagado={cuerpo.apagado}
			abiertos={cuerpo.abiertos}
			mirar={cuerpo.mirar}
			cejas={cuerpo.cejas}
			boca={cuerpo.boca}
			temblor={cuerpo.temblor}
			respira={0.6}
		/>
		<CerebroConCara
			t={t}
			abiertos={cerebro.abiertos}
			mirar={cerebro.mirar}
			brillo={cerebro.brillo}
			boca={cerebro.boca}
			position={[POS_CEREBRO[0], POS_CEREBRO[1] + 0.04 * Math.sin(t * 1.6), POS_CEREBRO[2]]}
			rotation={[0.3, 0.22, 0.04 * Math.sin(t * 1.1)]}
			scale={0.42}
		/>
		<Cable puntos={CABLE_CEREBRO} t={t} energia={energiaCerebro} colorEnergia={colorCerebro} radio={0.025} />
		<Interruptor estado={interruptor} t={t} position={POS_INTERRUPTOR} rotation={[0.25, -0.12, 0]} scale={0.42} />
		<Cable puntos={CABLE_CUERPO} t={t} energia={energiaCuerpo} radio={0.028} />
		<NubeSueno aparicion={nube} cola={[-1, -0.35]} position={[POS_NUBE[0], POS_NUBE[1] + 0.03 * Math.sin(t * 1.3), POS_NUBE[2]]} scale={0.27}>
			<Avatar t={t} animacion="correr" position={[0, -0.5, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.55} sombra={false} />
		</NubeSueno>
		{lamparita > 0.01 ? (
			<Lamparita t={t} brillo={brilloLamparita} position={[POS_NUBE[0], POS_NUBE[1] - 0.06, POS_NUBE[2]]} rotation={[0.2, -0.2, 0.06 * Math.sin(t * 2)]} scale={0.16 * lamparita} />
		) : null}
		<Destellos t={t} cantidad={30} rango={[4, 2.5, 2]} centro={[0, 1.4, -1.1]} tamano={0.025} semilla="cuarto" colores={['#FFFFFF', '#B8C4FF', '#FFD23F']} opacidad={0.6} />
	</>
);
