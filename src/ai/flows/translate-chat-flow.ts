'use server';

/**
 * @fileOverview A Genkit flow that translates text from one language to another.
 *
 * - translateChat - A function that translates text.
 * - TranslateChatInput - The input type for the translateChat function.
 * - TranslateChatOutput - The return type for the translateChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateChatInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Spanish", "French").'),
});
export type TranslateChatInput = z.infer<typeof TranslateChatInputSchema>;

const TranslateChatOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateChatOutput = z.infer<typeof TranslateChatOutputSchema>;


export async function translateChat(
  input: TranslateChatInput
): Promise<TranslateChatOutput> {
  return translateChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateChatPrompt',
  input: {schema: TranslateChatInputSchema},
  output: {schema: TranslateChatOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}}. Do not add any extra commentary, just provide the translated text.

Text to translate: {{{text}}}`,
});


const translateChatFlow = ai.defineFlow(
  {
    name: 'translateChatFlow',
    inputSchema: TranslateChatInputSchema,
    outputSchema: TranslateChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
