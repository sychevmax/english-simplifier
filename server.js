// A full-stack Node.js server for the Telegram Bot and Web App.

// 1. SETUP: Import necessary libraries
require('dotenv').config(); // For managing secret keys
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

// 2. CONFIGURATION: Get API keys from environment variables (.env file)
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const geminiApiKey = process.env.API_KEY;
const isProduction = process.env.NODE_ENV === 'production';
const appUrl = process.env.RENDER_EXTERNAL_URL; // Render provides this automatically

if (!telegramToken || !geminiApiKey) {
    console.error('FATAL ERROR: TELEGRAM_BOT_TOKEN and API_KEY must be set in your .env file or environment variables.');
    process.exit(1); // Exit if keys are not found
}

// 3. INITIALIZATION: Create instances of Express, the bot, and the AI client
const app = express();
// For production, we don't use polling. We'll set a webhook instead.
const bot = new TelegramBot(telegramToken, { polling: !isProduction });

// In-memory storage to remember which level each user has selected for Telegram.
const userState = {};

// 4. GEMINI SERVICE: A function to call the Gemini API (used by both web and bot)
async function getSimplifiedText(text, level) {
  const model = 'gemini-2.5-flash';
  const prompt = `
    You are an expert in English language teaching and simplification.
    Your task is to simplify the following English text to a specific CEFR level.
    The target level is: ${level}.
    Do not add any explanations, comments, or introductions. Only return the simplified text.

    Original text:
    ---
    ${text}
    ---

    Simplified text (${level}):
  `;

  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
}

// 5. EXPRESS SERVER SETUP (for Web App)

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON request bodies

// 6. TELEGRAM BOT WEBHOOK (for Production)
if (isProduction) {
    if (!appUrl) {
        console.error('FATAL ERROR: RENDER_EXTERNAL_URL must be set for production webhook.');
        process.exit(1);
    }
    // This is the route Telegram will send updates to
    app.post(`/api/telegram/${telegramToken}`, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });

    // Set the webhook
    const webhookUrl = `${appUrl}/api/telegram/${telegramToken}`;
    bot.setWebHook(webhookUrl).then(() => {
        console.log(`✅ Telegram webhook set to ${webhookUrl}`);
    }).catch(console.error);
}

// 7. API ENDPOINTS and STATIC FILE SERVING

app.use(express.static(path.join(__dirname, '.'))); // Serve static files (index.html, etc.)

// API Endpoint for the web app
app.post('/api/simplify', async (req, res) => {
  const { text, level } = req.body;

  if (!text || !level) {
    return res.status(400).json({ error: 'Missing text or level in request.' });
  }

  try {
    const simplifiedText = await getSimplifiedText(text, level);
    res.json({ simplifiedText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main index.html for any other GET requests to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// 8. TELEGRAM BOT LOGIC (Handlers are the same)

// Handler for the /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = null; // Reset user's selected level

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'A1 (Beginner)', callback_data: 'A1 (Beginner)' }, { text: 'A2 (Elementary)', callback_data: 'A2 (Elementary)' }],
        [{ text: 'B1 (Intermediate)', callback_data: 'B1 (Intermediate)' }, { text: 'B2 (Upper-Intermediate)', callback_data: 'B2 (Upper-Intermediate)' }]
      ]
    }
  };
  bot.sendMessage(chatId, "Hello! I'm the English Text Simplifier Bot. Please choose a CEFR level to start.", options);
});

// Handler for when a user clicks a level button (callback_query)
bot.on('callback_query', (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const selectedLevel = callbackQuery.data;
  userState[chatId] = { level: selectedLevel };
  bot.answerCallbackQuery(callbackQuery.id);
  bot.sendMessage(chatId, `Level set to ${selectedLevel}. Please send me the English text you want to simplify.`);
});

// Handler for general messages (the text to be simplified)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // This check is required for webhook-based bots to avoid processing the same message twice
  if (!text || msg.via_bot) {
    return;
  }
  
  if (text.startsWith('/')) {
    return; // Ignore commands handled by other listeners
  }

  const currentUserState = userState[chatId];
  if (!currentUserState || !currentUserState.level) {
    bot.sendMessage(chatId, "Please select a level first. Type /start to begin.");
    return;
  }
  
  bot.sendChatAction(chatId, 'typing');
  try {
    const simplifiedText = await getSimplifiedText(text, currentUserState.level);
    bot.sendMessage(chatId, simplifiedText);
  } catch (error) {
    bot.sendMessage(chatId, "I'm sorry, but I encountered an error while trying to simplify the text. Please try again.");
  }
});

// 9. START THE SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ Web server is running at http://localhost:${port}`);
    if (!isProduction) {
        console.log('✅ Telegram Bot is running in polling mode...');
    }
});
