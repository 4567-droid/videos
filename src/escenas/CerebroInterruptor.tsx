import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {CuartoCerebro} from '../componentes/CuartoCerebro';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Mientras soñás, tu cerebro paraliza tu cuerpo a propósito, para que no actúes tus sueños."
 * El cerebro duerme y sueña (nube con un muñequito corriendo). Manda un pulso por el cable,
 * el interruptor pasa a OFF y los brazos y las piernas del cuerpo se ponen grises.
 * En la nube el sueño sigue corriendo, pero el cuerpo se queda quieto.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const CerebroInterruptor: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fSonas = momento('soñás');
	const fCerebro = momento('cerebro');
	const fParaliza = momento('paraliza');
	const fActues = momento('actúes');

	const nube = spring({frame: frame - fSonas + 6, fps, config: {damping: 12, stiffness: 120}});
	// el cerebro manda la orden: pulso por su cable y la palanca baja a OFF
	const orden = interpolate(frame, [fCerebro, fParaliza - 2, fParaliza + 8], [0, 1, 0], clamp);
	const palanca = 1 - spring({frame: frame - fParaliza, fps, config: {damping: 10, stiffness: 200}});
	const energia = interpolate(frame, [fParaliza, fParaliza + 8], [1, 0], clamp);
	const apagado = interpolate(frame, [fParaliza + 4, fParaliza + 20], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	// "para que no actúes tus sueños": las piernas quieren seguir el sueño, pero no se mueven
	const intento = interpolate(frame, [fActues - 6, fActues, fActues + 30], [0, 0.35, 0.15], clamp);

	const k = frame / duracion;
	const sacudon = temblor(t, 0.5);
	const posicion: V3 = [0.3 - 0.15 * k + sacudon[0], 3.1 - 0.1 * k + sacudon[1], 4.4 - 0.3 * k];
	const mirarA: V3 = [0.05, 0.85, -0.45];

	return (
		<Escenario3D fondo="radial-gradient(circle at 50% 35%, #3B2A8F 0%, #1E1660 55%, #0A0826 100%)" luces={false}>
			<Camara posicion={posicion} mirarA={mirarA} />
			<CuartoCerebro
				t={t}
				cerebro={{abiertos: 0, brillo: 0.3 + 0.7 * orden, boca: 'sonrisa'}}
				interruptor={palanca}
				energiaCuerpo={energia}
				energiaCerebro={orden}
				cuerpo={{apagado, abiertos: 0, boca: 'sonrisa', temblor: intento}}
				nube={nube}
			/>
		</Escenario3D>
	);
};
