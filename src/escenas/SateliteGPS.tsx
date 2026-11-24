import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camara, proyectar, temblor} from '../componentes/Camara';
import {Celular, Satelite} from '../componentes/Ciencia';
import {Contador} from '../componentes/Contador';
import {Escenario3D} from '../componentes/Escenario3D';
import {Etiqueta} from '../componentes/Etiqueta';
import {Estrellas, Planeta} from '../componentes/Planeta';
import {Reloj3D} from '../componentes/Reloj';
import type {V3} from '../componentes/utilidades3d';
import {useEscena} from '../lib/escena';

/**
 * "Y esto no es solo teoría: los satélites del GPS corrigen sus relojes todos los días por
 * este efecto. Sin eso, tu mapa fallaría por kilómetros."
 * Un satélite orbita la Tierra y ajusta su reloj (+38 µs por día). Después aparece un
 * celular: el punto azul se aleja del lugar real y el contador marca los kilómetros de error.
 */

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const suave = Easing.inOut(Easing.cubic);
const mezclar = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const TIERRA: V3 = [0, -2.0, 0];

export const SateliteGPS: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {momento} = useEscena();
	const t = frame / fps;

	const fSatelites = momento('satélites');
	const fCorrigen = momento('corrigen');
	const fEfecto = momento('efecto', {fin: true});
	const fSin = momento('sin');
	const fFallaria = momento('fallaría');
	const fKm = momento('kilómetros', {fin: true});

	// satélite en órbita (arco por arriba de la Tierra)
	const ang = 1.2 + 0.18 * Math.sin(t * 0.5) + t * 0.05;
	const posSat: V3 = [TIERRA[0] + Math.cos(ang) * 2.45, TIERRA[1] + Math.sin(ang) * 2.45, 0.3];
	const entraSat = spring({frame: frame - fSatelites + 10, fps, config: {damping: 12}});

	// el reloj del satélite se corrige (salta un poquito hacia atrás con un destello)
	const ajuste = interpolate(frame, [fCorrigen, fCorrigen + 6], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	const horaSat = 8 + t * 0.5 - 0.35 * ajuste;
	const destello = interpolate(frame, [fCorrigen, fCorrigen + 4, fEfecto], [0, 1, 0], clamp);
	const etiquetaAjuste = spring({frame: frame - fCorrigen - 2, fps, config: {damping: 12}}) * (1 - interpolate(frame, [fSin - 6, fSin + 4], [0, 1], clamp));

	// señal del satélite a la Tierra
	const pulsos = [0, 1, 2].map((i) => (t * 0.9 + i / 3) % 1);

	// parte 2: celular con el mapa
	const celular = spring({frame: frame - fSin + 4, fps, config: {damping: 13, stiffness: 100}});
	const desvio = interpolate(frame, [fFallaria - 4, fKm + 4], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
	const km = interpolate(frame, [fFallaria - 4, fKm + 4], [0, 10], {...clamp, easing: Easing.inOut(Easing.quad)});
	const aparicionKm = spring({frame: frame - fFallaria + 6, fps, config: {damping: 13}});
	const pop = spring({frame: frame - fKm - 4, fps, config: {damping: 9, stiffness: 160}});

	// cámara
	const aCelular = interpolate(frame, [fSin - 8, fSin + 12], [0, 1], {...clamp, easing: suave});
	const sacudon = temblor(t, 0.5);
	const base = mezclar([0.35 * Math.sin(t * 0.3), 0.1, 7.4], [0, 0.2, 6.0], aCelular);
	const posicion: V3 = [base[0] + sacudon[0], base[1] + sacudon[1], base[2]];
	const mirarA = mezclar([0, -0.15, 0], [0, -0.15, 1.6], aCelular);

	const relojSat: V3 = [posSat[0] - 1.15, posSat[1] + 0.15, posSat[2] + 0.2];
	const pAjuste = proyectar([relojSat[0], relojSat[1] - 0.55, relojSat[2]], posicion, mirarA, width, height);

	return (
		<Escenario3D
			fondo="radial-gradient(circle at 50% 30%, #1D3557 0%, #10204A 40%, #070F2B 75%, #02040F 100%)"
			colorContraluz="#7DF9FF"
			overlay={
				<>
					<Etiqueta x={Math.max(230, pAjuste.x)} y={pAjuste.y + 30} texto="+38 µs por día" aparicion={etiquetaAjuste} fondo="#06D6A0" color="#052E1F" tamano={42} anclaje="centro" />
					<Contador valor={km} sufijo=" km" etiqueta="de error en un día" color="#EF233C" aparicion={aparicionKm} pop={pop} top={1380} />
				</>
			}
		>
			<Camara posicion={posicion} mirarA={mirarA} />
			<Estrellas />

			<Planeta radio={1.6} arboles={false} angulo={t * 0.12} position={TIERRA} rotation={[0.35, t * 0.15, 0]} />

			<group scale={entraSat}>
				<Satelite t={t} position={posSat} rotation={[0.3, t * 0.4, ang - Math.PI / 2]} scale={0.8} />
				<Reloj3D hora={horaSat} t={t} color="#06D6A0" brillo={destello} position={relojSat} scale={0.34} />
				{/* ondas de señal hacia la Tierra */}
				{pulsos.map((k, i) => {
					const p = mezclar(posSat, [TIERRA[0] + 0.2, TIERRA[1] + 1.6, 0.3], k);
					return (
						<mesh key={i} position={p} rotation={[0, 0, ang]} scale={0.12 + 0.25 * k}>
							<torusGeometry args={[1, 0.08, 6, 32, Math.PI]} />
							<meshBasicMaterial color="#7DF9FF" transparent opacity={0.8 * (1 - k)} toneMapped={false} depthWrite={false} />
						</mesh>
					);
				})}
			</group>

			{/* el celular entra desde abajo */}
			<group position={[0, -3.6 * (1 - celular), 1.6]} scale={celular}>
				<Celular t={t} desvio={desvio} rotation={[-0.08, 0.12 * Math.sin(t * 0.8), 0]} scale={0.92} />
			</group>
		</Escenario3D>
	);
};
