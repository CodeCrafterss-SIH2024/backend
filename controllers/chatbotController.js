const fs = require('fs');
const path = require('path');

// Load the chatbot data from the JSON file
const chatbotData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/chatbotData.json'), 'utf-8'));

exports.getChatbotResponse = (req, res) => {
    const userInput = req.body.message.toLowerCase();

    // Find the response in the chatbot data
    const response = chatbotData[userInput] || "Sorry, I didn't understand that. Can you please rephrase?";

    res.json({ response });
};
