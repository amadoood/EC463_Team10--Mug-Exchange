import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, //|| "postgresql://postgres:a@localhost:5432/mug_exchange_local", 
    ssl: {
        rejectUnauthorized: false
    }
});

//Connect to mug_exchange schema whenever a new DB connection is made
pool.on('connect', async (client) => {
    client.query('SET search_path TO mug_exchange');
});

const dbQuery = async (sql, params = []) => {
    try {
        const result = await pool.query(sql, params);
        return result.rows;
    } catch (err) {
        console.error("--- DATABASE ERROR ---");
        console.error("Query:", sql);
        console.error("Params:", params);
        console.error("Error:", err.message);
        
        throw err;
    }
}

//Add new row to orders, mugID will be null until pickup

//added cafe_name parameter (between merchant_id and status) and updated
//the SQL INSERT to include the cafe_name column. This lets the frontend show which
//cafe an order was placed at in the history tab. cafe_name comes from the frontend
//order body and gets passed through server.js -> here -> DB.
const insertOrder = async (order_id, user_id, merchant_id, cafe_name, status, item, time, price) => {
    const sqlInsert = await dbQuery(
        "INSERT INTO orders (id, user_id, merchant_id, cafe_name, status, item, order_time, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [order_id, user_id, merchant_id, cafe_name, status, item, time, price] 
    );
    console.log("Inserted order ID", order_id, "with insert ID", sqlInsert.insertId);
};

//Query info from orders table using username (use order number later)
const getOrderInfo = async (order_id) => {
    const rows = await dbQuery(
        "SELECT user_id, merchant_id, item FROM orders WHERE order_num = $1",
        [order_id]
    );
    console.log("Queried order info:", rows[0]);
    return rows[0];
};

const findUserFromPriceTime = async (price, time) => {
    const rows = await dbQuery(
        "SELECT user_id FROM orders_time_formatted WHERE price = $1 AND formatted_time = $2",
        [price, time]
    );
    return rows[0].user_id;
};

//Update mugID in row of orders table with mugID from RFID reader
const updateOrderMugID = async (username, mugID) => {
    const sqlUpdate = await dbQuery(
        "UPDATE orders SET mug_id = $1 WHERE user_id = $2",
        [mugID, username]
    );
    console.log("Updated username", username, "with mugID", mugID);
}

//Update mug status in mugs table
const updateMugStatusInUse = async (mugID) => {
    const sqlUpdate = await dbQuery(
        "UPDATE mugs SET status = 'in_use' WHERE mug_id = $1",
        [mugID]
    );
    console.log("Updated mugID", mugID, "status to in_use");
};

//Use unique mugID to build payload out of order info
const getOrderByMugID = async (mugID) => {
    const rows = await dbQuery(
        "SELECT id, user_id, status, merchant_id, item FROM orders WHERE mug_id = $1",
        [mugID]
    );
    console.log("Queried order info for mugID", mugID, ":", rows[0]);
    return rows[0];
};

//Update mug status in mugs table to available
const updateMugStatusAvailable = async (mugID) => {
    const sqlUpdate = await dbQuery(
        "UPDATE mugs SET status = 'returned' WHERE mug_id = $1",
        [mugID]
    );
    console.log("Updated mugID", mugID, "status to returned");
}

//new function — updates an order's status column by order ID.
//called by the /return endpoint in server.js after a mug is scanned at the return bin.
//without this, the order stays as IN_PROGRESS in the DB forever even after the mug
//is physically returned, so the history tab would never show it as completed.
const updateOrderStatus = async (order_id, status) => {
    await dbQuery(
        "UPDATE orders SET status = $1 WHERE id = $2",
        [status, order_id]
    );
    console.log("Updated order", order_id, "status to", status);
}

//Add a new user into database
const addUser = async (user, pass, phone, name) => {
    const sqlUpdate = await dbQuery(
        "INSERT INTO users (username, password, phone_number, name) VALUES ($1, $2, $3, $4)",
        [user, pass, phone, name]
    );
    console.log("Added user", user);
}

//Find a user given username and password
const findUser = async (user, pass) => {
    const rows = await dbQuery(
        "SELECT * FROM users WHERE username = $1 AND password = $2",
        [user, pass]
    );
    console.log(rows[0]);
    return rows[0];
}

//Add browser-specific token to user
const addUserToken = async (uid, token) => {
    const sqlUpdate = await dbQuery(
        "UPDATE users SET token = $1 WHERE user_id = $2",
        [token, uid]
    );
    console.log("Added token ", token, " for user ", uid);
}

//Fetch user ID from token
const userFromToken = async (token) => {
    const rows = await dbQuery (
        "SELECT user_id, name, username, phone_number FROM users WHERE token = $1",
        [token]
    );
    return rows[0];
}

//Remove user token
const removeUserToken = async (uid) => {
    const sqlUpdate = await dbQuery(
        "UPDATE users SET token = NULL WHERE user_id = $1",
        [uid]
    );
    console.log("Removed token for user: ", uid);
}

const getUserOrders = async (uid) => {
    const rows = await dbQuery(
        "SELECT * FROM orders WHERE user_id = $1",
        [uid]
    );
    return rows;
}

const findUserFromPhoneNumber = async (phone) => {
    const rows = await dbQuery(
        "SELECT user_id FROM users WHERE phone_number = $1",
        [phone]
    );
    return rows[0].user_id;
}

export default {  
    insertOrder, 
    getOrderInfo,
    findUserFromPriceTime, 
    updateMugStatusAvailable, 
    updateOrderMugID, 
    updateMugStatusInUse, 
    getOrderByMugID, 
    addUser,
    updateOrderStatus, 
    findUser,
    addUserToken,
    userFromToken,
    removeUserToken,
    getUserOrders,
    findUserFromPhoneNumber,
    pool 
};
