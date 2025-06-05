import app from './app';

const port = process.env.PORT || 3010;

app.listen(port, () => {
  console.log(`Incident service running on port ${port}`);
});
