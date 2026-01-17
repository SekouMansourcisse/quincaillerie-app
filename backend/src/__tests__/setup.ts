import { rawDb } from '../config/database';

// Configuration globale pour les tests
beforeAll(async () => {
  // S'assurer que la base de donnees est initialisee
  console.log('Initialisation de la base de donnees de test...');
});

afterAll(async () => {
  // Nettoyage apres tous les tests
  console.log('Nettoyage de la base de donnees de test...');
});

// Mock pour les fonctions qui pourraient causer des problemes pendant les tests
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn((token: string) => {
    if (token === 'valid-token' || token === 'mock-token') {
      return { id: 1, username: 'testuser', role: 'admin' };
    }
    throw new Error('Invalid token');
  })
}));
