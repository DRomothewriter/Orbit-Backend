import express from 'express';
import dotenv from 'dotenv';
dotenv.config();


const port = process.env.PORT || 3001;

const app = express();
app.use(express.json());


app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    console.log(`📰 API lista para usar`);
});

app.get('/', (req, res) => {
    res.json({ message: 'api works' });
});
