import messages from "../models/model.js";

export const getMessages = async (req, res) => {
    try {
        const message = await messages.find();
        res.status(200).json(message);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const createMessage = async (req, res) => {
    const message = req.body;
    const newMessage = new messages(message);
    try {
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}