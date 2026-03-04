/**
 * Upload static HTML to S3 (CDN bucket). Used when config.uploadStaticHtml is set in production.
 * Requires: AWS_S3_CDN_BUCKET (or S3_CDN_BUCKET), AWS_REGION (default us-east-1).
 * Credentials: IAM role (App Runner/ECS) or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY.
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const BUCKET = process.env.AWS_S3_CDN_BUCKET || process.env.S3_CDN_BUCKET || '';
const REGION = process.env.AWS_REGION || 'us-east-1';

let client = null;

function getClient() {
	if (!client) {
		client = new S3Client({ region: REGION });
	}
	return client;
}

/**
 * Upload HTML to S3. Key = relativePath (e.g. "index.html", "page/index.html").
 * @param {string} relativePath - e.g. "index.html", "page/index.html"
 * @param {string} html - HTML content
 * @returns {Promise<void>}
 */
export async function uploadStaticHtmlToS3(relativePath, html) {
	if (!BUCKET) {
		throw new Error('AWS_S3_CDN_BUCKET or S3_CDN_BUCKET is not set');
	}
	const s3 = getClient();
	const command = new PutObjectCommand({
		Bucket: BUCKET,
		Key: relativePath,
		Body: html,
		ContentType: 'text/html; charset=utf-8',
		CacheControl: 'public, max-age=3600',
	});
	await s3.send(command);
}
