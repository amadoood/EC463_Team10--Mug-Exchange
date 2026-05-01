import express from "express";
import http from "http";
import { Server } from "socket.io";
import db from './database_local.js';
import 'dotenv/config';
import cors from "cors";
import crypto from "crypto";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const app = express();
const PORT = process.env.PORT || 3000;
const NUMBER_OF_MUGS = 23;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

const host = process.argv[2] == 'local' ? 'localhost' : undefined;

io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    console.log("Token for socket authentication is: ", token);

    if (!token) {
        return next(new Error("No auth token"));
    }

    if (token === "barista") {
        socket.user = "barista";
        socket.join("barista");
        return next();
    }

    const uid = await db.userFromToken(token);

    if (!uid) {
        console.error("Error: No UID");
        return next(new Error("Invalid auth token"));
    }

    socket.user = uid.user_id;
    next();
});

io.on('connection', (socket) => {
    socket.join(socket.user);
    console.log("User ", socket.user, " connected");

    socket.on('disconnect', () => {
        console.log('Frontend disconnected: ', socket.id);
    });
});

app.post('/api/grubhub/webhook', async (req, res) => {
    const order = req.body;

    console.log("Webhook received", order);

    if(req.body.MugExchange == "Yes") {
        //Parse order json for UUID, merchantID, order_number, let timestamp automatically fill in with current time FOR NOW
        console.log(order.phone_number);
        const uuid = await db.findUserFromPhoneNumber(order.phone_number);
        const status = "IN_PROGRESS";
            
        const frontend_payload = {
            orderId: order.id,
            merchant_id: order.merchant_id,
            status: status,
            item: order.item
        };

        io.to(uuid).emit("orderUpdate", frontend_payload);
        
        //Add new row to orders, mugID will be null until pickup
        await db.insertOrder(order.id, uuid, order.merchant_id, status, order.item, order.time, order.price); 
        
        console.log("Sent payload to websocket");
    }
    
    res.status(200).json({message: "Webhook received"})
});

app.post('/internal-order', async (req, res) => {
    const order = req.body;

    console.log("Internal order received", order);

    if (!order.uuid) {
        return res.status(400).json({ error: "Missing uuid" });
    }

    const activeOrders = await db.getNumActiveOrders();
    const numActiveOrders = activeOrders.length;
    if (numActiveOrders >= NUMBER_OF_MUGS) {
        return res.status(404).json({ message: "No mugs available" })
    }

    const status = "IN_PROGRESS";

    const [order_num, user_name] = await Promise.all([
        db.insertOrder(order.id, order.uuid, order.merchant_id, order.cafe_name || null, status, order.item, order.time, order.price),
        db.getUserName(order.uuid),
    ]);

    if (order_num != null) {
        io.to("barista").emit("newOrder", { order_num, name: user_name, item: order.item, cafe_name: order.cafe_name || null, order_time: order.time });
    }

    res.status(200).json({ message: "Order received", order_num: order_num });
});

app.get('/barista/active-orders', async (req, res) => {
    const orders = await db.getActiveOrders();
    res.json(orders);
});

const findOrderFromChit = async (payload) => {
    //Special chit-parsing logic needs to go here eventually
    var order_id = null;

    payload.responses[0].textAnnotations.forEach(data => {
        let text = data.description;
        if (/^\d+$/.test(text)) { //Checks if text is an integer
            order_id = text;
        }
    });
    console.log("Order ID is: ", order_id);

    return await db.getOrderInfo(order_id);
}

app.post('/pickup', async (req, res) => {
    console.log("Pickup endpoint hit: ", req.body);

    const pickup_payload = req.body;
    const order = await findOrderFromChit(pickup_payload.ocr.gcloud_result);

    if(order) {
        res.status(200).json({message: "Pickup RFID received"});
    }
    else {
        console.error("No order found matching the OCR data.");
        return res.status(404).json({ error: "Order not found", message: "Could not match OCR result to an existing order." });   
    }

    const merchant_id = order.merchant_id;
    const uuid = order.user_id;
    const status = "READY_PICKUP";
    const item = order.item;

    const frontend_payload = {
        orderId: order.id,
        merchant_id: merchant_id,
        status: status,
        item: item,
        mug_id: pickup_payload.rfid
    };

    io.to(uuid).emit("orderUpdate", frontend_payload);
    io.to("barista").emit("orderPickedUp", { order_num: order.order_num });

    await db.updateOrderMugID(order.id, pickup_payload.rfid);
});

app.post('/return', async (req, res) => {
    console.log("Return bin endpoint hit: ", req.body);
    res.status(200).json({message: "Return RFID received"});

    //Send query to database, use unique mugID to build payload out of order info
    const return_payload = req.body;

    const order = await db.getOrderByMugID(return_payload.mug_id);
    const merchant_id = order.merchant_id;
    const status = "MUG_RETURNED";
    const item = order.item;

    const frontend_payload = {
        orderId: order.id,
        merchant_id: merchant_id,
        status: status,
        item: item
    };
    io.to(order.user_id).emit("orderUpdate", frontend_payload);
    
   //await db.updateMugStatusAvailable(return_payload.mug_id);

    //added updateOrderStatus call.
    //previously the return endpoint only updated the mug's status in the mugs table
    //but never updated the order's status in the orders table. This meant that when
    //a user logged back in, getUserOrders would still show the order as IN_PROGRESS
    //instead of MUG_RETURNED, so the history tab would never show it as completed.
   await db.updateOrderStatus(order.id, status);
});

app.get('/', (req, res) => {
    res.send("Mug Exchange server!");
});

//Authentication
app.post('/signup', async (req, res) => {
    const { user, pass, phone_number, display_name } = req.body;
    console.log("FULL NAME IS: ", display_name);
    await db.addUser(user, pass, phone_number, display_name);

    res.status(200).json({ success: true, message: "User registered" });
});

app.post('/login', async (req, res) => {
    console.log("Login endpoint hit");
    const {username, password} = req.body;
    console.log("Username is", username, "password is ", password);
    const user = await db.findUser(username, password);

    if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const uid = user.user_id;
    const phone = user.phone_number;
    const display_name = user.name;

    

    const token = crypto.randomUUID();
    await db.addUserToken(uid, token);

    //map raw DB rows to the shape the frontend expects
    //the DB stores order time as "order_time" but older rows may use "created_at".
    //the DB also stores "cafe_name" which the frontend needs for the history tab.
    //without this mapping, the dashboard and history would show "N/A" for dates
    //and blank cafe names on every order after login.

    const mappedOrders = (await db.getUserOrders(uid)).map(o => ({
        id:          o.id,
        orderId:     o.id,
        order_num:   o.order_num,
        item:        o.item,
        status:      o.status,
        mug_id:      o.mug_id,
        merchant_id: o.merchant_id,
        cafe_name:   o.cafe_name || null,
        order_time:  o.order_time || o.created_at,
        price:       o.price,
    }));

    console.log("User ID is: ", uid);
    res.json({ token: token, orders: mappedOrders, user_id: uid, phone: phone, display_name: display_name});
});

//Verifies token from frontend upon user refresh
app.get('/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token" });

    const user = await db.userFromToken(token);
    if (!user) return res.status(401).json({ error: "Invalid token" });

    const mappedOrders = (await db.getUserOrders(user.user_id)).map(o => ({
        id:          o.id,
        orderId:     o.id,
        order_num:   o.order_num,
        item:        o.item,
        status:      o.status,
        mug_id:      o.mug_id,
        merchant_id: o.merchant_id,
        cafe_name:   o.cafe_name || null,
        order_time:  o.order_time || o.created_at,
        price:       o.price,
    }));

    res.json({ username: user.username, display_name: user.name, user_id: user.user_id, orders: mappedOrders });
});

app.post('/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        const user = await db.userFromToken(token);
        if (user) await db.removeUserToken(user.user_id);
    }
    res.json({ success: true });
});

app.use('/barista', express.static(path.join(__dirname, '../Barista_Interface')));

server.listen(PORT, host, () => {
    console.log(`Test Server running on port ${PORT}`);
});



/*
TO DO:

*/