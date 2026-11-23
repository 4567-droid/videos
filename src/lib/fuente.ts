import {loadFont} from '@remotion/fonts';
import interLatin900 from '@fontsource/inter/files/inter-latin-900-normal.woff2';
import interLatinExt900 from '@fontsource/inter/files/inter-latin-ext-900-normal.woff2';
import interLatin700 from '@fontsource/inter/files/inter-latin-700-normal.woff2';

/** Inter Black (900) local: no depende de internet al renderizar. */
export const FUENTE = 'Inter';

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

loadFont({family: FUENTE, url: interLatin900, weight: '900', unicodeRange: LATIN});
loadFont({family: FUENTE, url: interLatinExt900, weight: '900'});
loadFont({family: FUENTE, url: interLatin700, weight: '700', unicodeRange: LATIN});
