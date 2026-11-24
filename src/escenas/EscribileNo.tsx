import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrazoCerebro, Cartel, CelularChico} from '../componentes/Amor';
import {Camara, temblor} from '../componentes/Camara';
import {Cama, Durmiente, Habitacion, LucesNoche, PISO_CAMA} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {CerebroConCara} from '../componentes/Interruptor';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Eso sí: a las tres de la mañana, tu cerebro va a seguir sugiriéndote que le escribas. No le hagas caso."
 * (cierre gracioso) Primer plano del despertador: 3:00, con el celular al lado. La cámara se abre:
 * el cerebro, al lado de la cama, agita un cartel que dice "ESCRIBILE". Con "No le hagas caso"
 * la persona se tapa la cara con la almohada, el cerebro baja el cartel y el celular se apaga.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const POS_CEREBRO: V3 = [1.0, 1.05, -0.7];
const HOMBRO: V3 = [0.82, 0.98, -0.58];
const POS_CELU: V3 = [1.22, PISO_CAMA + 0.635, -0.78];

export const EscribileNo: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fTres = momento('tres');
	const fTu = momento('tu');
	const fSeguir = momento('seguir');
	const fNo = momento('no');
	const fCaso = momento('caso', {fin: true});

	const abre = interpolate(frame, [fTu - 8, fTu + 22], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const relojBrilla = interpolate(frame, [fTres - 4, fTres + 4, fTu], [0, 1, 0.4], clamp);
	const cartel = spring({frame: frame - fTu - 6, fps, config: {damping: 10, stiffness: 140}});
	const insiste = interpolate(frame, [fSeguir - 6, fSeguir + 4], [0, 1], clamp) * (1 - interpolate(frame, [fNo, fNo + 8], [0, 1], clamp));
	const tapa = spring({frame: frame - fNo + 2, fps, config: {damping: 12, stiffness: 150}});
	const baja = interpolate(frame, [fNo + 6, fCaso + 4], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const celu = interpolate(frame, [fNo + 4, fNo + 14], [1, 0.05], clamp) * (0.75 + 0.25 * Math.sin(t * 6) * insiste);

	const agita = 0.16 * Math.sin(t * 9) * insiste;
	const salto = 0.05 * Math.abs(Math.sin(t * 9)) * insiste;
	const mano: V3 = [0.52, 0.88 + salto - 0.12 * baja, -0.38];
	const codo: V3 = [0.68, 0.86 + salto * 0.5, -0.5];

	const sacudon = temblor(t, 0.3);
	const base = mezclar([1.45, 0.5, 0.6], [-0.45, 2.2, 3.2], abre);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([1.08, 0.0, -0.88], [0.4, 0.55, -0.6], abre);

	return (
		<Escenario3D fondo="radial-gradient(circle at 50% 35%, #3B2A8F 0%, #1E1660 55%, #0A0826 100%)" luces={false}>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche intensidad={0.85} />
			<pointLight position={[1.2, 0.2, -0.6]} intensity={1.2 * celu} distance={1.8} color="#9BD3FF" />
			<pointLight position={[1.0, 0.25, -0.85]} intensity={0.8 * relojBrilla} distance={1.2} color="#FF4D6D" />
			<Habitacion t={t} hora="3:00" />
			<Cama />
			<Durmiente
				t={t}
				abiertos={1.0}
				mirar={[0.85, 0.3]}
				cejas={-0.4}
				boca="linea"
				manta={-0.5}
				taparse={tapa}
				respira={0.5}
			/>
			<CelularChico brillo={celu} position={POS_CELU} rotation={[-Math.PI / 2, 0, 0.4]} scale={1.3} />

			{cartel > 0.01 ? (
				<>
					<group position={[POS_CEREBRO[0], POS_CEREBRO[1] + 0.04 * Math.sin(t * 1.5), POS_CEREBRO[2]]} rotation={[0.15, -0.5, 0]} scale={0.36 * cartel}>
						<CerebroConCara
							t={t}
							abiertos={baja > 0.3 ? 0.55 : 0.8 + 0.4 * tapa * (1 - baja)}
							mirar={[-0.7, -0.3]}
							brillo={0.3 + 0.4 * insiste}
							boca={baja > 0.3 ? 'nada' : 'sonrisa'}
						/>
					</group>
					<BrazoCerebro desde={HOMBRO} codo={codo} mano={mano} cerrar={0.9} escalaMano={0.6} />
					<group position={[mano[0], mano[1], mano[2]]} rotation={[0, -0.25, agita - 0.9 * baja]} scale={cartel}>
						<Cartel texto="ESCRIBILE" position={[-0.06, 0.3, 0.04]} scale={0.55} />
					</group>
				</>
			) : null}
			<Destellos t={t} cantidad={26} rango={[4, 2.5, 2]} centro={[0, 1.4, -1.1]} tamano={0.022} semilla="tres-am" colores={['#FFFFFF', '#B8C4FF']} opacidad={0.5} />
		</Escenario3D>
	);
};
