import React, {useMemo} from 'react';
import {random} from 'remotion';
import * as THREE from 'three';
import {Avatar, type Animacion} from './Avatar';
import type {V3} from './utilidades3d';

const PELO = new THREE.MeshStandardMaterial({color: '#F4F4F6', roughness: 0.9, flatShading: true});
const PIEL = new THREE.MeshStandardMaterial({color: '#F2C29B', roughness: 0.7, flatShading: true});
const GEO_MECHON = new THREE.IcosahedronGeometry(1, 0);
const GEO_ESFERA = new THREE.SphereGeometry(1, 16, 12);

/** Pelo blanco revuelto, bigote tupido y nariz (van dentro de la cabeza del Avatar). */
const RasgosEinstein: React.FC<{t: number}> = ({t}) => {
	const mechones = useMemo(
		() =>
			new Array(18).fill(0).map((_, i) => {
				// alrededor de la cabeza, sin tapar la cara
				const a = -Math.PI + (i / 17) * Math.PI * 2 * 0.86 + Math.PI * 0.07 + (random(`ein-a-${i}`) - 0.5) * 0.25;
				const alto = 0.16 + random(`ein-y-${i}`) * 0.2;
				const r = 0.205 + random(`ein-r-${i}`) * 0.035;
				const x = Math.sin(a) * r;
				const z = Math.cos(a) * r - 0.03;
				const frente = z > 0.1 && alto < 0.33;
				return {
					pos: [x * (frente ? 1.25 : 1.05), 0.17 + alto * 0.55 + (frente ? 0.08 : 0), frente ? z - 0.09 : z] as V3,
					s: 0.055 + random(`ein-s-${i}`) * 0.045,
					rot: [random(`ein-rx-${i}`) * 3, random(`ein-ry-${i}`) * 3, 0] as V3,
					fase: random(`ein-f-${i}`) * 6,
				};
			}),
		[],
	);
	return (
		<group>
			{mechones.map((m, i) => (
				<mesh
					key={i}
					geometry={GEO_MECHON}
					material={PELO}
					position={[m.pos[0], m.pos[1] + 0.006 * Math.sin(t * 3 + m.fase), m.pos[2]]}
					rotation={m.rot}
					scale={m.s}
				/>
			))}
			{/* bigote: dos mitades caídas */}
			{[-1, 1].map((lado) => (
				<mesh key={lado} geometry={GEO_ESFERA} material={PELO} position={[lado * 0.038, 0.132, 0.183]} rotation={[0, 0, lado * -0.35]} scale={[0.048, 0.022, 0.025]} />
			))}
			<mesh geometry={GEO_ESFERA} material={PIEL} position={[0, 0.158, 0.2]} scale={0.03} />
		</group>
	);
};

/** Einstein estilo muñeco: pelo blanco despeinado, bigote, suéter gris. */
export const Einstein: React.FC<{
	t: number;
	animacion?: Animacion;
	mezcla?: {animacion: Animacion; peso: number}[];
	expresion?: 'feliz' | 'preocupada';
	position?: V3;
	rotation?: V3;
	scale?: number;
	sombra?: boolean;
}> = ({t, animacion = 'reposo', mezcla, expresion = 'feliz', position, rotation, scale = 1, sombra = true}) => (
	<Avatar
		t={t}
		animacion={animacion}
		mezcla={mezcla}
		expresion={expresion}
		cejas
		colores={{piel: '#F2C29B', remera: '#7D8597', pantalon: '#33415C', zapatillas: '#3D2B1F', pelo: '#F4F4F6'}}
		cabeza={<RasgosEinstein t={t} />}
		position={position}
		rotation={rotation}
		scale={scale}
		sombra={sombra}
	/>
);
