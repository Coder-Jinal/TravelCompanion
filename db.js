// const mongoose = require("mongoose");
// const dotenv = require("dotenv");

// dotenv.config();

// const dbUrl = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPWD}@${process.env.DBHOST}/${process.env.DBNAME}`;

// async function connect() {
//     try {
//         if (mongoose.connection.readyState === 1) {
//             console.log("Already connected to MongoDB");
//             return;
//         }
        
//         // Remove deprecated options
//         await mongoose.connect(dbUrl);
//         console.log("Connected to MongoDB successfully");
        
//         // Handle connection events
//         mongoose.connection.on('error', (err) => {
//             console.error('MongoDB connection error:', err);
//         });
        
//         mongoose.connection.on('disconnected', () => {
//             console.log('MongoDB disconnected');
//         });
        
//     } catch (error) {
//         console.error("Error connecting to the database:", error);
//         process.exit(1); // Exit process with failure
//     }
// }

// // Handle app termination
// process.on('SIGINT', async () => {
//     try {
//         await mongoose.connection.close();
//         console.log('MongoDB connection closed through app termination');
//         process.exit(0);
//     } catch (error) {
//         console.error('Error closing MongoDB connection:', error);
//         process.exit(1);
//     }
// });

// connect(); 

// module.exports = { connect };


const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const dbUrl = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPWD}@${process.env.DBHOST}/${process.env.DBNAME}`;

async function connect() {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("Already connected to MongoDB");
            return;
        }

        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB successfully");

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
});

connect();

module.exports = { connect };
