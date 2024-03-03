import ghpages from 'gh-pages';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Publishing!!!!');
ghpages.publish(
    path.join(__dirname, 'dist'),
    {
        branch: 'gh-pages',
    },
    (err) => {
        /*eslint no-console: ["error", { allow: ["log"] }] */
        if (err) console.log(err);
        else console.log('Successfully Published!!!!');
    }
);