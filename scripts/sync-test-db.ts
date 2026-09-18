import { execSync } from 'child_process';

try {
  process.env.DATABASE_URL = 'file:./test.db';
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit'
  });
  console.log('test.db is now in sync!');
} catch (err) {
  console.error('Failed to sync test.db', err);
}
