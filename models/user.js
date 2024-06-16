import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    githubId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String }
}, { strict: true });

const User = mongoose.model('User', userSchema);

export default User;