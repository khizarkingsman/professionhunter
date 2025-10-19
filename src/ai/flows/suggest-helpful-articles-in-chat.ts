'use server';

/**
 * @fileOverview A Genkit flow that suggests helpful articles or how-to snippets based on the chat history between two users.
 *
 * - suggestHelpfulArticles - A function that suggests helpful articles based on chat history.
 * - SuggestHelpfulArticlesInput - The input type for the suggestHelpfulArticles function.
 * - SuggestHelpfulArticlesOutput - The return type for the suggestHelpfulArticles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestHelpfulArticlesInputSchema = z.object({
  chatHistory: z
    .string()
    .describe('The complete chat history between the two users.'),
  userProfession: z
    .string()
    .describe('The profession of the user requesting help, e.g., plumber, electrician.'),
});
export type SuggestHelpfulArticlesInput = z.infer<typeof SuggestHelpfulArticlesInputSchema>;

const SuggestHelpfulArticlesOutputSchema = z.object({
  suggestedArticleSnippet: z
    .string()
    .describe('A snippet of a suggested article or how-to guide relevant to the chat history.'),
});
export type SuggestHelpfulArticlesOutput = z.infer<typeof SuggestHelpfulArticlesOutputSchema>;

export async function suggestHelpfulArticles(
  input: SuggestHelpfulArticlesInput
): Promise<SuggestHelpfulArticlesOutput> {
  return suggestHelpfulArticlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHelpfulArticlesPrompt',
  input: {schema: SuggestHelpfulArticlesInputSchema},
  output: {schema: SuggestHelpfulArticlesOutputSchema},
  prompt: `Based on the following chat history and the user's profession, suggest a helpful article snippet or how-to guide.

Chat History: {{{chatHistory}}}
User Profession: {{{userProfession}}}

Suggest an article snippet that directly addresses the problem discussed in the chat history. The snippet should be concise and immediately helpful to the user.`,
});

const suggestHelpfulArticlesFlow = ai.defineFlow(
  {
    name: 'suggestHelpfulArticlesFlow',
    inputSchema: SuggestHelpfulArticlesInputSchema,
    outputSchema: SuggestHelpfulArticlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
