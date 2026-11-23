import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Abeja} from '../componentes/Abeja';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {Cerebro, Neuronas} from '../componentes/Cerebro';
import {Contador} from '../componentes/Contador';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {FUENTE} from '../lib/fuente';
import {useEscena} from '../lib/escena';

/**
 * "Su cerebro tiene apenas un millón de neuronas. El tuyo, más de ochenta mil millones."
 * Primer plano de una abejita mirando su cerebro diminuto; en "El tuyo" la cámara se abre
 * y aparece un cerebro humano enorme. El contador sube de 1 millón a 80 mil millones.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const POS_ABEJA: V3 = [-0.95, -0.62, 0.5];
const POS_MINI: V3 = [-0.95, -0.02, 0.5];
const POS_GRANDE: V3 = [0.45, 0.68, -0.6];

export const CerebrosComparados: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fMillon = momento('millón');
	const fNeuronas = momento('neuronas');
	const fEl = momento('El');
	const fTuyo = momento('tuyo');
	const fMas = momento('más');
	const fFin = momento('millones', {fin: true});

	// cámara: de cerca de la abejita → plano general con el cerebro gigante
	const abrir = interpolate(frame, [fEl - 6, fTuyo + 8], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const acercar = interpolate(frame, [0, fEl - 6], [0, 1], clamp);
	const sacudon = temblor(t, 0.6);
	const base = mezclar([-0.82 + 0.05 * acercar, -0.18, 2.75 - 0.35 * acercar], [0.3, 0.2, 7.4], abrir);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([-0.95, -0.16, 0.5], [0.05, 0.12, 0], abrir);

	// cerebro gigante: aparece con rebote en "tuyo"
	const grande = spring({frame: frame - fTuyo + 6, fps, config: {damping: 12, stiffness: 90, mass: 1.1}});
	const neuronasGrande = interpolate(frame, [fMas, fFin], [0, 1], clamp);

	// contador: escala logarítmica de 1 millón a 80 mil millones
	const progreso = interpolate(frame, [fMas - 2, fFin + 2], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const valor = Math.pow(10, 6 + progreso * Math.log10(80000));
	const aparicion = spring({frame: frame - fMas + 6, fps, config: {damping: 14}});
	const pop = spring({frame: frame - fFin - 2, fps, config: {damping: 9, stiffness: 160}});

	// etiqueta "1 millón" junto al cerebrito
	const etiqueta = spring({frame: frame - fMillon + 2, fps, config: {damping: 12}});
	const pEtiqueta = proyectar([POS_MINI[0], POS_MINI[1] + 0.16, POS_MINI[2]], posicion, mirarA, width, height);

	// la abejita mira su cerebro y después, asombrada, el gigante
	const asombro = interpolate(frame, [fTuyo, fTuyo + 6], [0, 1], clamp);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #E0AAFF 0%, #9D4EDD 36%, #5A189A 68%, #240046 100%)"
			colorContraluz="#FFB3D9"
			overlay={
				<>
					{etiqueta > 0.01 ? (
						<div
							style={{
								position: 'absolute',
								left: pEtiqueta.x,
								top: pEtiqueta.y,
								transform: `translate(-50%, -100%) scale(${etiqueta * (1 - 0.35 * abrir)})`,
								transformOrigin: '50% 100%',
								padding: '12px 26px',
								borderRadius: 999,
								background: '#FFFFFF',
								color: '#7B2CBF',
								fontFamily: FUENTE,
								fontWeight: 900,
								fontSize: 44,
								whiteSpace: 'nowrap',
								boxShadow: '0 8px 0 rgba(0,0,0,0.25)',
							}}
						>
							1.000.000
						</div>
					) : null}
					<Contador valor={valor} etiqueta="neuronas humanas" color="#FF4D8D" aparicion={aparicion} pop={pop} />
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />

			{/* abejita y su cerebro diminuto */}
			<Abeja
				t={t}
				position={[POS_ABEJA[0], POS_ABEJA[1] + 0.03 * Math.sin(t * 7), POS_ABEJA[2]]}
				rotation={[0.1, 0.35 + 0.25 * asombro, 0]}
				scale={0.3}
				mirada={[0.6 * asombro, 0.9 - 0.3 * asombro]}
				sorpresa={asombro}
				parpadeo={interpolate(frame, [40, 43, 46], [0, 1, 0], clamp)}
			/>
			<Cerebro position={[POS_MINI[0], POS_MINI[1] + 0.02 * Math.sin(t * 3), POS_MINI[2]]} rotation={[0.2, -0.6 + t * 0.4, 0]} scale={0.11} brillo={0.6} />
			<Neuronas t={t} cantidad={14} progreso={interpolate(frame, [fMillon, fNeuronas + 6], [0, 1], clamp)} position={POS_MINI} scale={0.13} tamano={0.12} semilla="mini" />

			{/* cerebro humano gigante */}
			<group position={POS_GRANDE} scale={grande}>
				<Cerebro rotation={[0.25, -0.75 + 0.15 * Math.sin(t * 0.6), 0]} scale={1.2} brillo={0.3 + 0.5 * neuronasGrande} />
				<Neuronas t={t} cantidad={320} progreso={neuronasGrande} rotation={[0.25, -0.75, 0]} scale={1.2} tamano={0.028} semilla="grande" />
			</group>

			<Destellos t={t} cantidad={40} rango={[7, 8, 4]} centro={[0, 0.2, -2]} tamano={0.04} semilla="cerebros" colores={['#FFFFFF', '#E0AAFF', '#7DF9FF']} />
		</Escenario3D>
	);
};
