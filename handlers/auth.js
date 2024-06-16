import axios from 'axios';
import User from '../models/user.js';
import { validationResult } from 'express-validator';

const exchangeCodeForToken = async (code) => {
    const url = 'https://github.com/login/oauth/access_token';

    const values = {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
    };

    const headers = {
        Accept: 'application/json',
    };

    const response = await axios.post(url, values, { headers });
    return response.data.access_token;
};

const fetchUserInformation = async (accessToken) => {
    const response = await axios.get('https://api.github.com/user', {
        headers: { 'Authorization': `token ${accessToken}` }
    });
    return response.data;
};

const storeUserInformation = async ({ id, login, email }) => {
    let user = await User.findOne({ githubId: id });

    if (user) {
        user.username = login;
        if (email) {
            user.email = email;
        }
        await user.save();
    } else {
        user = new User({
            githubId: id,
            username: login,
            ...(email && { email: email }) // Conditionally add
        });
        await user.save();
        
    }
    return user
}

export const handleAuthentication = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { code, state } = req.query;
    const redirectUrl = decodeURIComponent(state) || '/';

    const handleAuthError = () => {
        req.session.loginSuccess = false;
        req.session.save(() => res.redirect(redirectUrl));
    }

    if (!code) {
        handleAuthError();
    }

    try {
        const accessToken = await exchangeCodeForToken(code);
        const userInformation = await fetchUserInformation(accessToken);
        const user = await storeUserInformation(userInformation);

        req.session.username = user.username;
        req.session.userId = user.githubId;
        req.session.accessToken = accessToken; 
        req.session.loginSuccess = true;

        req.session.save(() => res.redirect(redirectUrl));
    } catch (error) {
        console.error('Error in authentication:', error); 
        handleAuthError();
    }
}