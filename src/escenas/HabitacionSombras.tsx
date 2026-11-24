import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara, temblor} from '../componentes/Camara';
import {Cama, Durmiente, Habitacion, LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {texturaRadial, type V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Y como todavía está medio soñando, mucha gente siente o ve cosas que no están ahí."
 * Cuarto en penumbra: sombras suaves y formas borrosas (una figura alta junto a la ventana,
 * manchas que flotan). El muñeco las mira con los ojos bien abiertos; al decir
 * "no están ahí" se deshacen en destellos.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const bruma = () =>
	texturaRadial('bruma', [
		[0, 'rgba(255,255,255,0.95)'],
		[0.35, 'rgba(255,255,255,0.6)'],
		[0.7, 'rgba(255,255,255,0.18)'],
		[1, 'rgba(255,255,255,0)'],
	]);

/** Mancha borrosa oscura (sprite con degradé). */
const Mancha: React.FC<{position: V3; escala: [number, number]; opacidad: number; color?: string}> = ({position, escala, opacidad, color = '#06021C'}) =>
	opacidad > 0.005 ? (
		<sprite position={position} scale={[escala[0], escala[1], 1]}>
			<spriteMaterial map={bruma()} color={color} transparent opacity={opacidad} depthWrite={false} fog={false} />
		</sprite>
	) : null;

const MANCHAS: {base: V3; escala: [number, number]; vel: number; fase: number}[] = [
	{base: [0.35, 1.55, -1.2], escala: [0.9, 0.6], vel: 0.35, fase: 0},
	{base: [-0.75, 0.25, -0.1], escala: [0.8, 0.5], vel: 0.3, fase: 2},
	{base: [-1.7, 1.6, -1.0], escala: [0.7, 0.9], vel: 0.25, fase: 4},
	{base: [-0.2, 2.0, -1.3], escala: [1.1, 0.5], vel: 0.2, fase: 1},
];

export const HabitacionSombras: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fMedio = momento('medio');
	const fSiente = momento('siente');
	const fCosas = momento('cosas', {fin: true});
	const fNo = momento('no');
	const fAhi = momento('ahí', {fin: true});

	const aparece = interpolate(frame, [0, fMedio + 10], [0.25, 0.6], clamp);
	const define = interpolate(frame, [fSiente - 4, fCosas], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const deshace = interpolate(frame, [fNo - 2, fAhi + 4], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const opacidad = (aparece + 0.3 * define) * (1 - deshace);
	const crece = 1 + 0.35 * deshace;
	const ojosFigura = define * (1 - deshace) * (0.6 + 0.4 * Math.sin(t * 5));
	const chispas = spring({frame: frame - fNo, fps, config: {damping: 14}}) * (1 - interpolate(frame, [fAhi + 10, fAhi + 30], [0, 1], clamp));

	// el muñeco mira las formas (a su derecha, hacia la ventana) y se calma cuando desaparecen
	const miraFigura = interpolate(frame, [fMedio, fMedio + 10], [0, 1], clamp) * (1 - deshace);
	const mirar: [number, number] = [-0.9 * miraFigura + 0.3 * Math.sin(t * 2.2) * (1 - miraFigura), 0.35 * miraFigura];
	const abiertos = 1.3 - 0.3 * deshace;

	// la figura alta se mece
	const xFig = -1.25 + 0.06 * Math.sin(t * 0.9);
	const respiraFig = 1 + 0.04 * Math.sin(t * 1.7);

	const avance = interpolate(frame, [0, 200], [0, 1], clamp);
	const sacudon = temblor(t, 0.6);
	const base = mezclar([1.45, 2.0, 3.35], [1.12, 1.78, 2.75], avance);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([-0.45, 0.8, -0.8], [-0.32, 0.72, -0.8], avance);

	return (
		<Escenario3D fondo="radial-gradient(circle at 40% 35%, #2B1F70 0%, #150F45 55%, #05031A 100%)" luces={false}>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche intensidad={0.62} />
			<pointLight position={[-0.7, 1.2, -0.6]} intensity={1.2} distance={3.5} color="#8EA2FF" />
			<Habitacion t={t} luna={1} colorPared="#251C63" />
			<Cama />
			<Durmiente t={t} abiertos={abiertos} mirar={mirar} cejas={-1 + deshace} boca="o" abrirBoca={0.4 - 0.25 * deshace} temblor={0.25 * (1 - deshace)} manta={-0.5} respira={0.8} />

			{/* figura alta y borrosa junto a la ventana */}
			<Mancha position={[xFig, 1.62, -1.3]} escala={[0.62 * crece, 0.62 * crece]} opacidad={0.95 * opacidad} />
			<Mancha position={[xFig + 0.02, 1.0, -1.32]} escala={[1.0 * crece * respiraFig, 1.5 * crece]} opacidad={0.9 * opacidad} />
			<Mancha position={[xFig, 0.35, -1.34]} escala={[0.95 * crece, 1.1 * crece]} opacidad={0.75 * opacidad} />
			{[-1, 1].map((lado) => (
				<sprite key={lado} position={[xFig + lado * 0.08, 1.64, -1.25]} scale={[0.09, 0.07, 1]}>
					<spriteMaterial map={bruma()} color="#D6C9FF" transparent opacity={0.5 * ojosFigura} blending={THREE.AdditiveBlending} depthWrite={false} />
				</sprite>
			))}

			{/* manchas que flotan */}
			{MANCHAS.map((m, i) => (
				<Mancha
					key={i}
					position={[m.base[0] + 0.25 * Math.sin(t * m.vel + m.fase), m.base[1] + 0.12 * Math.sin(t * m.vel * 1.4 + m.fase), m.base[2]]}
					escala={[m.escala[0] * crece, m.escala[1] * crece]}
					opacidad={0.7 * opacidad}
				/>
			))}

			{chispas > 0.01 ? (
				<Destellos t={t} cantidad={50} rango={[2.2, 2.4, 1.2]} centro={[-0.9, 1.1, -1.1]} tamano={0.04 * chispas} semilla="sombras" colores={['#FFFFFF', '#D6C9FF', '#FFD23F']} />
			) : null}
			<Destellos t={t} cantidad={24} rango={[4, 2.5, 2]} centro={[0, 1.5, -1.0]} tamano={0.022} semilla="sombras-fondo" colores={['#B8C4FF', '#FFFFFF']} opacidad={0.5} />
		</Escenario3D>
	);
};
