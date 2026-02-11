import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Webpack plugin to clean up temporary hot-update files
 * Removes .hot-update.js and .hot-update.js.map files from dist folder
 */
class CleanupHotUpdatePlugin {
	constructor(options = {}) {
		this.options = {
			outputPath: options.outputPath || path.resolve(__dirname, '../dist'),
			...options,
		};
	}

	apply(compiler) {
		const pluginName = 'CleanupHotUpdatePlugin';

		// Clean up after compilation is done
		compiler.hooks.done.tap(pluginName, () => {
			this.cleanupHotUpdateFiles();
		});

		// Also clean up before compilation starts (in case of leftover files)
		compiler.hooks.beforeCompile.tap(pluginName, () => {
			this.cleanupHotUpdateFiles();
		});
	}

	cleanupHotUpdateFiles() {
		try {
			if (!fs.existsSync(this.options.outputPath)) {
				return;
			}

			const files = fs.readdirSync(this.options.outputPath);
			let cleanedCount = 0;

			files.forEach((file) => {
				if (file.includes('.hot-update.')) {
					const filePath = path.join(this.options.outputPath, file);
					try {
						fs.unlinkSync(filePath);
						cleanedCount++;
					} catch (error) {
						console.warn(`Failed to delete ${file}:`, error.message);
					}
				}
			});

			if (cleanedCount > 0) {
				console.log(`[CleanupHotUpdatePlugin] Cleaned up ${cleanedCount} hot-update file(s)`);
			}
		} catch (error) {
			console.warn(`[CleanupHotUpdatePlugin] Error during cleanup:`, error.message);
		}
	}
}

export default CleanupHotUpdatePlugin;
