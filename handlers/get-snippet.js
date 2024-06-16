import axios from 'axios';
import Snippet from '../models/snippet.js';

/*
export const handleSnippetRequest = async (req, res) => {
    const { path } = req.params;

    try {
      const snippet = await Snippet.findOne({ path });
      if (!snippet) {
        return res.status(404).json({ message: 'Snippet not found' });
      }
      
      res.json({ gistId: snippet.gistId, fileName: snippet.name });
        
    } catch (error) {
        console.error('Error fetching snippet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}*/


export const handleSnippetRequest = async (req, res) => {
  const { path } = req.params;
  try {
    const snippet = await Snippet.findOne({ path });

    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    const url = `https://api.github.com/gists/${snippet.gistId}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });

    res.json({
      gistData: response.data,
      fileName: snippet.name
    });

  } catch (error) {
    console.error('Error fetching snippet:', error);
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.statusText });
    } else if (error.request) {
      res.status(500).json({ message: 'No response received from GitHub' });
    } else {
      res.status(500).json({ message: 'Error making request to GitHub' });
    }
  }
}