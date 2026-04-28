import express from 'express';
import { MemberController } from '../controllers/memberController.js';

const router = express.Router();

// GET /api/members
router.get('/', MemberController.getAllMembers);

// POST /api/members
router.post('/', MemberController.registerMember);

export default router;