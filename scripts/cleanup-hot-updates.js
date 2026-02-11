#!/usr/bin/env node

/**
 * Script to clean up hot-update files from dist folder
 * Can be run manually: node scripts/cleanup-hot-updates.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');

function cleanupHotUpdateFiles() {
	if (!fs.existsSync(distPath)) {
		console.log(`Dist folder does not exist: ${distPath}`);
		return;
	}

	const files = fs.readdirSync(distPath);
	let cleanedCount = 0;
	let totalSize = 0;

	files.forEach((file) => {
		if (file.includes('.hot-update.')) {
			const filePath = path.join(distPath, file);
			try {
				const stats = fs.statSync(filePath);
				totalSize += stats.size;
				fs.unlinkSync(filePath);
				cleanedCount++;
			} catch (error) {
				console.warn(`Failed to delete ${file}:`, error.message);
			}
		}
	});

	if (cleanedCount > 0) {
		const sizeInKB = (totalSize / 1024).toFixed(2);
		console.log(
			`✓ Cleaned up ${cleanedCount} hot-update file(s) (${sizeInKB} KB freed)`,
		);
	} else {
		console.log('No hot-update files found to clean.');
	}
}

cleanupHotUpdateFiles();
