import pool from '../services/db.js';
import fetch from '../helpers/fetch.js';
import { Router } from 'express';
import {
    createOne as createElement,
    readOne as readElement,
} from '../helpers/crud.js'
import { WESTERN_BANK_API_ENDPOINT, EAST_BANK_API_ENDPOINT } from '../config/index.config.js';
import { cardIsWestern, validateCardNumber, validateExpMonth, validateExpYear } from '../helpers/utils.js';

const router = new Router();

router.use('/', async function (req, res) {
    const { user_id, card_number, card_type, owner, exp_month, exp_year } = req.body;
    // console.log(req.body);
    // if(!card_type || !owner || !validateExpMonth(exp_month) || !validateExpYear(exp_year) 
    //     || !validateCardNumber(card_number)) {

    //     return res.status(400).json({ message: 'Bad request' });
    // }
    
    let userId;
    try {
        userId = (await readElement(
            'user', { 'user': ['id'] }, [], { id: user_id }, pool
        )).id;
    } catch(err) {
        if(err.message === 'Not found') {
            return res.status(404).json({ message: 'Person not found' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }

    let cardTypeId;
    try {
        cardTypeId = (await readElement(
            'card_type', { 'card_type': ['id'] }, [], { card_type }, pool
        )).id;
    } catch(err) {
        console.log(err);
        if(err.message === 'Not found') {
            return res.status(404).json({ message: 'Card type not found' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
    
    try {
        const { data, status } = await fetch(
            cardIsWestern(card_number) ? WESTERN_BANK_API_ENDPOINT : EAST_BANK_API_ENDPOINT,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    owner, card_number,
                    card_type_id: cardTypeId,
                },
            }
        );
        console.log(data);
        if (status !== 200) {
            return res.status(404).json({ message: `Card not found in ${cardIsWestern(card_number) ? 'Western' : 'East'} Bank` });
        }
    } catch (err) {
        return res.status(500).json({
            message: `Internal server error when requesting ${cardIsWestern(card_number) ? 'Western' : 'East'} Bank`
        });
    }

    let payMeth;
    try {
        payMeth = await createElement('payment_method', {
            user_id, card_number, card_type_id: cardTypeId, owner, exp_month, exp_year
        }, pool);
    } catch (err) {
        console.log(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Duplicate entry' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }

    res.status(201).json({
        message: 'Payment method created',
        id: payMeth.insertId,
    });
    // const { card_number } = req.body;
    // if(!user_id) return res.status(400).json({ message: 'Missing user_id' });
    
    // let cards; // userCards will be the cards that the user has from now on
    // try {
    //     cards = await readMany(
    //         'payment_method',
    //         { 'payment_method': ['card_number', 'owner', 'card_type_id'] },
    //         [],
    //         { 'user_id': user_id },
    //         null, null, pool
    //     );
    // } catch (err) {
    //     console.log(err);
    //     return res.status(500).json({ message: 'Internal server error' });
    // }
    
    // const promises = cards.map(card => {
    //     const endpoint = cardIsWestern(card.card_type_id) ? WESTERN_BANK_API_ENDPOINT : EAST_BANK_API_ENDPOINT;

    //     return fetch(endpoint, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: { card }
    //     });
    // });

    // let responses;
    // try {
    //     responses = await Promise.allSettled(promises);
    // } catch (err) {
    //     console.log(err);
    //     return res.status(500).json({ message: 'Internal server error' });
    // }
    // console.log(responses);
    
    // let balances = [];
    // for (let i = 0; i < responses.length; i++) {
    //     if (responses[i].value.status !== 200) {
    //         // return res.status(responses[i].value.status).json({ message: responses[i].value.data.message });
    //         balances.push({ card_number: cards[i].card_number, balance: 0 });
    //     }
    //     console.log(responses[i].value.data);
    //     const { balance } = responses[i].value.data;
    //     balances.push({ card_number: cards[i].card_number, balance });
    // }
    
    // res.status(200).json(balances);
});

export default router;
