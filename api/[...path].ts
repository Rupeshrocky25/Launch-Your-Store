import { createApp } from '../server';

const appPromise = createApp({ mountFrontend: false, normalizeApiBase: true });

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
