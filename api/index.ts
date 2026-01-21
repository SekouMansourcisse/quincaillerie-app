import app from '../backend/src/server.vercel';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Handler pour Vercel Serverless Functions
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Passer la requête à l'application Express
    return app(req, res);
}
