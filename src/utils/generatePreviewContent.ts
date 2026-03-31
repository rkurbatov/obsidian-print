import { MarkdownRenderer, TFile, Component, Notice, App } from 'obsidian';

/**
 * Returns the rendered markdown content from either a TFile or a string.
 *
 * @param input - Either a TFile object or a markdown string to render
 * @param withTitle - Whether to include the title in the rendered output
 * @param app - Obsidian App instance needed for rendering
 * @returns Promise<HTMLElement|void> - The rendered content as an HTML element
 */
export async function generatePreviewContent(
    input: TFile | string,
    withTitle: boolean,
    app: App
): Promise<HTMLElement|void> {
    const content = createDiv();

    try {
        // Handle title if requested
        if (withTitle && input instanceof TFile) {
            const titleEl = content.createEl('h1');
            titleEl.textContent = input.basename;
        }

        // Get the markdown content based on input type
        let markdownContent: string;
        let sourcePath: string = '';

        if (input instanceof TFile) {
            markdownContent = await app.vault.cachedRead(input);
            sourcePath = input.path;
        } else {
            markdownContent = input;
        }

        // Render the markdown content
        await MarkdownRenderer.render(
            app,
            markdownContent,
            content,
            sourcePath,
            new Component()
        );

        content.addClass('obsidian-print-note');
        return content;

    } catch (error) {
        new Notice('Failed to generate preview content.');
        console.error('Preview generation error:', error);
        return;
    }
}