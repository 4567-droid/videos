import {ThreeCanvas} from '@remotion/three';
import React, {useContext} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {EscenaContext} from '../lib/escena';
import {TRANSICION} from '../lib/linea-de-tiempo';

type Props = {
	/** Fondo CSS detrás del canvas (degradé de colores vivos). */
	fondo: string;
	/** Contenido 3D (mallas, luces extra, <Camara/>). */
	children: React.ReactNode;
	/** Capa HTML por encima del 3D (contadores, etiquetas). */
	overlay?: React.ReactNode;
	/** Luces por defecto (key + relleno + contraluz). */
	luces?: boolean;
	colorContraluz?: string;
	vineta?: boolean;
};

export const LucesBase: React.FC<{colorContraluz?: string}> = ({colorContraluz = '#7DF9FF'}) => (
	<>
		<hemisphereLight args={['#ffffff', '#4b2a7a', 1.2]} />
		<directionalLight position={[4, 7, 6]} intensity={2.7} color="#fff3e0" />
		<directionalLight position={[-6, 3, -5]} intensity={2} color={colorContraluz} />
		<ambientLight intensity={0.25} />
	</>
);

/** Lienzo 3D a pantalla completa con fondo, luces y viñeta. */
export const Escenario3D: React.FC<Props> = ({
	fondo,
	children,
	overlay,
	luces = true,
	colorContraluz,
	vineta = true,
}) => {
	const {width, height} = useVideoConfig();
	const frame = useCurrentFrame();
	const escena = useContext(EscenaContext);
	// La capa HTML (contadores, etiquetas) se va antes de la transición de salida,
	// así no se superpone con la de la escena siguiente.
	const ultimaEscena = !escena || escena.esUltima;
	const opacidadOverlay = ultimaEscena
		? 1
		: interpolate(frame, [escena.duracion - TRANSICION, escena.duracion - TRANSICION + 7], [1, 0], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			});
	return (
		<AbsoluteFill style={{background: fondo}}>
			<ThreeCanvas
				width={width}
				height={height}
				flat
				dpr={1}
				gl={{antialias: true}}
				camera={{fov: 45, near: 0.1, far: 400, position: [0, 0, 10]}}
			>
				{luces ? <LucesBase colorContraluz={colorContraluz} /> : null}
				{children}
			</ThreeCanvas>
			{vineta ? (
				<AbsoluteFill
					style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.42) 100%)'}}
				/>
			) : null}
			{overlay && opacidadOverlay > 0 ? <AbsoluteFill style={{opacity: opacidadOverlay}}>{overlay}</AbsoluteFill> : null}
		</AbsoluteFill>
	);
};
