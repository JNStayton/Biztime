process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

//populate the DB with test data
beforeEach(async () => {
	const result = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ('test', 'Test', 'testtesttest') RETURNING code, name, description`
	);
	testCompany = result.rows[0];
});

//empty the DB after each test
afterEach(async () => {
	await db.query(`DELETE FROM companies`);
});

//using pg starts up a connection to the DB; end the connection
afterAll(async () => {
	await db.end();
});

describe('GET /companies', () => {
	test('Get all companies in the DB', async () => {
		const res = await request(app).get('/companies');
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ companies: [ testCompany ] });
	});
});

describe('GET /companies/:code', () => {
	test('Gets a single company based on its code', async () => {
		const res = await request(app).get(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			company: {
				code: 'test',
				description: 'testtesttest',
				invoices: null,
				name: 'Test'
			}
		});
	});
	test('Receive 404 status code with invalid code', async () => {
		const res = await request(app).get('/companies/afsdgfhgjkljkytruehd');
		expect(res.statusCode).toBe(404);
	});
});

describe('POST /companies', () => {
	test('Create a single company', async () => {
		const res = await request(app).post('/companies').send({
			name: 'testy mctesterson',
			description: 'this is NOT a test i repeat this is NOT a test'
		});
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			company: {
				code: 'testy-mctesterson',
				name: 'testy mctesterson',
				description: 'this is NOT a test i repeat this is NOT a test'
			}
		});
	});
	test('Receive 404 if insufficient company data sent', async () => {
		const res = await request(app).post('/companies').send({
			code: 'newTest',
			description: 'this is NOT a test i repeat this is NOT a test'
		});
		expect(res.statusCode).toBe(400);
	});
});

describe('PATCH /companies/:code', () => {
	test('Update a single company', async () => {
		const res = await request(app)
			.patch(`/companies/${testCompany.code}`)
			.send({ name: 'BIGTESTBOII', description: 'nananananananana BATMAN' });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			company: {
				code: 'test',
				name: 'BIGTESTBOII',
				description: 'nananananananana BATMAN'
			}
		});
	});
	test('Receive 400 if company not found', async () => {
		const res = await request(app)
			.patch('/companies/lalala')
			.send({ name: 'BIGTESTBOII', description: 'nananananananana BATMAN' });
		expect(res.statusCode).toBe(404);
	});
});

describe('DELETE /companies/:code', () => {
	test('Deletes a single company from the DB', async () => {
		const res = await request(app).delete(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ status: 'Deleted' });
	});
});
