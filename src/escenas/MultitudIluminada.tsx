import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara, temblor} from '../componentes/Camara';
import {Contador} from '../componentes/Contador';
import {Destellos, Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {LucesNoche} from '../componentes/Dormir';
import {useTexturaCanvas} from '../componentes/texturas';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Se llama parálisis del sueño, y le pasa a cerca del ocho por ciento de las personas."
 * Una multitud de 100 muñequitos en penumbra; al decir "ocho por ciento" se iluminan 8
 * (con un haz de luz desde arriba) y aparece el contador 8 %.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const COLUMNAS = 10;
const FILAS = 10;
const SEP_X = 0.42;
const SEP_Z = 0.62;
const COLORES = ['#3E3F99', '#4B3AA6', '#2F4F95', '#5B3FA8', '#3A5AA0', '#46358F'];
// los 8 que se iluminan (columna, fila): repartidos en la zona central para que se vean
const ILUMINADOS: [number, number][] = [
	[2, 1],
	[6, 2],
	[4, 3],
	[8, 4],
	[1, 5],
	[5, 6],
	[3, 7],
	[7, 8],
];

type Persona = {x: number; z: number; color: string; fase: number; iluminado: number};

const crearMultitud = (): Persona[] => {
	const lista: Persona[] = [];
	for (let f = 0; f < FILAS; f++) {
		for (let c = 0; c < COLUMNAS; c++) {
			const idx = ILUMINADOS.findIndex(([ci, fi]) => ci === c && fi === f);
			lista.push({
				x: (c - (COLUMNAS - 1) / 2) * SEP_X + (random(`mx${c}-${f}`) - 0.5) * 0.12,
				z: (f - (FILAS - 1) / 2) * SEP_Z - 0.3 + (random(`mz${c}-${f}`) - 0.5) * 0.14,
				color: COLORES[Math.floor(random(`mc${c}-${f}`) * COLORES.length)],
				fase: random(`mf${c}-${f}`) * 6.28,
				iluminado: idx,
			});
		}
	}
	return lista;
};

const CUERPO = new THREE.CapsuleGeometry(0.13, 0.3, 3, 8);
const CABEZA = new THREE.IcosahedronGeometry(0.125, 1);

/** Los que no se iluminan: dos InstancedMesh (cuerpos y cabezas). */
const Penumbra: React.FC<{personas: Persona[]; t: number; aparicion: (p: Persona) => number}> = ({personas, t, aparicion}) => {
	const cuerpos = useRef<THREE.InstancedMesh>(null);
	const cabezas = useRef<THREE.InstancedMesh>(null);
	const lista = personas.filter((p) => p.iluminado < 0);
	const aux = useMemo(() => new THREE.Object3D(), []);
	const color = useMemo(() => new THREE.Color(), []);
	useLayoutEffect(() => {
		lista.forEach((p, i) => {
			const s = aparicion(p);
			const bob = 0.015 * Math.sin(t * 2 + p.fase);
			aux.position.set(p.x, 0.28 * s + bob, p.z);
			aux.rotation.set(0, 0.3 * Math.sin(t * 0.7 + p.fase), 0.04 * Math.sin(t * 1.3 + p.fase));
			aux.scale.setScalar(Math.max(0.001, s));
			aux.updateMatrix();
			cuerpos.current?.setMatrixAt(i, aux.matrix);
			aux.position.set(p.x, 0.7 * s + bob, p.z);
			aux.updateMatrix();
			cabezas.current?.setMatrixAt(i, aux.matrix);
			cuerpos.current?.setColorAt(i, color.set(p.color));
			cabezas.current?.setColorAt(i, color.set('#B9A3E3'));
		});
		for (const m of [cuerpos.current, cabezas.current]) {
			if (!m) continue;
			m.instanceMatrix.needsUpdate = true;
			if (m.instanceColor) m.instanceColor.needsUpdate = true;
		}
	});
	return (
		<>
			<instancedMesh ref={cuerpos} args={[CUERPO, undefined, lista.length]}>
				<meshStandardMaterial flatShading roughness={0.7} />
			</instancedMesh>
			<instancedMesh ref={cabezas} args={[CABEZA, undefined, lista.length]}>
				<meshStandardMaterial flatShading roughness={0.7} />
			</instancedMesh>
		</>
	);
};

const dibujarHaz = (ctx: CanvasRenderingContext2D) => {
	const g = ctx.createLinearGradient(0, 0, 0, 256);
	g.addColorStop(0, 'rgba(255,240,180,0)');
	g.addColorStop(0.55, 'rgba(255,230,150,0.35)');
	g.addColorStop(1, 'rgba(255,220,120,0.9)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 64, 256);
};

/** Haz de luz desde arriba (cono con degradé). Va dentro del canvas: la textura usa hooks de R3F. */
const HazDeLuz: React.FC<{l: number}> = ({l}) => {
	const haz = useTexturaCanvas('haz-luz', 64, 256, dibujarHaz);
	return haz ? (
		<mesh position={[0, 1.05, 0]} scale={[l, 1, l]}>
			<cylinderGeometry args={[0.06, 0.36, 2.1, 20, 1, true]} />
			<meshBasicMaterial
				map={haz}
				transparent
				opacity={0.85 * Math.min(1, l)}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
				side={THREE.DoubleSide}
				toneMapped={false}
			/>
		</mesh>
	) : null;
};

export const MultitudIluminada: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;
	const personas = useMemo(crearMultitud, []);

	const fOcho = momento('ocho');
	const fPersonas = momento('personas', {fin: true});

	const aparicion = (p: Persona) => {
		const fila = Math.round((p.z + 0.3) / SEP_Z + (FILAS - 1) / 2);
		return spring({frame: frame + 8 - (FILAS - 1 - fila) * 1.5 - Math.abs(p.x) * 2, fps, config: {damping: 12, stiffness: 140}});
	};
	const luz = (i: number) => spring({frame: frame - fOcho + 4 - i * 2.5, fps, config: {damping: 11, stiffness: 150}});
	const contador = spring({frame: frame - fOcho + 2, fps, config: {damping: 13}});
	const valor = interpolate(frame, [fOcho - 2, fOcho + 22], [0, 8], {...clamp, easing: Easing.out(Easing.cubic)});
	const pop = spring({frame: frame - fPersonas, fps, config: {damping: 9, stiffness: 160}});

	// cámara: baja y avanza despacio sobre la multitud
	const k = frame / duracion;
	const sacudon = temblor(t, 0.5);
	const posicion: V3 = [0.3 + 0.5 * Math.sin(t * 0.4) + sacudon[0], 4.3 - 0.4 * k + sacudon[1], 6.5 - 0.9 * k];
	const mirarA: V3 = [0, 0.45, -0.5];

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 30%, #4A2FA0 0%, #2A1B75 40%, #120B45 75%, #06041C 100%)"
			luces={false}
			overlay={
				<Contador
					valor={valor}
					sufijo=" %"
					etiqueta="de las personas"
					color="#FFB703"
					aparicion={contador}
					pop={pop}
					top={1360}
					texto={`${Math.round(valor)} %`}
				/>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.15} />
			<mesh position={[0, -0.01, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[6, 48]} />
				<meshStandardMaterial color="#251A63" roughness={0.95} />
			</mesh>
			<Penumbra personas={personas} t={t} aparicion={aparicion} />
			{personas
				.filter((p) => p.iluminado >= 0)
				.map((p) => {
					const s = aparicion(p);
					const l = luz(p.iluminado);
					const salto = 0.12 * Math.max(0, Math.sin(Math.PI * Math.min(1, l)));
					const bob = 0.015 * Math.sin(t * 2 + p.fase);
					return (
						<group key={`${p.x}-${p.z}`} position={[p.x, salto + bob, p.z]} scale={Math.max(0.001, s)}>
							<mesh geometry={CUERPO} position={[0, 0.28, 0]}>
								<meshStandardMaterial
									color={l > 0.5 ? '#FFD23F' : p.color}
									emissive="#FFB703"
									emissiveIntensity={0.9 * l}
									flatShading
									roughness={0.5}
								/>
							</mesh>
							<mesh geometry={CABEZA} position={[0, 0.7, 0]}>
								<meshStandardMaterial color={l > 0.5 ? '#FFE8B8' : '#B9A3E3'} emissive="#FFD23F" emissiveIntensity={0.6 * l} flatShading />
							</mesh>
							{l > 0.01 ? (
								<>
									<Resplandor color="#FFD23F" escala={1.3 * l} opacidad={0.7 * l} position={[0, 0.5, 0]} />
									<HazDeLuz l={l} />
									<mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={l}>
										<circleGeometry args={[0.36, 24]} />
										<meshBasicMaterial color="#FFD23F" transparent opacity={0.5} toneMapped={false} depthWrite={false} />
									</mesh>
								</>
							) : null}
						</group>
					);
				})}
			<Destellos t={t} cantidad={50} rango={[8, 4, 6]} centro={[0, 2.4, -1.5]} tamano={0.035} semilla="multitud" colores={['#FFFFFF', '#B8C4FF', '#FFD23F']} opacidad={0.7} />
		</Escenario3D>
	);
};
