/*
if there's any packages that are not within node, if anything else needed to be installed
then it needs a package.json
*/

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');


const app = express();

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:9000"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});


app.use(cors({
  origin: 'http://localhost:9000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
}));


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/retrieve-cookie', (req, res) => {
  res.json({hi});
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

app.get('/auth/github', (req, res) => {
    console.log('auth_github passsed')
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = 'https://alison-nlw-gh-oauth.onrender.com/auth/github/callback';
    const scope = 'gist repo'; // Adjust the scope according to your needs
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`);
  });

app.get('/auth/github/callback', async (req, res) => {
  const code = req.query.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const accessToken = response.data.access_token;

    // Store the access token in localStorage via client-side script
    const script = `
      <script>
        localStorage.setItem('accessToken', '${accessToken}');
        window.location.href = '/auth/github/result';
      </script>
    `;
    res.send(script);
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
});

app.get('/auth/github/result', (req, res) => {
  const accessToken = req.cookies['accessToken']; // Access the accessToken cookie
  if (!accessToken) {
      return res.status(401).json({ error: 'Access token is missing' });
  }
  else{
    res.send("Authentication successful! You may close this window. " + accessToken);
  }
})


// Endpoint for the successful authentication page
app.get('/auth/success', (req, res) => {
  console.log("in auth/success")
    const html = `
        <html>
            <body>
                <script>
                    window.opener.postMessage({
                        type: 'authentication_complete'
                    }, 'http://localhost:9000/settings');
                    window.close();
                </script>
                <p>Authentication successful! You may close this window.</p>
            </body>
        </html>
    `;
    res.send(html);
});

app.get('/api/use_access_token', (req, res) => {
    const accessToken = req.cookies['accessToken'];
    if (!accessToken) {
        return res.status(401).json({ error: 'Access token is missing' });
    }
    
});

app.get('/api/proceed_with_auth', async (req, res) => {
    const accessToken = req.cookies['accessToken'];
    if (!accessToken) {
        return res.status(401).json({ error: 'Access token is missing' });
    }

    try {
        // Here, you'd use the accessToken as needed for your application logic
        // For example, interacting with the GitHub API
        console.log("Access token:", accessToken);
        // You can perform operations with the GitHub API or any other actions required

        res.json({ success: true, message: "Proceeding with authenticated actions" });
    } catch (error) {
        console.error("Error in proceeding with auth:", error);
        res.status(500).json({ error: 'Failed to proceed with authentication' });
    }
});


app.post('/api/upload-nlogo', async (req, res) => {
const { filename, content } = req.body;
const accessToken = req.headers['authorization']?.split(' ')[1]; // Retrieve the token from the Authorization header

if (!accessToken) {
  return res.status(401).json({ error: 'Access token is missing or invalid' });
}

const data = {
  description: "Uploaded from NetLogo",
  public: true,
  files: {
    [filename]: { content: content }
  }
};

try {
  const response = await axios.post('https://api.github.com/gists', data, {
    headers: {
      'Authorization': `token ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 201) {
    const gistUrl = response.data.html_url;
    res.json({ message: "Successfully uploaded to GitHub Gist", gistUrl: gistUrl });
  } else {
    res.status(500).json({ error: 'Failed to upload to GitHub Gist' });
  }
} catch (error) {
  res.status(500).json({ error: 'Error uploading to GitHub Gist' });
}
});
