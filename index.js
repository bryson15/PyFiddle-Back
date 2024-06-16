import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import { handleSnippetSave } from './handlers/save-snippet.js';
import { handleSnippetRequest } from './handlers/get-snippet.js';
import { handleSnippetsRequest } from './handlers/get-snippets.js';
import { handleAuthentication } from './handlers/auth.js';
import { body } from 'express-validator';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = express();
const PORT = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === 'production';

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use(cors({
    origin: isProduction ? 'https://pyfiddle.net' : 'http://localhost:3000',
    credentials: true
}));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { 
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'Strict' : 'Lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use(express.json());

app.get('/auth', handleAuthentication);

app.post('/snippet', [
    body('name').trim().escape().isLength({ min: 1 }).withMessage('Name cannot be empty'),
    body('path').trim().escape().isLength({ min: 1 }).withMessage('Path cannot be empty'),
    body('content').trim().escape().isLength({ min: 1 }).withMessage('Content cannot be empty')
], handleSnippetSave);

app.get('/snippet/:path', handleSnippetRequest);

app.get('/snippets', handleSnippetsRequest);

app.get('/session', (req, res) => {
    res.json({
        username: req.session.username,
        loginSuccess: req.session.loginSuccess
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));