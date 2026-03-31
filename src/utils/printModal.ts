import { PrintPluginSettings } from '../types';
import { Printd } from 'printd'

/**
 * Generate the HTML with the content to be printed. Use Printd to print.
 * 
 * @param content 
 * @param settings 
 * @param cssString 
 * @returns 
 */

export async function openPrintModal(content: HTMLElement, settings: PrintPluginSettings, cssString: string): Promise<void> {
    const htmlElement = document.createElement('html');
    const headElement = document.createElement('head');

    const titleElement = document.createElement('title');
    titleElement.textContent = 'Print note';
    headElement.appendChild(titleElement);

    const mathJaxStyles = getMathJaxStyles();
    const combinedCssString = mathJaxStyles + '\n' + cssString;

    if (settings.debugMode) {
        const styleElement = document.createElement('style');
        styleElement.textContent = combinedCssString;
        headElement.appendChild(styleElement);
    }

    htmlElement.appendChild(headElement);

    const bodyElement = document.createElement('body');
    bodyElement.className = 'obsidian-print';
    bodyElement.appendChild(content);

    htmlElement.appendChild(bodyElement);

    /**
     * This uses Electron to open a window with HTML content in order to inspect it when debug mode is turned on.
     */
    if (settings.debugMode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { remote } = (window as any).require("electron");

        const printWindow = new remote.BrowserWindow({
            width: 800,
            height: 600,
            show: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        /**
         * This uses outerHTML solely when debug mode is turned on to make it easier to inspect the generated HTML
         * and CSS stylying. For debuggers: Press `cmd/ctrl + p` in the DevTools and search for 'Emulate CSS Print media type'
         */
        const debugContent = htmlElement.outerHTML;
        printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(debugContent)}`);

        printWindow.webContents.on('did-finish-load', () => {
            printWindow.webContents.openDevTools();
        });
    }

    const d = new Printd();
    d.print(htmlElement, [combinedCssString]);
}

/**
 * Extracts dynamically injected CSS rules from the CSSOM.
 * Critical for MathJax CHTML rendering.
 * Extracted for easy toggling via plugin settings.
 */
function getMathJaxStyles(): string {
    let styles = '';
    Array.from(document.styleSheets).forEach(sheet => {
        if (sheet.ownerNode && sheet.ownerNode.nodeName === 'STYLE') {
            try {
                const rules = sheet.cssRules;
                if (rules) {
                    for (let i = 0; i < rules.length; i++) {
                        styles += rules[i].cssText + '\n';
                    }
                }
            } catch (e) {
                // Fallback for CORS-blocked stylesheets
                const styleEl = sheet.ownerNode as HTMLStyleElement;
                if (styleEl.textContent) {
                    styles += styleEl.textContent + '\n';
                }
            }
        }
    });
    return styles;
}