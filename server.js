import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import morgan from 'morgan';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';
import momo from 'mtn-momo';

import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import multerRoutes from './routes/multerRoutes.js';
// import cloudinaryRoutes from './routes/cloudinaryRoutes.js';
// import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

connectDB();

const app = express();

const corsOptions = {
  origin: "https://anansesem-shop.onrender.com",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', multerRoutes);
// app.use('/api/upload', cloudinaryRoutes);
// app.use('/api/upload', uploadRoutes);

const { Collections } = momo.create({
    callbackHost: process.env.CALLBACK_HOST
});

const collections = Collections({
    userSecret: process.env.MTN_MOMO_COLLECTIONS_USER_SECRET,
    userId: process.env.MTN_MOMO_COLLECTIONS_USER_ID,
    primaryKey: process.env.MTN_MOMO_COLLECTIONS_PRIMARY_KEY
});

app.get('/api/config/paypal', (req, res) => res.send(process.env.PAYPAL_CLIENT_ID));

app.post('/api/config/momo', async (req, res) => {
    try {
        const transactionId = await collections.requestToPay({
            amount: req.body.reqAmount,
            currency: "EUR",
            externalId: "123456",
            payer: {
                partyIdType: "MSISDN",
                partyId: req.body.payerNumber
            },
            payerMessage: "testing",
            payeeNote: (req.body.order_id).toString()
        })
        res.json(collections.getTransaction(transactionId))
        console.log('Momo: ', collections.getBalance())
    } catch (error) {
        console.error(error)
    }
    
});

const __dirname = path.resolve();
// app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

if (process.env.NODE_ENV === 'production') { // For deployment purposes
    //app.use(express.static(path.join(__dirname, '/frontend/build')));
    // Define the URL of the frontend server
    const frontendURL = "https://anansesem-shop.onrender.com";
    
    // Redirect all requests to the frontend server
    app.get('*', (req, res) => {
        res.redirect(frontendURL + req.originalUrl);
    });

    // app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html')));
} else {
    app.get('/', (req, res) => {
        res.send('API is running...');
    })
}

app.use(notFound);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
