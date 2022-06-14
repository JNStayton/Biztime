const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

//get all invoices
router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM invoices`);
		return res.json({ invoices: results.rows });
	} catch (e) {
		return next(e);
	}
});

//get invoice by id
router.get('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(
			`SELECT i.id, 
                    i.comp_code, 
                    i.amt, 
                    i.paid, 
                    i.add_date, 
                    i.paid_date, 
                    c.name, 
                    c.description 
                    FROM invoices AS i 
                    JOIN companies AS c 
                    ON (i.comp_code = c.code) 
                    WHERE id=$1`,
			[ id ]
		);
		if (results.rows.length == 0) {
			throw new ExpressError('That id does not exist in our DB', 404);
		}

		const data = results.rows[0];
		const invoice = {
			id: data.id,
			amt: data.amt,
			paid: data.paid,
			add_date: data.add_date,
			paid_date: data.paid_date,
			company: {
				code: data.comp_code,
				name: data.name,
				description: data.description
			}
		};

		return res.json({ invoice: invoice });
	} catch (e) {
		return next(e);
	}
});

//create new invoice
router.post('/', async (req, res, next) => {
	try {
		if (!req.body.comp_code || !req.body.amt) {
			throw new ExpressError('Invoice requires a company code and amount', 400);
		}
		const { comp_code, amt } = req.body;
		const results = await db.query(
			`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ comp_code, amt ]
		);
		return res.status(201).json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

//edit an invoice
router.patch('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const { amt } = req.body;
		const results = await db.query(
			`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ amt, id ]
		);
		if (results.rows.length == 0) {
			throw new ExpressError('That invoice cannot be found in the DB', 404);
		}
		return res.status(200).json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

//delete a company
router.delete('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [ id ]);
		if (results.rows.length == 0) {
			throw new ExpressError('That invoice cannot be found in the DB', 404);
		}
		return res.send({ status: 'Deleted' });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
