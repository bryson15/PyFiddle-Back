import Snippet from '../models/snippet.js';

export const handleSnippetsRequest = async (req, res) => {
    try {
        const userSnippets = await Snippet.find({ userId: req.session.userId });
        res.status(200).json(userSnippets || []);
    } catch (error) {
        console.error('Error fetching user snippets:', error);
        res.status(500).json({ message: 'Internal server error while fetching snippets' });
    }
}