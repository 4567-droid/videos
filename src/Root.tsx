import React from 'react';
import {Composition, Folder, type CalculateMetadataFunction} from 'remotion';
import videoJSON from '../data/video.json';
import vozJSON from '../data/voz.json';
import './lib/fuente';
import {ALTO, ANCHO, FPS, calcularLineaDeTiempo} from './lib/linea-de-tiempo';
import type {VideoJSON, VozJSON} from './lib/tipos';
import {Reel, filtrarVideo, type PropsReel} from './Reel';

const video = videoJSON as VideoJSON;
const voz = vozJSON as VozJSON;

const calcularMetadata: CalculateMetadataFunction<PropsReel> = ({props}) => ({
	durationInFrames: calcularLineaDeTiempo(filtrarVideo(props.video, props.soloEscena), props.voz, FPS).duracionTotal,
});

const idSeguro = (id: string) => id.replace(/[^a-zA-Z0-9-]/g, '-');

export const Root: React.FC = () => (
	<>
		<Composition
			id="Reel"
			component={Reel}
			width={ANCHO}
			height={ALTO}
			fps={FPS}
			durationInFrames={300}
			defaultProps={{video, voz, soloEscena: null}}
			calculateMetadata={calcularMetadata}
		/>
		{/* Cada escena por separado, cómodo para ajustar animaciones en el Studio */}
		<Folder name="Escenas">
			{video.escenas.map((escena, i) => (
				<Composition
					key={escena.id}
					id={`${String(i + 1).padStart(2, '0')}-${idSeguro(escena.id)}`}
					component={Reel}
					width={ANCHO}
					height={ALTO}
					fps={FPS}
					durationInFrames={150}
					defaultProps={{video, voz, soloEscena: escena.id}}
					calculateMetadata={calcularMetadata}
				/>
			))}
		</Folder>
	</>
);
