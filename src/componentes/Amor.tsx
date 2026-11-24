import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {FUENTE} from '../lib/fuente';
import {obtenerGeometriaCorazon} from './Corazon3D';
import {cajaRedondeada} from './Dormir';
import {Resplandor} from './Efectos';
import {Segmento} from './Segmento';
import {useTexturaCanvas} from './texturas';
import {limitar, texturaResplandor, type V3} from './utilidades3d';

/**
 * Piezas de la serie "corazón y cerebro" (por qué cuesta dejar un amor): manos de dibujito
 * para el cerebro, frasco, carrito, globo con forma de corazón, cartel, escáner de
 * resonancia, portarretrato con foto borrosa, celular chico, sol, nubes, zonas que brillan
 * dentro del cerebro y un corazón roto en SVG.
 */

const ESFERA = new THREE.SphereGeometry(1, 18, 12);
const ARRIBA = new THREE.Vector3(0, 1, 0);

/** Mano de dibujito (guante). Los dedos apuntan a +Y y la palma mira a +Z. `cerrar` 0..1 cierra los dedos. */
export const Mano: React.FC<{
	cerrar?: number;
	color?: string;
	position?: V3;
	rotation?: V3;
	quaternion?: THREE.Quaternion;
	scale?: number;
}> = ({cerrar = 0, color = '#FFFFFF', position, rotation, quaternion, scale = 1}) => {
	const mat = useMemo(() => new THREE.MeshStandardMaterial({color, roughness: 0.55}), [color]);
	useEffect(() => () => mat.dispose(), [mat]);
	const k = limitar(cerrar);
	return (
		<group position={position} rotation={rotation} quaternion={quaternion} scale={scale}>
			<mesh geometry={ESFERA} material={mat} scale={[0.13, 0.12, 0.075]} />
			{[-0.075, -0.025, 0.025, 0.075].map((x, i) => (
				<group key={i} position={[x, 0.085, 0]} rotation={[k * 1.7, 0, (i - 1.5) * -0.1]}>
					<mesh material={mat} position={[0, 0.05, 0]}>
						<capsuleGeometry args={[0.03, 0.075 - Math.abs(i - 1.5) * 0.014, 3, 8]} />
					</mesh>
				</group>
			))}
			<group position={[0.115, -0.01, 0.02]} rotation={[0.4 * k, 0, -0.95 + 0.55 * k]}>
				<mesh material={mat} position={[0, 0.045, 0]}>
					<capsuleGeometry args={[0.032, 0.05, 3, 8]} />
				</mesh>
			</group>
			<mesh material={mat} position={[0, -0.125, 0]}>
				<cylinderGeometry args={[0.09, 0.075, 0.07, 14]} />
			</mesh>
		</group>
	);
};

/** Brazo de goma del cerebro: de `desde` al `codo` y a la muñeca (`mano`), con un guante al final. */
export const BrazoCerebro: React.FC<{
	desde: V3;
	codo: V3;
	mano: V3;
	cerrar?: number;
	/** giro de la mano alrededor del brazo (radianes) */
	giroMano?: number;
	color?: string;
	escalaMano?: number;
}> = ({desde, codo, mano, cerrar = 0, giroMano = 0, color = '#F27BA0', escalaMano = 1}) => {
	const mat = useMemo(() => new THREE.MeshStandardMaterial({color, roughness: 0.5}), [color]);
	useEffect(() => () => mat.dispose(), [mat]);
	const dir = new THREE.Vector3(mano[0] - codo[0], mano[1] - codo[1], mano[2] - codo[2]).normalize();
	const q = new THREE.Quaternion().setFromUnitVectors(ARRIBA, dir);
	if (giroMano) q.multiply(new THREE.Quaternion().setFromAxisAngle(ARRIBA, giroMano));
	const d = 0.16 * escalaMano;
	return (
		<group>
			<Segmento desde={desde} hasta={codo} radio={0.05} material={mat} />
			<Segmento desde={codo} hasta={mano} radio={0.05} material={mat} />
			<Mano cerrar={cerrar} quaternion={q} position={[mano[0] + dir.x * d, mano[1] + dir.y * d, mano[2] + dir.z * d]} scale={escalaMano} />
		</group>
	);
};

const dibujarEtiquetaCorazon = (ctx: CanvasRenderingContext2D) => {
	ctx.fillStyle = '#FFF7F0';
	ctx.beginPath();
	ctx.roundRect(8, 8, 240, 240, 40);
	ctx.fill();
	ctx.fillStyle = '#FF6B8B';
	ctx.beginPath();
	ctx.moveTo(128, 196);
	ctx.bezierCurveTo(60, 150, 40, 110, 52, 84);
	ctx.bezierCurveTo(64, 56, 108, 54, 128, 90);
	ctx.bezierCurveTo(148, 54, 192, 56, 204, 84);
	ctx.bezierCurveTo(216, 110, 196, 150, 128, 196);
	ctx.fill();
};

/** Frasco de vidrio vacío (con miguitas) y una etiqueta con un corazón. La tapa queda al costado. */
export const Frasco: React.FC<{posTapa?: V3; position?: V3; rotation?: V3; scale?: number}> = ({posTapa = [0.75, 0.05, 0.15], position, rotation, scale = 1}) => {
	const etiqueta = useTexturaCanvas('etiqueta-corazon', 256, 256, dibujarEtiquetaCorazon);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh position={[0, 0.48, 0]} renderOrder={2}>
				<cylinderGeometry args={[0.42, 0.4, 0.95, 36, 1, true]} />
				<meshStandardMaterial color="#D6ECFF" transparent opacity={0.3} roughness={0.05} metalness={0.1} side={THREE.DoubleSide} depthWrite={false} />
			</mesh>
			<mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.4, 32]} />
				<meshStandardMaterial color="#BFE0FF" transparent opacity={0.55} roughness={0.1} />
			</mesh>
			<mesh position={[0, 0.955, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<torusGeometry args={[0.42, 0.035, 8, 36]} />
				<meshStandardMaterial color="#EEF7FF" transparent opacity={0.8} roughness={0.1} />
			</mesh>
			{/* brillo del vidrio */}
			<mesh position={[-0.24, 0.5, 0.33]} rotation={[0, -0.6, 0]}>
				<planeGeometry args={[0.07, 0.7]} />
				<meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
			</mesh>
			{[
				[0.12, 0.08],
				[-0.1, -0.12],
				[0.02, 0.15],
				[-0.18, 0.06],
			].map(([x, z], i) => (
				<mesh key={i} geometry={ESFERA} position={[x, 0.035, z]} scale={0.025 + 0.008 * i}>
					<meshStandardMaterial color="#E8C9A0" roughness={0.9} />
				</mesh>
			))}
			{etiqueta ? (
				<mesh position={[0, 0.45, 0.415]}>
					<planeGeometry args={[0.36, 0.36]} />
					<meshBasicMaterial map={etiqueta} transparent toneMapped={false} />
				</mesh>
			) : null}
			{/* tapa apoyada al costado */}
			<group position={posTapa} rotation={[0, 0, posTapa[0] > 0 ? 0.12 : -0.12]}>
				<mesh>
					<cylinderGeometry args={[0.46, 0.46, 0.1, 32]} />
					<meshStandardMaterial color="#FF8FAB" roughness={0.45} />
				</mesh>
				<mesh position={[0, 0.08, 0]}>
					<sphereGeometry args={[0.07, 12, 8]} />
					<meshStandardMaterial color="#FFFFFF" roughness={0.4} />
				</mesh>
			</group>
		</group>
	);
};

const dibujarRejilla = (ctx: CanvasRenderingContext2D) => {
	ctx.clearRect(0, 0, 256, 256);
	ctx.strokeStyle = '#E9E5FF';
	ctx.lineWidth = 9;
	for (let i = 0; i <= 256; i += 42) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i, 256);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0, i);
		ctx.lineTo(256, i);
		ctx.stroke();
	}
};

const dibujarCartelCarrito = (ctx: CanvasRenderingContext2D) => {
	ctx.fillStyle = '#FFD23F';
	ctx.beginPath();
	ctx.roundRect(6, 6, 500, 180, 36);
	ctx.fill();
	ctx.fillStyle = '#3A2A80';
	ctx.font = `900 62px ${FUENTE}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('PEDIDOS', 256, 66);
	ctx.fillText('HABITUALES', 256, 132);
};

/** Carrito de supermercado con el cartel "PEDIDOS HABITUALES". Lo de adentro va en children (canasto: y 0.45–1.0). */
export const Carrito: React.FC<{t: number; rueda?: number; position?: V3; rotation?: V3; scale?: number; children?: React.ReactNode}> = ({
	rueda = 0,
	position,
	rotation,
	scale = 1,
	children,
}) => {
	const rejilla = useTexturaCanvas('rejilla-carrito', 256, 256, dibujarRejilla);
	const cartel = useTexturaCanvas('cartel-pedidos', 512, 192, dibujarCartelCarrito, true);
	const lados: {pos: V3; rot: V3; tam: [number, number]}[] = [
		{pos: [0, 0.45, 0], rot: [-Math.PI / 2, 0, 0], tam: [1.0, 0.7]},
		{pos: [0, 0.72, 0.35], rot: [0, 0, 0], tam: [1.0, 0.55]},
		{pos: [0, 0.72, -0.35], rot: [0, 0, 0], tam: [1.0, 0.55]},
		{pos: [0.5, 0.72, 0], rot: [0, Math.PI / 2, 0], tam: [0.7, 0.55]},
		{pos: [-0.5, 0.72, 0], rot: [0, Math.PI / 2, 0], tam: [0.7, 0.55]},
	];
	return (
		<group position={position} rotation={rotation} scale={scale}>
			{rejilla
				? lados.map((l, i) => (
						<mesh key={i} position={l.pos} rotation={l.rot}>
							<planeGeometry args={l.tam} />
							<meshStandardMaterial map={rejilla} transparent alphaTest={0.3} side={THREE.DoubleSide} color="#C9C2F2" metalness={0.4} roughness={0.35} />
						</mesh>
					))
				: null}
			{/* borde de arriba y manija */}
			{[
				{pos: [0, 1.0, 0.35] as V3, tam: [1.04, 0.04, 0.04] as V3},
				{pos: [0, 1.0, -0.35] as V3, tam: [1.04, 0.04, 0.04] as V3},
				{pos: [0.5, 1.0, 0] as V3, tam: [0.04, 0.04, 0.74] as V3},
				{pos: [-0.5, 1.0, 0] as V3, tam: [0.04, 0.04, 0.74] as V3},
			].map((b, i) => (
				<mesh key={i} position={b.pos}>
					<boxGeometry args={b.tam} />
					<meshStandardMaterial color="#B8B0E8" metalness={0.5} roughness={0.3} />
				</mesh>
			))}
			<mesh position={[-0.68, 1.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.045, 0.045, 0.78, 12]} />
				<meshStandardMaterial color="#FF5DA2" roughness={0.4} />
			</mesh>
			<Segmento desde={[-0.5, 1.0, 0.33]} hasta={[-0.68, 1.12, 0.33]} radio={0.02} material={MAT_METAL} />
			<Segmento desde={[-0.5, 1.0, -0.33]} hasta={[-0.68, 1.12, -0.33]} radio={0.02} material={MAT_METAL} />
			{/* patas y ruedas */}
			{[
				[-0.42, 0.28],
				[0.42, 0.28],
				[-0.42, -0.28],
				[0.42, -0.28],
			].map(([x, z], i) => (
				<group key={i}>
					<Segmento desde={[x, 0.45, z]} hasta={[x, 0.1, z]} radio={0.02} material={MAT_METAL} extremos={false} />
					<mesh position={[x, 0.07, z]} rotation={[rueda, 0, Math.PI / 2]}>
						<cylinderGeometry args={[0.07, 0.07, 0.05, 14]} />
						<meshStandardMaterial color="#2B2D42" roughness={0.6} />
					</mesh>
				</group>
			))}
			{cartel ? (
				<mesh position={[0.05, 0.74, 0.37]}>
					<planeGeometry args={[0.78, 0.29]} />
					<meshBasicMaterial map={cartel} transparent toneMapped={false} />
				</mesh>
			) : null}
			{children}
		</group>
	);
};

const MAT_METAL = new THREE.MeshStandardMaterial({color: '#B8B0E8', metalness: 0.5, roughness: 0.3});

/** Corazón 3D chico (para cargar en el carrito, el globo, etc.). */
export const CorazonChico: React.FC<{color?: string; brillo?: number; position?: V3; rotation?: V3; scale?: number}> = ({
	color = '#FF6B8B',
	brillo = 0.15,
	position,
	rotation,
	scale = 1,
}) => (
	<mesh geometry={obtenerGeometriaCorazon('bajo')} position={position} rotation={rotation} scale={scale}>
		<meshStandardMaterial color={color} emissive={color} emissiveIntensity={brillo} roughness={0.3} />
	</mesh>
);

/** Globo con forma de corazón, con nudo e hilo que cuelga `largoHilo` hacia abajo (el extremo del hilo es el origen). */
export const GloboCorazon: React.FC<{t: number; largoHilo?: number; position?: V3; scale?: number}> = ({t, largoHilo = 1.2, position, scale = 1}) => {
	const geo = obtenerGeometriaCorazon('alto');
	const base = useMemo(() => {
		geo.computeBoundingBox();
		return geo.boundingBox!.min.y;
	}, [geo]);
	const escalaGlobo = 0.55;
	const nudo = -base * escalaGlobo; // el globo arriba del nudo
	const vaiven = 0.12 * Math.sin(t * 1.7);
	const medio: V3 = [vaiven * 0.6, largoHilo * 0.5, 0];
	const arriba: V3 = [vaiven, largoHilo, 0];
	return (
		<group position={position} scale={scale}>
			<Segmento desde={[0, 0, 0]} hasta={medio} radio={0.009} material={MAT_HILO} extremos={false} />
			<Segmento desde={medio} hasta={arriba} radio={0.009} material={MAT_HILO} extremos={false} />
			<group position={arriba} rotation={[0, 0.3 * Math.sin(t * 0.9), vaiven * -0.4]}>
				<mesh position={[0, 0.03, 0]}>
					<coneGeometry args={[0.05, 0.07, 10]} />
					<meshStandardMaterial color="#E84A6F" roughness={0.4} />
				</mesh>
				<mesh geometry={geo} position={[0, nudo + 0.05, 0]} scale={escalaGlobo}>
					<meshStandardMaterial color="#FF6B8B" emissive="#FF3D6E" emissiveIntensity={0.18} roughness={0.22} metalness={0.05} />
				</mesh>
				<mesh position={[-0.16, nudo + 0.05 + 0.25, 0.42]} scale={[0.07, 0.11, 0.02]} geometry={ESFERA}>
					<meshBasicMaterial color="#FFFFFF" transparent opacity={0.55} toneMapped={false} />
				</mesh>
			</group>
		</group>
	);
};

const MAT_HILO = new THREE.MeshStandardMaterial({color: '#FFFFFF', roughness: 0.6});

/** Cartel en un palito, con texto (y un corazón chiquito). */
export const Cartel: React.FC<{texto: string; colorTexto?: string; position?: V3; rotation?: V3; scale?: number}> = ({
	texto,
	colorTexto = '#E8336D',
	position,
	rotation,
	scale = 1,
}) => {
	const textura = useTexturaCanvas(
		`cartel-${texto}`,
		512,
		224,
		(ctx) => {
			ctx.fillStyle = '#FFFFFF';
			ctx.beginPath();
			ctx.roundRect(4, 4, 504, 216, 30);
			ctx.fill();
			ctx.strokeStyle = colorTexto;
			ctx.lineWidth = 10;
			ctx.beginPath();
			ctx.roundRect(16, 16, 480, 192, 22);
			ctx.stroke();
			ctx.fillStyle = colorTexto;
			ctx.font = `900 ${Math.min(96, Math.floor(760 / texto.length))}px ${FUENTE}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(texto, 256, 104);
			// corazoncito abajo
			ctx.beginPath();
			ctx.moveTo(256, 196);
			ctx.bezierCurveTo(232, 182, 224, 170, 230, 162);
			ctx.bezierCurveTo(236, 154, 250, 156, 256, 166);
			ctx.bezierCurveTo(262, 156, 276, 154, 282, 162);
			ctx.bezierCurveTo(288, 170, 280, 182, 256, 196);
			ctx.fill();
		},
		true,
	);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh position={[0, -0.75, -0.03]}>
				<cylinderGeometry args={[0.035, 0.035, 1.0, 10]} />
				<meshStandardMaterial color="#C89F7A" roughness={0.7} />
			</mesh>
			<mesh geometry={cajaRedondeada(1.22, 0.56, 0.05, 0.03)}>
				<meshStandardMaterial color="#FFFFFF" roughness={0.6} />
			</mesh>
			{textura ? (
				<mesh position={[0, 0, 0.027]}>
					<planeGeometry args={[1.2, 0.525]} />
					<meshBasicMaterial map={textura} toneMapped={false} />
				</mesh>
			) : null}
		</group>
	);
};

/** Escáner de resonancia: anillo grande con base y una camilla que entra (`entrar` 0..1). Children va sobre la camilla. */
export const Escaner: React.FC<{t: number; entrar: number; escaneo?: number; position?: V3; rotation?: V3; scale?: number; children?: React.ReactNode}> = ({
	t,
	entrar,
	escaneo = 0,
	position,
	rotation,
	scale = 1,
	children,
}) => {
	const zCamilla = 1.55 - 1.55 * limitar(entrar);
	const barrido = Math.sin(t * 2.4);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh scale={[1, 1, 1.5]}>
				<torusGeometry args={[1.05, 0.44, 24, 56]} />
				<meshStandardMaterial color="#F3F1FF" roughness={0.35} />
			</mesh>
			<mesh position={[0, 0, 0.66]}>
				<torusGeometry args={[1.05, 0.06, 10, 56]} />
				<meshStandardMaterial color="#B8A9FF" emissive="#8F7BFF" emissiveIntensity={0.3} roughness={0.4} />
			</mesh>
			{/* luz adentro del túnel */}
			<mesh position={[0, 0, 0.3]}>
				<torusGeometry args={[0.62, 0.025, 8, 48]} />
				<meshBasicMaterial color="#7DF9FF" toneMapped={false} />
			</mesh>
			<mesh position={[0.62, 0.55, 0.62]}>
				<sphereGeometry args={[0.045, 10, 8]} />
				<meshBasicMaterial color={escaneo > 0.1 ? '#2EE59D' : '#FFD23F'} toneMapped={false} />
			</mesh>
			<mesh position={[0, -1.35, 0]} geometry={cajaRedondeada(1.7, 0.5, 1.3, 0.08)}>
				<meshStandardMaterial color="#DCD6FF" roughness={0.5} />
			</mesh>
			{/* plano de escaneo que barre */}
			{escaneo > 0.01 ? (
				<mesh position={[0, -0.1, 0.25 * barrido]}>
					<circleGeometry args={[0.6, 40]} />
					<meshBasicMaterial color="#7DF9FF" transparent opacity={0.22 * escaneo} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
				</mesh>
			) : null}
			{/* camilla */}
			<group position={[0, -0.5, zCamilla]}>
				<mesh geometry={cajaRedondeada(0.72, 0.1, 2.1, 0.04)}>
					<meshStandardMaterial color="#FFFFFF" roughness={0.5} />
				</mesh>
				<mesh position={[0, 0.06, 0]} geometry={cajaRedondeada(0.62, 0.04, 1.9, 0.02)}>
					<meshStandardMaterial color="#A6E3FF" roughness={0.6} />
				</mesh>
				{children}
			</group>
			{/* soporte de la camilla */}
			<mesh position={[0, -1.05, 1.5]} geometry={cajaRedondeada(0.5, 0.9, 0.7, 0.06)}>
				<meshStandardMaterial color="#DCD6FF" roughness={0.5} />
			</mesh>
		</group>
	);
};

const dibujarFotoBorrosa = (ctx: CanvasRenderingContext2D) => {
	const g = ctx.createLinearGradient(0, 0, 0, 512);
	g.addColorStop(0, '#FFD6C2');
	g.addColorStop(1, '#B9A7E8');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 400, 512);
	ctx.filter = 'blur(16px)';
	ctx.fillStyle = '#7A5C8E';
	ctx.beginPath();
	ctx.ellipse(200, 210, 78, 92, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(200, 470, 160, 130, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#F2B49A';
	ctx.beginPath();
	ctx.ellipse(200, 235, 58, 70, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#FF8FAB';
	ctx.beginPath();
	ctx.ellipse(200, 470, 120, 100, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.filter = 'none';
};

/** Portarretrato parado con una foto borrosa (una persona sin rasgos). */
export const Portarretrato: React.FC<{position?: V3; rotation?: V3; scale?: number}> = ({position, rotation, scale = 1}) => {
	const foto = useTexturaCanvas('foto-borrosa', 400, 512, dibujarFotoBorrosa);
	return (
		<group position={position} rotation={rotation} scale={scale}>
			<mesh geometry={cajaRedondeada(1.0, 1.24, 0.09, 0.05)}>
				<meshStandardMaterial color="#F4B9C8" roughness={0.5} />
			</mesh>
			{foto ? (
				<mesh position={[0, 0, 0.046]}>
					<planeGeometry args={[0.8, 1.02]} />
					<meshBasicMaterial map={foto} toneMapped={false} />
				</mesh>
			) : null}
			<mesh position={[0, -0.25, -0.22]} rotation={[0.45, 0, 0]}>
				<boxGeometry args={[0.2, 0.8, 0.04]} />
				<meshStandardMaterial color="#E6A5B6" roughness={0.5} />
			</mesh>
		</group>
	);
};

/** Celular chico con la pantalla encendida (`brillo` 0..1). La pantalla mira a +Z. */
export const CelularChico: React.FC<{brillo?: number; position?: V3; rotation?: V3; scale?: number}> = ({brillo = 1, position, rotation, scale = 1}) => (
	<group position={position} rotation={rotation} scale={scale}>
		<mesh geometry={cajaRedondeada(0.1, 0.19, 0.016, 0.012)}>
			<meshStandardMaterial color="#2B2D42" roughness={0.4} />
		</mesh>
		<mesh position={[0, 0, 0.0085]}>
			<planeGeometry args={[0.086, 0.168]} />
			<meshBasicMaterial color={new THREE.Color('#1B2340').lerp(new THREE.Color('#A8DBFF'), brillo)} toneMapped={false} />
		</mesh>
		{brillo > 0.02 ? <Resplandor color="#8CCBFF" escala={0.55 * brillo} opacidad={0.55 * brillo} position={[0, 0, 0.03]} /> : null}
	</group>
);

/** Zona que brilla "adentro" del cerebro (se dibuja encima de todo). */
export const ZonaBrillo: React.FC<{color: string; intensidad: number; escala?: number; position?: V3}> = ({color, intensidad, escala = 1, position}) =>
	intensidad > 0.01 ? (
		<group position={position}>
			<sprite scale={[0.9 * escala, 0.9 * escala, 1]} renderOrder={20}>
				<spriteMaterial map={texturaResplandor()} color={color} transparent opacity={0.9 * intensidad} blending={THREE.AdditiveBlending} depthTest={false} depthWrite={false} toneMapped={false} />
			</sprite>
			<sprite scale={[0.3 * escala, 0.3 * escala, 1]} renderOrder={21}>
				<spriteMaterial map={texturaResplandor()} color="#FFFFFF" transparent opacity={0.8 * intensidad} blending={THREE.AdditiveBlending} depthTest={false} depthWrite={false} toneMapped={false} />
			</sprite>
		</group>
	) : null;

/** Sol (para el amanecer): disco con halo grande. */
export const Sol: React.FC<{brillo?: number; position?: V3; scale?: number}> = ({brillo = 1, position, scale = 1}) => (
	<group position={position} scale={scale}>
		<Resplandor color="#FFB36B" escala={9} opacidad={0.55 * brillo} />
		<Resplandor color="#FFE29A" escala={4.2} opacidad={0.7 * brillo} />
		<mesh>
			<circleGeometry args={[1, 48]} />
			<meshBasicMaterial color="#FFF1C1" toneMapped={false} />
		</mesh>
	</group>
);

/** Nube esponjosa (esferas). */
export const Nube: React.FC<{color?: string; opacidad?: number; position?: V3; scale?: number}> = ({color = '#FFFFFF', opacidad = 0.95, position, scale = 1}) => (
	<group position={position} scale={scale}>
		{[
			[0, 0, 0.5],
			[-0.55, -0.12, 0.36],
			[0.55, -0.1, 0.4],
			[-0.22, 0.26, 0.38],
			[0.28, 0.24, 0.34],
		].map(([x, y, r], i) => (
			<mesh key={i} geometry={ESFERA} position={[x, y, 0]} scale={[r, r * 0.85, r * 0.5]}>
				<meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.95} transparent opacity={opacidad} />
			</mesh>
		))}
	</group>
);

/** Corazón roto en SVG (capa HTML). `separar` 0..1 abre la grieta. */
export const CorazonRoto: React.FC<{x: number; y: number; tamano?: number; aparicion: number; separar: number}> = ({x, y, tamano = 190, aparicion, separar}) => {
	if (aparicion <= 0.01) return null;
	const camino = 'M50 90 C20 68 3 48 3 30 C3 13 15 3 29 3 C39 3 46 9 50 17 C54 9 61 3 71 3 C85 3 97 13 97 30 C97 48 80 68 50 90 Z';
	const s = separar;
	return (
		<svg
			width={tamano}
			height={tamano}
			viewBox="0 0 100 100"
			style={{
				position: 'absolute',
				left: x - tamano / 2,
				top: y - tamano / 2,
				opacity: Math.min(1, aparicion * 1.4),
				transform: `scale(${0.6 + 0.4 * aparicion})`,
				filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))',
				overflow: 'visible',
			}}
		>
			<defs>
				<clipPath id="mitad-izq">
					<polygon points="0,0 50,0 50,17 44,33 55,47 45,61 53,76 50,95 0,95" />
				</clipPath>
				<clipPath id="mitad-der">
					<polygon points="50,0 100,0 100,95 50,95 53,76 45,61 55,47 44,33 50,17" />
				</clipPath>
			</defs>
			<g transform={`translate(${-6 * s} ${2 * s}) rotate(${-9 * s} 50 90)`}>
				<path d={camino} clipPath="url(#mitad-izq)" fill="#FF6B8B" stroke="#FFFFFF" strokeWidth="3" />
			</g>
			<g transform={`translate(${6 * s} ${2 * s}) rotate(${9 * s} 50 90)`}>
				<path d={camino} clipPath="url(#mitad-der)" fill="#FF6B8B" stroke="#FFFFFF" strokeWidth="3" />
			</g>
		</svg>
	);
};
