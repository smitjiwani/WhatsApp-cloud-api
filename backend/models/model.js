import mongoose from 'mongoose';

const whatsappSchema = mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    user: {
        type: String,
        required: true,
    },
},
    { timestamps: true }
);

export default mongoose.model('messages', whatsappSchema);
