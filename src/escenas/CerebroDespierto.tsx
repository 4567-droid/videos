import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {CuartoCerebro} from '../componentes/CuartoCerebro';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "A veces el cerebro despierta antes que el cuerpo: estás consciente, pero los músculos siguen apagados."
 * El cerebro abre los ojos y se prende una lamparita; el interruptor sigue en OFF.
 * El muñeco abre los ojos (consciente) pero brazos y piernas siguen grises; el cerebro
 * insiste con pulsos y la palanca se sacude sin llegar a ON.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const CerebroDespierto: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fDespierta = momento('despierta');
	const fCuerpo = momento('cuerpo');
	const fConsciente = momento('consciente');
	const fPero = momento('pero');
	const fApagados = momento('apagados');

	const ojosCerebro = 1.15 * spring({frame: frame - fDespierta, fps, config: {damping: 9, stiffness: 200}});
	const lampara = spring({frame: frame - fDespierta - 3, fps, config: {damping: 10, stiffness: 160}});
	const brillo = interpolate(frame, [fDespierta + 4, fDespierta + 14], [0, 1], clamp);
	const ojosCuerpo = 1.25 * spring({frame: frame - fConsciente + 4, fps, config: {damping: 10, stiffness: 200}});
	const busca = interpolate(frame, [fConsciente + 6, fConsciente + 14], [0, 1], clamp);
	// el cerebro insiste: pulsos que sacuden la palanca, pero no sube
	const insiste = interpolate(frame, [fPero - 4, fPero + 4], [0, 1], clamp);
	const sacudida = insiste * Math.max(0, Math.sin((frame - fPero) * 0.55)) * 0.32;
	const tiembla = interpolate(frame, [fPero, fPero + 8, fApagados + 20], [0, 0.9, 0.5], clamp);

	// cámara: se acerca de a poco al cuerpo
	const acerca = interpolate(frame, [fCuerpo - 10, fConsciente + 20], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const sacudon = temblor(t, 0.5);
	const base = mezclar([0.15, 3.0, 4.1], [0.28, 2.9, 3.85], acerca);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0.05, 0.85, -0.45], [0.05, 0.78, -0.48], acerca);

	return (
		<Escenario3D fondo="radial-gradient(circle at 50% 35%, #3B2A8F 0%, #1E1660 55%, #0A0826 100%)" luces={false}>
			<Camara posicion={posicion} mirarA={mirarA} />
			<CuartoCerebro
				t={t}
				cerebro={{abiertos: ojosCerebro, mirar: [0.35 * busca, -0.3 * busca], brillo: 0.4 + 0.6 * brillo, boca: ojosCerebro > 0.5 ? 'sonrisa' : 'nada'}}
				interruptor={sacudida}
				energiaCuerpo={0}
				energiaCerebro={insiste * (0.5 + 0.5 * Math.sin(t * 9))}
				colorCerebro="#FF3B5C"
				cuerpo={{
					apagado: 1,
					abiertos: ojosCuerpo,
					mirar: [busca * Math.sin((frame - fConsciente) * 0.2) * 0.8, 0.1],
					cejas: -Math.min(1, ojosCuerpo),
					boca: ojosCuerpo > 0.4 ? 'o' : 'linea',
					temblor: tiembla,
				}}
				lamparita={lampara}
				brilloLamparita={brillo}
			/>
		</Escenario3D>
	);
};
