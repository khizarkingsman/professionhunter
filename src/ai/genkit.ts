'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
const {next} = require('@genkit-ai/next');

export const ai = genkit({
  plugins: [googleAI(), next()],
  model: 'googleai/gemini-1.5-flash',
});
