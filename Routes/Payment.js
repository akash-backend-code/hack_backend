const express = require('express');
const axios = require('axios')
require("dotenv").config();
require("../db/database");
const User = require("../db/User");
const Cashfree = require('cashfree-pg');

Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
// Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

const router = express.Router();

router.post('/createorder', async (req, res) => {
    const { amount, customerEmail, customerPhone } = req.body;
    console.log("something hit")
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-Client-Id': {clientId:process.env.CASHFREE_APP_ID},
            'x-Client-Secret': {clientKey:process.env.CASHFREE_SECRET_KEY},
            'x-api-version': '2023-08-01',
            'Accept': 'application/json'
        },
        body: JSON.stringify( {
            order_amount: amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: `USER123`,
                customer_name: "joe",
                customer_email: "joe.s@cashfree.com",
                customer_phone: "+919876543210",
            },
            
        }),
    };

    try {
        const response = await fetch('https://sandbox.cashfree.com/pg/orders',options);
        const data = await response.json();
        console.log(data);
        res.json(data);
    } catch (error) {
        console.log('error')
        console.log(error)
        res.status(500).send(error.message);
    }
});

router.post('/createorder2', async (req, res) => {
    const { amount, customerEmail, customerPhone } = req.body;
    console.log("something hit")
    
    const options = {
        
            order_amount: amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: `cust_${Date.now()}`,
                customer_name: "test",
                customer_email: customerEmail,
                customer_phone: customerPhone,
            },
            order_note: 'Test Payment',
            order_meta: {
                return_url: `${process.env.FRONTEND}`,
            },
            "order_note": ""
    };

    try {
        const response = await Cashfree.PGCreateOrder("2023-08-01", options);
        console.log(response);
        res.json({ response });
    } catch (error) {
        console.log('error')
        console.log(error)
        res.status(500).send(error.message);
    }
});

module.exports = router;
