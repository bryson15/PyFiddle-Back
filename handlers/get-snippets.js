import Snippet from '../models/snippet.js';
import { validationResult } from 'express-validator';

export const handleSnippetsRequest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const userSnippets = await Snippet.find({ userId: req.session.userId });
        res.status(200).json(userSnippets || []);
    } catch (error) {
        console.error('Error fetching user snippets:', error);
        res.status(500).json({ message: 'Internal server error while fetching snippets' });
    }
}