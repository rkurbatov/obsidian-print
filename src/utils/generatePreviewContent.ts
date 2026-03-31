import { MarkdownRenderer, TFile, Component, Notice, App, finishRenderMath, loadMathJax } from 'obsidian';

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

    // Attach to DOM and force height to bypass Obsidian's IntersectionObserver (lazy-loading)
    content.style.cssText = 'position: absolute; opacity: 0; pointer-events: none; width: 800px; height: 99999px;';
    document.body.appendChild(content);

    const comp = new Component();
    comp.load();

    try {
        await loadMathJax();

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
            comp
        );

        await finishRenderMath();
        // Wait for the async CHTML/SVG nodes to be fully injected
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Clone the fully rendered node and reset geometry for printing
        const result = content.cloneNode(true) as HTMLElement;
        result.style.cssText = 'position: static; opacity: 1; pointer-events: auto; height: auto; width: auto;';
        result.addClass('obsidian-print-note');

        return result;

    } catch (error) {
        new Notice('Failed to generate preview content.');
        console.error('Preview generation error:', error);
        return;
    } finally {
        if (document.body.contains(content)) {
            document.body.removeChild(content);
        }
        comp.unload();
    }
}