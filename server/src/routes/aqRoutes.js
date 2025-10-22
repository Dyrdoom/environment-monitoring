import { Router } from 'express';
import { list, fetchFromApi, getById, create, update, remove } from '../controllers/aqController.js';

const router = Router();

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

router.post('/fetch', fetchFromApi);

export default router;
