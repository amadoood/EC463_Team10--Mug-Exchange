import { pool } from './database.js';

const insertOrder = async () => {
    const [sqlInsert] = await pool.query(
        "INSERT INTO orders (id, user_id, merchant_id) VALUES (?, ?, ?)",
        [1, 1001, 5678]
    );
    console.log("Inserted order number", order_num, "with insert ID", sqlInsert.insertId);
};

insertOrder();