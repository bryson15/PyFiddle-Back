import axios from 'axios';
import Snippet from '../models/snippet.js';
//import { getUniqueName } from './name.js';

const generateRandomString = (length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const getUniqueRandomString = async (retryLimit = 10) => {
    const randomString = generateRandomString();
    let snippet = await Snippet.findOne({ path: randomString });

    if (snippet) {
        if (retryLimit > 0) {
            return getUniqueRandomString(retryLimit - 1);
        } else {
            throw new Error('Failed to generate a unique string');
        }
    }

    return randomString;
}

const createGist = async (content, gistName, accessToken) => {
    const data = {
        public: true,
        files: {
            [`${gistName}.py`]: {
                content: content
            }
        }
    };

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
    };

    const response = await axios.post('https://api.github.com/gists', data, { headers });

    return response.data.id;
}

const updateGist = async (content, name, accessToken, gistId) => {
    const data = {
        public: true,
        files: {
            [`${name}.py`]: {
                content: content
            }
        }
    };

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
    };

    const response = await axios.patch(`https://api.github.com/gists/${gistId}`, data, { headers: headers });
    
    return response.data;
}

const storeSnippet = async (gistId, userId, path, name) => {

    const snippet = new Snippet({
        gistId,
        userId,
        path,
        name
    });

    await snippet.save();
    return snippet;
}

const updateSnippetName = async (name, gistId) => {
    let snippet = await Snippet.findOne({ gistId: gistId });
    if (!snippet) throw new Error("Snippet not found");

    if (snippet.name !== name) {
        snippet.name = name;
        snippet.lastUpdated = new Date();
        await snippet.save();
    }

    return snippet;
}


const handleGistCreation = async (content, name, accessToken, userId) => {
    const uniqueRandomString = await getUniqueRandomString();
    const gistId = await createGist(content, name, accessToken)
    const snippet = await storeSnippet(gistId, userId, uniqueRandomString, name);
    return snippet;
}

const handleGistUpdate = async (content, name, gistId, accessToken) => {
    await updateGist(content, name, accessToken, gistId);
    const snippet = await updateSnippetName(name, gistId);
    snippet.lastUpdated = new Date();
    await snippet.save();
    return snippet;
}

const getSnippetDetails = async (userId, path) => {
    let snippet = await Snippet.findOne({ path: path });
    
    if (snippet) {
        return { exists: true, isOwner: snippet.userId === userId, gistId: snippet.gistId };
    } 

    return { exists: false, isOwner: false }
}

export const handleSnippetSave = async (req, res) => {
    const { name, path, content } = req.body;

    if (!req.session.userId || !req.session.accessToken) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        let response; 
        if (path === "") {
            response = await handleGistCreation(content, name, req.session.accessToken, req.session.userId);
        } else {
            const { exists, isOwner, gistId } = await getSnippetDetails(req.session.userId, path);
            if (!exists || (exists && !isOwner)) {
                response = await handleGistCreation(content, name, req.session.accessToken, req.session.userId);
            } else {
                response = await handleGistUpdate(content, name, gistId, req.session.accessToken);
            }
        }
        res.json(response);
    } catch (error) {
        console.error('Failed to create or update snippet:', error);
        res.status(500).send('Error processing your request.');
    }
};