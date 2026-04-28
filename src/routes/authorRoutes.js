import express from 'express';
import { AuthorController } from '../controllers/authorController.js';

const router = express.Router();
router.get('/', AuthorController.getAuthors);
router.post('/', AuthorController.addAuthor);
export default router;