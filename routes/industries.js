const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const db = require('../db');
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM industries`);
		return res.json({ industries: results.rows });
	} catch (e) {
		return next(e);
	}
});

router.get('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(`SELECT * FROM industries WHERE code=$1`, [ code ]);
		if (results.rows == 0) {
			throw new ExpressError('That industry cannot be found', 404);
		}

		const allResults = await db.query(
			`SELECT c.name, i.field 
            FROM companies AS c 
            JOIN comp_indust 
            ON c.code = comp_indust.comp_code 
            JOIN industries AS i 
            ON comp_indust.ind_code = i.code 
            WHERE i.code=$1;`,
			[ code ]
		);
		return res.json({ companies: allResults.rows });
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		if (!req.body.field) {
			throw new ExpressError('Please give a unique field name', 400);
		}
		const { field } = req.body;
		const code = slugify(field, { lower: true, strict: true });

		const results = await db.query(`INSERT INTO industries (code, field) VALUES ($1, $2) RETURNING code, field`, [
			code,
			field
		]);

		return res.status(201).json({ industry: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.post('/company/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const companyResult = await db.query(`SELECT * FROM companies WHERE code=$1`, [ code ]);
		if (companyResult.rows == 0) {
			throw new ExpressError('That company is not in our DB', 404);
		}
		if (!req.body.industry_code) {
			throw new ExpressError('Please include a valid industry code to associate with this company', 400);
		}
		const { industry_code } = req.body;

		const newAssociation = await db.query(
			`INSERT INTO comp_indust (comp_code, ind_code) VALUES ($1, $2) RETURNING comp_code, ind_code`,
			[ code, industry_code ]
		);

		return res.status(200).json({ association: newAssociation.rows });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
