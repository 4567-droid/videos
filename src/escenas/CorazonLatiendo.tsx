import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Camara, temblor} from '../componentes/Camara';
import {Contador} from '../componentes/Contador';
import {Corazon3D, obtenerGeometriaCorazon} from '../componentes/Corazon3D';
import {Destellos, OndasLatido, Resplandor} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {TAU, type V3} from '../componentes/utilidades3d';
import {LISTA_PALETA, PALETA} from '../lib/colores';
import {useEscena} from '../lib/escena';
import {envolventeLatido} from '../lib/latido';

/**
 * Gancho: "Hoy tu corazón va a latir unas 100 mil veces..."
 * Un corazón gigante entra girando y late; cada latido suelta una onda.
 * Un contador sube de 0 a 100.000 mientras se dice el número.
 */

const BPM = 72;
const DESFASE = 0.78; // el primer latido llega enseguida

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const CorazonLatiendo: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fase = (t * BPM) / 60 + DESFASE;
	const latido = envolventeLatido(fase);

	// entrada con rebote y giro (adelantada: en el fotograma 0 ya se ve el corazón)
	const entrada = spring({frame: frame + 6, fps, config: {damping: 11, stiffness: 120, mass: 0.9}});
	const avance = Easing.inOut(Easing.cubic)(interpolate(frame, [0, duracion], [0, 1], clamp));

	// cámara: arranca cerca y se abre en órbita
	const angulo = -0.38 + 0.7 * avance;
	const distancia = 6.4 + 3.2 * avance;
	const sacudon = temblor(t, 1);
	const posicion: V3 = [
		Math.sin(angulo) * distancia + sacudon[0],
		0.35 + 0.7 * avance + sacudon[1],
		Math.cos(angulo) * distancia,
	];

	// contador sincronizado con "latir ... 100 mil veces"
	const desde = momento('latir');
	const hasta = momento('veces', {fin: true});
	const progreso = interpolate(frame, [desde, hasta + 4], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const aparicion = spring({frame: frame - desde + 4, fps, config: {damping: 14, stiffness: 140}});
	const pop = spring({frame: frame - hasta - 4, fps, config: {damping: 9, stiffness: 160}});

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 46%, #ff4f8b 0%, #c2187a 30%, #5a0f8a 64%, #1a0436 100%)"
			colorContraluz="#ffb3d1"
			overlay={
				<Contador
					valor={progreso * 100000}
					etiqueta="latidos hoy"
					color={PALETA.rojo}
					aparicion={aparicion}
					pop={pop}
				/>
			}
		>
			<Camara posicion={posicion} mirarA={[0, 0.05, 0]} />

			<group position={[0, 0.16, 0]} scale={entrada * 1.05} rotation={[0.08 * Math.sin(t * 1.1), (1 - entrada) * -3 + 0.28 * Math.sin(t * 0.9), 0]}>
				<Corazon3D latido={latido} color="#FF1F4B" brillo={1.1} />
			</group>
			<Resplandor color="#ff3d7f" escala={(7 + 2.5 * latido) * entrada} opacidad={0.55 + 0.35 * latido} position={[0, 0.16, -0.8]} />
			<OndasLatido fase={fase} bpm={BPM} t={t} position={[0, 0.16, -0.2]} color="#ffe0ea" radio={1.35} expansion={1} duracion={0.85} />

			<CorazonesOrbitando t={t} aparicion={spring({frame: frame - 8, fps, config: {damping: 16}})} />
			<Destellos t={t} cantidad={70} rango={[9, 12, 4]} centro={[0, 0, -1]} tamano={0.07} semilla="gancho" />
		</Escenario3D>
	);
};

/** Mini corazones de colores girando alrededor del principal. */
const CorazonesOrbitando: React.FC<{t: number; aparicion: number; cantidad?: number}> = ({
	t,
	aparicion,
	cantidad = 18,
}) => {
	const ref = useRef<THREE.InstancedMesh>(null);
	const datos = useMemo(
		() =>
			new Array(cantidad).fill(0).map((_, i) => ({
				radio: 2.3 + random(`orb-r-${i}`) * 1.5,
				angulo: random(`orb-a-${i}`) * TAU,
				vel: 0.35 + random(`orb-v-${i}`) * 0.35,
				altura: (random(`orb-y-${i}`) - 0.5) * 3.6,
				escala: 0.11 + random(`orb-s-${i}`) * 0.1,
				giro: random(`orb-g-${i}`) * TAU,
				color: LISTA_PALETA[i % LISTA_PALETA.length],
			})),
		[cantidad],
	);

	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const c = new THREE.Color();
		datos.forEach((d, i) => m.setColorAt(i, c.set(d.color)));
		if (m.instanceColor) m.instanceColor.needsUpdate = true;
	}, [datos]);

	useLayoutEffect(() => {
		const m = ref.current;
		if (!m) return;
		const o = new THREE.Object3D();
		datos.forEach((d, i) => {
			const a = d.angulo + t * d.vel;
			const k = Math.min(1, Math.max(0, aparicion * 1.6 - (i / cantidad) * 0.6));
			o.position.set(Math.cos(a) * d.radio, 0.3 + d.altura + 0.25 * Math.sin(t * 1.3 + i), Math.sin(a) * d.radio * 0.7);
			o.rotation.set(0.3 * Math.sin(t + i), d.giro + t * 1.5, 0.2 * Math.sin(t * 0.8 + i));
			o.scale.setScalar(d.escala * k);
			o.updateMatrix();
			m.setMatrixAt(i, o.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={ref} args={[obtenerGeometriaCorazon(), undefined, cantidad]} frustumCulled={false}>
			<meshStandardMaterial roughness={0.35} emissive="#330011" />
		</instancedMesh>
	);
};
