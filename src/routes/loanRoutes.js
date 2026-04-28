import express from 'express';
import { LoanController } from '../controllers/loanController.js';

const router = express.Router();

router.get('/', LoanController.getLoans);
router.get('/top-borrowers', LoanController.getTopBorrowers);
router.post('/', LoanController.createLoan);

export default router;
