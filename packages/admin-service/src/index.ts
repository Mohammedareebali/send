import app from './app';

const port = process.env.PORT || 3012;

app.listen(port, () => {
  console.log(`Admin service running on port ${port}`);
});
