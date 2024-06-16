import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
    gistId: { type: String, required: true, unique: true },
    userId: { type: String, ref: 'User', required: true },
    path: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now }
}, { strict: true });

const Snippet = mongoose.model('Snippet', snippetSchema);
export default Snippet;