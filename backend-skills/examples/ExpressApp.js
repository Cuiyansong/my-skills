const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Hello, Express!' });
});

app.get('/users', (req, res) => {
    const users = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
    ];
    res.json(users);
});

app.get('/users/:id', (req, res) => {
    const user = { id: req.params.id, name: 'John' };
    res.json(user);
});

app.post('/users', (req, res) => {
    const user = req.body;
    res.status(201).json(user);
});

app.put('/users/:id', (req, res) => {
    const user = { id: req.params.id, ...req.body };
    res.json(user);
});

app.delete('/users/:id', (req, res) => {
    res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});