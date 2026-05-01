import express from "express";
import http from "http";
import { Server } from "socket.io";
import 'dotenv/config';
import cors from "cors";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

var trial = 1;
var real_time = '04:08';
var real_price = '5.75';
var total_price;

const findOrderFromChit = async (payload) => {
    //Special chit-parsing logic needs to go here eventually
    var prices = [];
    var time = "";

    payload.responses[0].textAnnotations.forEach(data => {
        let text = data.description;
        if (/\./.test(text) && !/\s/.test(text)) {
            prices.push(text);
        }

        if (text[2] == ":" && !/\s/.test(text)) {
            time = text;
            console.log("Time is: ", time);
        }
    });
    if(prices.length > 0) {
        total_price = prices.reduce((max, curr) =>
            Number(curr) > Number(max) ? curr : max
        );
    }
    console.log("Total price is: ", total_price);

    const priceCorrect = total_price === real_price;
    const timeCorrect = time === real_time;

    if (priceCorrect && timeCorrect) {
        console.log("Time and price are correct for trial", trial);
    } else if (priceCorrect) {
        console.log("Time is incorrect but price is correct for trial", trial);
    } else if (timeCorrect) {
        console.log("Time is correct but price is incorrect for trial", trial);
    } else {
        console.log("Both are incorrect for trial", trial);
    }

    trial++;
    if(trial == 10) {
        trial = 0;
    }
}

app.post('/pickup', async (req, res) => {
    console.log("Pickup endpoint hit");
    res.status(200).json({message: "Pickup RFID received"});

    const pickup_payload = req.body;
    //console.log("Pickup payload: ", pickup_payload.ocr);
    const uuid = await findOrderFromChit(pickup_payload.ocr.gcloud_result);
});

const host = process.argv[2] == 'local' ? '172.20.10.13' : undefined;
server.listen(PORT, host, () => {
    console.log(`Test Server running on port ${PORT}`);
});