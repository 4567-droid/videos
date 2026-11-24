import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrazoCerebro, Carrito, CorazonChico} from '../componentes/Amor';
import {Avatar} from '../componentes/Avatar';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {LucesNoche} from '../componentes/Dormir';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import {Etiqueta} from '../componentes/Etiqueta';
import {CerebroConCara} from '../componentes/Interruptor';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "O sea: no es debilidad ni falta de voluntad. Tu cerebro sigue pidiendo algo a lo que se acostumbró."
 * La persona tiene los hombros tensos y los suelta con un suspiro. Después la cámara pasa al
 * cerebro, que empuja un carrito de "PEDIDOS HABITUALES" lleno de corazones: cae uno más.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const POS_CARRITO: V3 = [0.85, 0, -0.5];
const ESC_CARRITO = 0.75;
const CORAZONES: {p: V3; r: number; c: string}[] = [
	{p: [-0.22, 0.62, 0.05], r: 0.3, c: '#FF6B8B'},
	{p: [0.15, 0.6, -0.12], r: -0.4, c: '#FF8FAB'},
	{p: [-0.02, 0.76, 0.12], r: 0.8, c: '#FF5C8A'},
	{p: [0.3, 0.7, 0.1], r: -0.2, c: '#FF6B8B'},
	{p: [-0.32, 0.74, -0.16], r: 0.5, c: '#FF8FAB'},
];

export const PedidosHabituales: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fNo = momento('no');
	const fVoluntad = momento('voluntad', {fin: true});
	const fTu = momento('tu');
	const fPidiendo = momento('pidiendo');

	// hombros tensos → se sueltan con un suspiro
	const suelta = interpolate(frame, [fNo - 2, fVoluntad], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const suspiro = interpolate(frame, [fNo + 10, fVoluntad + 10], [0, 1], clamp);
	// el carrito avanza un poco y cae un corazón más
	const avanza = interpolate(frame, [fTu, fPidiendo + 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const cae = spring({frame: frame - fPidiendo, fps, config: {damping: 9, stiffness: 120}});
	const masUno = spring({frame: frame - fPidiendo - 8, fps, config: {damping: 11, stiffness: 160}});

	// cámara: la persona → paneo hacia el cerebro con el carrito
	const paneo = interpolate(frame, [fTu - 14, fTu + 22], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const sacudon = temblor(t, 0.3);
	const base = mezclar([-0.2, 1.3, 4.6], [0.75, 1.4, 4.5], paneo);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([-0.4, 1.2, 0], [0.5, 1.1, -0.4], paneo);

	const xCarrito = POS_CARRITO[0] + 0.12 * avanza;
	const asa = (lado: number): V3 => [xCarrito - 0.68 * ESC_CARRITO, 1.12 * ESC_CARRITO, POS_CARRITO[2] + lado * 0.24 * ESC_CARRITO];
	const pMas = proyectar([xCarrito + 0.25, 1.15, POS_CARRITO[2]], posicion, mirarA, width, height);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #5E4294 0%, #3A2A76 55%, #1A1040 100%)"
			luces={false}
			overlay={<Etiqueta x={Math.min(900, pMas.x)} y={Math.max(600, pMas.y)} texto="+1" aparicion={masUno} fondo="#FF6B8B" color="#FFFFFF" tamano={48} anclaje="centro" />}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<LucesNoche luz={0.55} />
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<circleGeometry args={[5, 48]} />
				<meshStandardMaterial color="#3A2A7A" roughness={0.95} />
			</mesh>

			<Avatar
				t={t}
				animacion="reposo"
				cejas
				expresion={suelta > 0.6 ? 'serena' : 'preocupada'}
				encoger={1 - suelta}
				colores={{remera: '#8E7CC3', pantalon: '#3A3270', zapatillas: '#E9E5FF', pelo: '#2B1B12'}}
				position={[-0.7, 0, 0.3]}
				rotation={[0, 0.25, 0]}
			/>
			{/* suspiro */}
			{suspiro > 0.01 && suspiro < 0.99
				? [0, 1, 2].map((i) => {
						const c = Math.min(1, suspiro * 1.4 - i * 0.15);
						return c > 0 ? (
							<mesh key={i} position={[-0.62 + 0.1 * c, 1.72 + 0.1 * c, 0.55 + 0.35 * c]} scale={0.04 + 0.07 * c}>
								<sphereGeometry args={[1, 12, 8]} />
								<meshBasicMaterial color="#E6E9FF" transparent opacity={0.45 * (1 - c)} depthWrite={false} toneMapped={false} />
							</mesh>
						) : null;
					})
				: null}

			<Carrito t={t} rueda={avanza * 2} position={[xCarrito, 0, POS_CARRITO[2]]} scale={ESC_CARRITO}>
				{CORAZONES.map((h, i) => (
					<CorazonChico key={i} color={h.c} position={h.p} rotation={[0.2, h.r, 0.1]} scale={0.14} />
				))}
				{cae > 0.01 ? <CorazonChico color="#FF5C8A" brillo={0.4} position={[0.05, 1.7 - 0.85 * cae, 0]} rotation={[0.1, t * 2, 0]} scale={0.15} /> : null}
			</Carrito>

			<group position={[0.05, 1.42 + 0.03 * Math.sin(t * 1.6), -0.75]} rotation={[0.15, 0.4, 0]} scale={0.4}>
				<CerebroConCara t={t} abiertos={1.05} mirar={[0.5, -0.4]} brillo={0.35} boca="sonrisa" />
			</group>
			<BrazoCerebro desde={[0.24, 1.3, -0.62]} codo={[0.34, 1.12, -0.48]} mano={asa(1)} cerrar={0.85} escalaMano={0.7} />
			<BrazoCerebro desde={[0.2, 1.3, -0.9]} codo={[0.33, 1.08, -0.86]} mano={asa(-1)} cerrar={0.85} escalaMano={0.7} />

			<Destellos t={t} cantidad={34} rango={[5, 3, 2]} centro={[0.2, 1.7, -1]} tamano={0.025} semilla="pedidos" colores={['#FFFFFF', '#FFD6E0', '#FFD23F']} opacidad={0.6} />
		</Escenario3D>
	);
};
