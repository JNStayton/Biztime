/** BizTime express application. */

const express = require('express');
const app = express();
const ExpressError = require('./expressError');

app.use(express.json());

//use company routes with /company
const companyRoutes = require('./routes/companies');
app.use('/companies', companyRoutes);

//use invoice routes with /invoices
const invoiceRoutes = require('./routes/invoices');
app.use('/invoices', invoiceRoutes);

//use industry routes with /industries
const industryRoutes = require('./routes/industries');
app.use('/industries', industryRoutes);

/** 404 handler */
app.use(function(req, res, next) {
	const err = new ExpressError('Not Found', 404);
	return next(err);
});

/** general error handler */
app.use((err, req, res, next) => {
	res.status(err.status || 500);

	return res.json({
		error: err
	});
});

module.exports = app;
