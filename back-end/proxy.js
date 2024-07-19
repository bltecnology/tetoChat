const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/send-message', async (req, res) => {
  const { to, from, type, content } = req.body;
  console.log('Received request:', { to, from, type, content });

  try {
    const response = await axios.post(
      'https://api.callbell.eu/v1/messages/send',
      {
        to,
        from,
        type,
        content
      },
      {
        headers: {
          Authorization: `Bearer KmgyQDoJsH3zhET9RoZqmhFnEF2oyX9m.de0bc399333c9635f0d246e285bab13dcdad694d83e11f671022026db9d45b77`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('API response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error sending message:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      res.status(error.response.status).json({ error: error.response.data });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
