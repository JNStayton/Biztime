process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;
let testInvoice;

//populate the DB with test data
beforeEach(async () => {
	const companyResult = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ('test', 'Test', 'testtesttest') RETURNING code, name, description`
	);
	testCompany = companyResult.rows[0];

	const invoiceResult = await db.query(
		`INSERT INTO invoices (comp_code, amt) VALUES ('test', 69) RETURNING id, comp_code, amt, paid, add_date, paid_date`
	);
	testInvoice = invoiceResult.rows[0];
	testInvoice.add_date = '2022-06-15T06:00:00.000Z';

	testCompany.invoices = testInvoice;
});

//empty the DB after each test
afterEach(async () => {
	await db.query(`DELETE FROM companies`);
	await db.query(`DELETE FROM invoices`);
});

//using pg starts up a connection to the DB; end the connection
afterAll(async () => {
	await db.end();
});

describe('GET /invoices', () => {
	test('Get all invoices in the DB', async () => {
		const res = await request(app).get('/invoices');
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoices: [
				{
					id: testInvoice.id,
					amt: testInvoice.amt,
					paid: testInvoice.paid,
					add_date: expect.any(String),
					paid_date: testInvoice.paid_date,
					comp_code: testCompany.code
				}
			]
		});
	});
});

describe('GET /invoices/:id', () => {
	test('Get details about one invoice', async () => {
		const res = await request(app).get(`/invoices/${testInvoice.id}`);
		expect(res.body).toEqual({
			invoice: {
				id: testInvoice.id,
				amt: testInvoice.amt,
				paid: testInvoice.paid,
				add_date: expect.any(String),
				paid_date: testInvoice.paid_date,
				company: {
					code: testCompany.code,
					name: testCompany.name,
					description: testCompany.description
				}
			}
		});
	});
	test('Receive 404 if invalid invoice id', async () => {
		const res = await request(app).get('/invoices/1234567890');
		expect(res.statusCode).toBe(404);
	});
});

describe('POST /invoices', () => {
	test('Create a new invoice', async () => {
		const res = await request(app).post('/invoices').send({ comp_code: testCompany.code, amt: 666 });
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			invoice: {
				id: expect.any(Number),
				amt: 666,
				paid: false,
				add_date: expect.any(String),
				paid_date: null,
				comp_code: testCompany.code
			}
		});
	});
	test('Receive status code 400 if missing comp_code or amt', async () => {
		const res = await request(app).post('/invoices').send({ comp_code: testCompany.code });
		expect(res.statusCode).toBe(400);
	});
});

describe('PATCH /invoices/:id', () => {
	test('Patch a single invoice', async () => {
		const res = await request(app).patch(`/invoices/${testInvoice.id}`).send({ amt: 666 });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice: {
				id: expect.any(Number),
				comp_code: 'test',
				amt: 666,
				paid: false,
				add_date: expect.any(String),
				paid_date: null
			}
		});
	});
	test('Receive status code 404 if invoice cannot be found', async () => {
		const res = await request(app).get('/invoices/1234567890');
		expect(res.statusCode).toBe(404);
	});
});

describe('PUT /invoices/:id', () => {
	test('Update a single invoice paid status', async () => {
		const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 69, paid: true });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice: {
				id: expect.any(Number),
				comp_code: 'test',
				amt: 69,
				paid: true,
				add_date: expect.any(String),
				paid_date: expect.any(String)
			}
		});
	});
	test('Receive status code 404 if invoice cannot be found', async () => {
		const res = await request(app).get('/invoices/1234567890');
		expect(res.statusCode).toBe(404);
	});
	test('Receive status code 400 if paid status not included in body', async () => {
		const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 69 });
		expect(res.statusCode).toBe(400);
	});
});

describe('DELETE /invoices/:id', () => {
	test('Delete a single invoice', async () => {
		const res = await request(app).delete(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ status: 'Deleted' });
	});
	test('Receive status code 404 if invoice cannot be found', async () => {
		const res = await request(app).get('/invoices/1234567890');
		expect(res.statusCode).toBe(404);
	});
});
