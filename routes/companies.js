const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const db = require('../db');
const slugify = require('slugify');

//get all companies
router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM companies`);
		return res.json({ companies: results.rows });
	} catch (e) {
		return next(e);
	}
});

//get company by code; also display invoice IDs for the company
router.get('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const companyResults = await db.query(`SELECT * FROM companies WHERE code=$1`, [ code ]);

		if (companyResults.rows == 0) {
			throw new ExpressError('That company does not exist in our DB', 404);
		}

		const invoiceResults = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [ code ]);

		const companyData = companyResults.rows[0];
		const invoiceData = invoiceResults.rows;

		if (invoiceData.length != 0) {
			companyData.invoices = invoiceData.map((invoice) => invoice.id);
		} else {
			companyData.invoices = null;
		}

		return res.json({ company: companyData });
	} catch (e) {
		return next(e);
	}
});

//create new company
router.post('/', async (req, res, next) => {
	try {
		if (!req.body.name || !req.body.description) {
			throw new ExpressError('Company requires a name and description', 400);
		}
		const { name, description } = req.body;
		const code = slugify(name, { lower: true, strict: true });
		const results = await db.query(
			`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
			[ code, name, description ]
		);
		return res.status(201).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

//edit a company
router.patch('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;
		const results = await db.query(
			`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING name, description, code`,
			[ name, description, code ]
		);
		if (results.rows.length == 0) {
			throw new ExpressError('That company cannot be found in the DB', 404);
		}
		return res.status(200).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

//delete a company
router.delete('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING code`, [ code ]);
		if (results.rows.length == 0) {
			throw new ExpressError('That company cannot be found in the DB', 404);
		}
		return res.send({ status: 'Deleted' });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
