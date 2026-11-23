import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Abeja} from '../componentes/Abeja';
import {Calendario} from '../componentes/Calendario';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {FotoCara, Tilde} from '../componentes/Experimento';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Las abejas aprendieron a distinguirlas, y se acordaron días después."
 * La abeja elige bien (tilde). Las fotos cambian de lugar, el calendario pasa días
 * y la abeja vuelve a elegir la correcta en su nueva posición (segundo tilde).
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const suave = Easing.inOut(Easing.cubic);

const IZQ: V3 = [-0.66, -0.78, 0];
const DER: V3 = [0.66, -0.78, 0];
const ESCALA_FOTO = 0.64;

export const MemoriaDias: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fAprendieron = momento('aprendieron');
	const fDistinguir = momento('distinguirlas', {fin: true});
	const fAcordaron = momento('acordaron');
	const fDias = momento('días');
	const fDespues = momento('después', {fin: true});

	// 1) primera elección
	const vuelo1 = interpolate(frame, [fAprendieron - 2, fDistinguir - 4], [0, 1], {...clamp, easing: suave});
	const tilde1 = spring({frame: frame - fDistinguir + 4, fps, config: {damping: 9, stiffness: 170}});
	// 2) las fotos se cambian de lugar y pasan los días
	const cambio = interpolate(frame, [fAcordaron - 10, fAcordaron + 8], [0, 1], {...clamp, easing: suave});
	const avanceDias = interpolate(frame, [fAcordaron - 6, fDespues - 4], [0, 3], {...clamp, easing: Easing.inOut(Easing.quad)});
	// 3) segunda elección (la correcta ahora está a la derecha)
	const vuelo2 = interpolate(frame, [fAcordaron + 8, fDias + 6], [0, 1], {...clamp, easing: suave});
	const tilde2 = spring({frame: frame - fDias - 8, fps, config: {damping: 9, stiffness: 170}});

	// posiciones de las fotos (A = correcta) con un arco al cambiar
	const arcoCambio = Math.sin(cambio * Math.PI) * 0.45;
	const posA = mezclar(IZQ, DER, cambio);
	const posB = mezclar(DER, IZQ, cambio);
	posA[2] += arcoCambio;
	posB[2] -= arcoCambio * 0.6;

	// la abeja
	const centro: V3 = [0, -0.25, 1.05];
	const sobreA1: V3 = [IZQ[0] + 0.05, IZQ[1] + 0.62, 0.6];
	const sobreA2: V3 = [DER[0] - 0.05, DER[1] + 0.62, 0.6];
	const enMedio: V3 = [0, 0.05, 0.95];
	let p = mezclar(centro, sobreA1, vuelo1);
	const vuelve = interpolate(frame, [fAcordaron - 10, fAcordaron + 6], [0, 1], {...clamp, easing: suave});
	p = mezclar(p, enMedio, vuelve);
	p = mezclar(p, sobreA2, vuelo2);
	const posAbeja: V3 = [p[0], p[1] + 0.05 * Math.sin(t * 6.5), p[2]];
	const giro = -0.5 * vuelo1 * (1 - vuelve) + 0.5 * vuelo2 * (1 - tilde2);
	const festejo = Math.max(tilde1 * (1 - vuelve), tilde2);

	// cámara
	const sacudon = temblor(t, 0.6);
	const posicion: V3 = [0.25 * Math.sin(t * 0.5) + sacudon[0], 0.32 + sacudon[1], 6.7 - 0.25 * (frame / 145)];
	const mirarA: V3 = [0, 0.12, 0];

	const pTilde1 = proyectar([IZQ[0], IZQ[1] + 0.62, 0.15], posicion, mirarA, width, height);
	const pTilde2 = proyectar([DER[0], DER[1] + 0.62, 0.15], posicion, mirarA, width, height);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #FFE5D9 0%, #FFB5A7 34%, #F28482 64%, #6D2E46 100%)"
			colorContraluz="#FFF3B0"
			overlay={
				<>
					<Tilde x={pTilde1.x} y={pTilde1.y} aparicion={tilde1 * (1 - cambio)} tamano={130} />
					<Tilde x={pTilde2.x} y={pTilde2.y} aparicion={tilde2} tamano={130} />
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />

			<Calendario dias={[1, 2, 3, 4]} avance={avanceDias} position={[0, 0.92, -0.6]} rotation={[0.05, -0.08, 0]} scale={0.78} />

			<FotoCara variante="a" position={posA} scale={ESCALA_FOTO} acierto={Math.max(tilde1 * (1 - cambio), tilde2)} />
			<FotoCara variante="b" position={posB} scale={ESCALA_FOTO} />

			<Abeja
				t={t}
				position={posAbeja}
				rotation={[0.1, giro + 0.3 * festejo * Math.sin(t * 5), -0.15 * Math.sin((vuelo1 + vuelo2) * Math.PI)]}
				scale={0.36}
				mirada={[-0.5 * vuelo1 * (1 - vuelve) + 0.5 * vuelo2, -0.3 + 0.3 * festejo]}
				saludo={festejo}
				parpadeo={interpolate(frame, [fAcordaron, fAcordaron + 3, fAcordaron + 6], [0, 1, 0], clamp)}
			/>

			<Destellos t={t} cantidad={36} rango={[6, 7, 3]} centro={[0, 0.3, -1.5]} tamano={0.035} semilla="memoria" colores={['#FFFFFF', '#FFE5D9', '#FFF3B0']} />
		</Escenario3D>
	);
};
