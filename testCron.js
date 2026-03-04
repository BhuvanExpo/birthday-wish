require('dotenv').config();
const mongoose = require('mongoose');
const Wish = require('./models/Wish');

mongoose.connect("mongodb+srv://bhuvan:2xPudtBtdK243m9c@cluster0.v8f2q.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0").then(async () => {
    console.log("Connected");
    const now = new Date();
    console.log("Now is:", now.toISOString());
    const pendingWishes = await Wish.find({
        $or: [
            { status: 'pending', sendAt: { $lte: now } },
            { status: 'failed', retryCount: { $lt: 3 }, sendAt: { $lte: now } }
        ]
    });
    console.log(`Found ${pendingWishes.length} wishes to process.`);
    for (const w of pendingWishes) {
        console.log(w._id, w.sendAt, w.status);
    }
    process.exit(0);
}).catch(console.error);
