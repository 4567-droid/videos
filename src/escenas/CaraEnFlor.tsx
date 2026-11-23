import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, temblor} from '../componentes/Camara';
import {CaraFlor} from '../componentes/CaraFlor';
import {Destellos} from '../componentes/Efectos';
import {Escenario3D} from '../componentes/Escenario3D';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "¿Cómo lo hacen? Tratan tu cara como si fuera una flor: un patrón de formas que se repite."
 * Se marcan ojos y boca como un patrón; el pelo se abre en pétalos, la piel pasa a ser
 * el centro de la flor y los rasgos se convierten en un espiral de semillas.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);

export const CaraEnFlor: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {momento, duracion} = useEscena();
	const t = frame / fps;

	const fComo = momento('cómo');
	const fHacen = momento('hacen', {fin: true});
	const fComo2 = momento('como', {ocurrencia: 2});
	const fFlor = momento('flor', {fin: true});
	const fPatron = momento('patrón');
	const fFormas = momento('formas', {fin: true});
	const fRepite = momento('repite', {fin: true});

	const marcas = interpolate(frame, [fComo, fHacen, fPatron - 4, fPatron + 8], [0, 1, 1, 0], {...clamp, easing: suave});
	const petalos = interpolate(frame, [fComo2 - 4, fFlor + 4], [0, 1], {...clamp, easing: suave});
	const centro = interpolate(frame, [fComo2 + 4, fFlor + 6], [0, 1], {...clamp, easing: suave});
	const rasgos = interpolate(frame, [fPatron, fFormas], [1, 0], {...clamp, easing: suave});
	const semillas = interpolate(frame, [fPatron - 2, fRepite + 4], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const ola = interpolate(frame, [fFormas - 6, fRepite], [0, 1], clamp);
	const parpadeo = Math.max(
		interpolate(frame, [12, 15, 18], [0, 1, 0], clamp),
		interpolate(frame, [fComo2 - 6, fComo2 - 3, fComo2], [0, 1, 0], clamp),
	);

	// cámara: cerca de la cara y se abre a medida que crecen los pétalos
	const sacudon = temblor(t, 0.6);
	const abrir = suave(Math.min(1, petalos * 1.1));
	const orbita = -0.25 + 0.45 * (frame / duracion);
	const distancia = 5.4 + 2.9 * abrir;
	const posicion: V3 = [
		Math.sin(orbita) * distancia + sacudon[0],
		0.35 + 0.25 * abrir + sacudon[1],
		Math.cos(orbita) * distancia,
	];

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 40%, #E9FFDB 0%, #95E06C 34%, #3FA34D 66%, #1B4332 100%)"
			colorContraluz="#FFF3B0"
		>
			<Camara posicion={posicion} mirarA={[0, 0.08 - 0.25 * abrir, 0]} />
			<CaraFlor
				t={t}
				petalos={petalos}
				centro={centro}
				rasgos={rasgos}
				semillas={semillas}
				marcas={marcas}
				tallo={petalos}
				ola={ola}
				parpadeo={parpadeo}
				mirada={[0.15 * Math.sin(t * 1.3), 0]}
				position={[0, 0.25, 0]}
				rotation={[0, 0, 0.12 * petalos * Math.sin(t * 1.4)]}
				scale={0.95}
			/>
			<Destellos t={t} cantidad={50} rango={[7, 8, 3]} centro={[0, 0.5, -1.8]} tamano={0.04} semilla="flor" colores={['#FFFFFF', '#FFF3B0', '#FFC8DD']} />
		</Escenario3D>
	);
};
